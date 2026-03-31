const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const exists = await prisma.user.findUnique({
      where: { email },
    });
    if (exists) return res.status(400).json({ message: 'email already exists' });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid Credentials' });

    const compare = await bcrypt.compare(password, user.password);
    if (!compare) return res.status(401).json({ message: 'Invalid Password' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { id: user.id, email } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

router.post('/auth/register', register);
router.post('/auth/login', login);

module.exports = router;
