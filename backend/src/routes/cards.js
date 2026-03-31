const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const prisma = require('../config/db');

async function getOwnedDeck(deckId, userId) {
  return prisma.deck.findFirst({
    where: { id: deckId, userId },
  });
}

router.get('/decks/:deckId/cards', auth, async (req, res) => {
  try {
    const deck = await getOwnedDeck(req.params.deckId, req.userId);
    if (!deck) return res.status(404).json({ message: 'deck not found' });

    const cards = await prisma.card.findMany({
      where: { deckId: deck.id },
      orderBy: { order: 'asc' },
    });
    return res.json(cards);
  } catch (err) {
    return res.status(500).json({ message: 'cards error: ' + err.message });
  }
});

router.post('/decks/:deckId/cards', auth, async (req, res) => {
  try {
    const deck = await getOwnedDeck(req.params.deckId, req.userId);
    if (!deck) return res.status(404).json({ message: 'deck not found' });

    const { front, back, order } = req.body;
    if (typeof front !== 'string' || typeof back !== 'string' || !front.trim() || !back.trim()) {
      return res.status(400).json({ message: 'front and back are required' });
    }

    let nextOrder = 0;
    if (order !== undefined && order !== null) {
      const n = Number(order);
      if (!Number.isFinite(n)) return res.status(400).json({ message: 'order must be a number' });
      nextOrder = Math.floor(n);
    } else {
      const agg = await prisma.card.aggregate({
        where: { deckId: deck.id },
        _max: { order: true },
      });
      nextOrder = (agg._max.order ?? -1) + 1;
    }

    const card = await prisma.card.create({
      data: {
        front: front.trim(),
        back: back.trim(),
        order: nextOrder,
        deckId: deck.id,
      },
    });
    return res.status(201).json(card);
  } catch (err) {
    return res.status(500).json({ message: 'cards error: ' + err.message });
  }
});

router.get('/decks/:deckId/cards/:cardId', auth, async (req, res) => {
  try {
    const deck = await getOwnedDeck(req.params.deckId, req.userId);
    if (!deck) return res.status(404).json({ message: 'deck not found' });

    const card = await prisma.card.findFirst({
      where: { id: req.params.cardId, deckId: deck.id },
    });
    if (!card) return res.status(404).json({ message: 'card not found' });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: 'cards error: ' + err.message });
  }
});

router.patch('/decks/:deckId/cards/:cardId', auth, async (req, res) => {
  try {
    const deck = await getOwnedDeck(req.params.deckId, req.userId);
    if (!deck) return res.status(404).json({ message: 'deck not found' });

    const existing = await prisma.card.findFirst({
      where: { id: req.params.cardId, deckId: deck.id },
    });
    if (!existing) return res.status(404).json({ message: 'card not found' });

    const { front, back, order } = req.body;
    const data = {};
    if (front !== undefined) {
      if (typeof front !== 'string' || !front.trim()) {
        return res.status(400).json({ message: 'front must be a non-empty string' });
      }
      data.front = front.trim();
    }
    if (back !== undefined) {
      if (typeof back !== 'string' || !back.trim()) {
        return res.status(400).json({ message: 'back must be a non-empty string' });
      }
      data.back = back.trim();
    }
    if (order !== undefined) {
      const n = Number(order);
      if (!Number.isFinite(n)) return res.status(400).json({ message: 'order must be a number' });
      data.order = Math.floor(n);
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'no valid fields to update' });
    }

    const card = await prisma.card.update({
      where: { id: existing.id },
      data,
    });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: 'cards error: ' + err.message });
  }
});

router.delete('/decks/:deckId/cards/:cardId', auth, async (req, res) => {
  try {
    const deck = await getOwnedDeck(req.params.deckId, req.userId);
    if (!deck) return res.status(404).json({ message: 'deck not found' });

    const result = await prisma.card.deleteMany({
      where: { id: req.params.cardId, deckId: deck.id },
    });
    if (result.count === 0) return res.status(404).json({ message: 'card not found' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'cards error: ' + err.message });
  }
});

module.exports = router;
