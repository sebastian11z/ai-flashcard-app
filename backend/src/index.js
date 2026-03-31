const path = require('path');
// Load env before any other modules read process.env (repo root, then backend/)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });


const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const deckRoutes = require('./routes/decks');
const cardRoutes = require('./routes/cards');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: false,
  })
);
app.use(express.json());
app.use(authRoutes);
app.use(deckRoutes);
app.use(cardRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
