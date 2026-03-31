const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const prisma = require('../config/db');
const {
  truncateNotes,
  extractPdfText,
  generateFlashcardsFromText,
  MIN_PDF_TEXT_CHARS,
} = require('../services/geminiFlashcards');

// ADDED
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const nameOk = (file.originalname || '').toLowerCase().endsWith('.pdf');
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/x-pdf' ||
      (file.mimetype === 'application/octet-stream' && nameOk);
    if (ok) cb(null, true);
    else cb(new Error('Only application/pdf is allowed'));
  },
});

/** Multipart only; JSON body must be parsed by `express.json()` on the app (see index.js). */
function generateRequestParser(req, res, next) {
  const ct = String(req.headers['content-type'] || '');
  if (ct.includes('multipart/form-data')) {
    return upload.single('file')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: 'file too large' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'upload error' });
    });
  }
  return next();
}


router.get('/decks', auth,async (req, res) => {
    const decks = await prisma.deck.findMany({ where: {userId: req.userId}});
    res.json(decks);
});

router.post('/decks', auth,async (req, res) => {
    try {
        const { title } = req.body;
        const deck = await prisma.deck.create({
            data:{
                title,
                userId: req.userId
            }
        });
        res.status(201).json(deck);        
    } catch (err) {
        return res.status(500).json({ message: 'deck error: ' + err.message});
    }
});

router.patch('/decks/:id', auth, async (req, res) => {
    try {
        const { title } = req.body;
        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: 'title is required' });
        }

        const existing = await prisma.deck.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!existing) {
            return res.status(404).json({ message: 'deck not found' });
        }

        const deck = await prisma.deck.update({
            where: { id: existing.id },
            data: { title: title.trim() },
        });
        return res.json(deck);
    } catch (err) {
        return res.status(500).json({ message: 'deck error: ' + err.message });
    }
});

router.delete('/decks/:id', auth, async (req, res) => {
    try {
        const result = await prisma.deck.deleteMany({
            where: { id: req.params.id, userId: req.userId },
        });
        if (result.count === 0) {
            return res.status(404).json({ message: 'deck not found' });
        }
        return res.status(204).send();
    } catch (err) {
        return res.status(500).json({ message: 'deck error: ' + err.message });
    }
});

// ADDED
router.get('/decks/:id', auth, async (req, res) => {
    try {
        const deck = await prisma.deck.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!deck) return res.status(404).json({ message: 'deck not found' });
        return res.json(deck);
    } catch (err) {
        return res.status(500).json({ message: 'deck error: ' + err.message });
    }
});

// ADDED
router.post('/decks/:id/generate', auth, generateRequestParser, async (req, res) => {
    try {
        const deck = await prisma.deck.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!deck) return res.status(404).json({ message: 'deck not found' });

        const ct = String(req.headers['content-type'] || '');
        const isMultipart = ct.includes('multipart/form-data');

        let text;
        let options = {};

        if (isMultipart) {
            if (!req.file) {
                return res.status(400).json({ message: 'PDF file is required for multipart requests' });
            }
            if (req.body?.notes) {
                return res.status(400).json({
                    message: 'send either a PDF file or notes, not both',
                });
            }
            console.log('[generate PDF] req.file:', req.file
                ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size, bufferLen: req.file.buffer?.length }
                : null);
            try {
                if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
                    return res.status(400).json({ message: 'failed to read PDF' });
                }
                text = await extractPdfText(req.file.buffer);
            } catch (err) {
                console.error('[generate PDF] extractPdfText:', err?.message || err);
                return res.status(400).json({ message: 'failed to read PDF' });
            }
            if (text.length < MIN_PDF_TEXT_CHARS) {
                return res.status(400).json({
                    message:
                        'Could not extract enough text from this PDF. Try a text-based PDF or paste your notes instead.',
                });
            }
            text = truncateNotes(text);
            if (req.body?.options) {
                try {
                    options =
                        typeof req.body.options === 'string'
                            ? JSON.parse(req.body.options)
                            : req.body.options;
                } catch {
                    return res.status(400).json({ message: 'invalid options JSON' });
                }
            }
        } else {
            const { notes } = req.body || {};
            if (typeof notes !== 'string' || !notes.trim()) {
                return res.status(400).json({ message: 'notes is required for JSON requests' });
            }
            if (req.body?.file !== undefined) {
                return res.status(400).json({ message: 'use multipart/form-data to upload a PDF' });
            }
            text = truncateNotes(notes);
            options = req.body?.options && typeof req.body.options === 'object' ? req.body.options : {};
        }

        let generated;
        try {
            generated = await generateFlashcardsFromText(text, options);
        } catch (e) {
            if (e.code === 'NO_API_KEY') {
                return res.status(503).json({ message: 'AI is not configured' });
            }
            const httpStatus = typeof e.status === 'number' ? e.status : null;
            const msg429 =
                'Gemini quota or rate limit hit for this model. Wait and retry, or try GEMINI_MODEL=gemini-2.5-flash-lite in backend/.env for a lighter quota tier.';
            if (httpStatus === 429 || String(e.message || '').includes('429')) {
                console.error('[generate] Gemini 429:', e.message);
                return res.status(429).json({ message: msg429 });
            }
            if (httpStatus === 403) {
                console.error('[generate] Gemini 403:', e.message);
                return res.status(502).json({
                    message: 'Gemini rejected the request. Check that your API key is valid and the Generative Language API is enabled.',
                });
            }
            if (httpStatus === 404) {
                console.error('[generate] Gemini 404:', e.message);
                return res.status(502).json({
                    message:
                        'Unknown Gemini model name. Check GEMINI_MODEL in backend/.env (e.g. gemini-2.5-flash or gemini-2.5-flash-lite).',
                });
            }
            console.error('[generate] Gemini error:', e.message);
            return res.status(502).json({
                message: "Couldn't generate cards right now. Try again in a moment.",
            });
        }

        const agg = await prisma.card.aggregate({
            where: { deckId: deck.id },
            _max: { order: true },
        });
        let nextOrder = (agg._max.order ?? -1) + 1;

        const created = [];
        for (const c of generated) {
            const card = await prisma.card.create({
                data: {
                    front: c.front,
                    back: c.back,
                    order: nextOrder++,
                    deckId: deck.id,
                },
            });
            created.push(card);
        }

        return res.status(201).json({ cards: created });
    } catch (err) {
        return res.status(500).json({ message: 'deck error: ' + err.message });
    }
});

module.exports = router;
