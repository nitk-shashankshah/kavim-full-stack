const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../schema');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => {
  const { password, ...rest } = user.toJSON();
  return rest;
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email: email.toLowerCase(), password: hashed });
    res.status(201).json({ user: safeUser(user), token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ user: safeUser(user), token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (email)    updates.email = email.toLowerCase();
    if (password) updates.password = await bcrypt.hash(password, 10);

    const [, [user]] = await User.update(updates, {
      where: { id: req.user.id },
      returning: true,
    });
    res.json({ user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};
