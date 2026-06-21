const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    const { name, phoneNumber, password, role } = req.body;

    // Check both collections for duplicate phone
    const existingUser = await User.findOne({ phoneNumber });
    const existingWorker = await Worker.findOne({ phoneNumber });
    if (existingUser || existingWorker) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === 'labor') {
      const worker = new Worker({ name, phoneNumber, password: hashedPassword });
      await worker.save();
      const token = jwt.sign(
        { user: { id: worker.id, role: 'labor' } },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      return res.json({ token, user: { id: worker.id, name: worker.name, role: 'labor', phoneNumber: worker.phoneNumber } });
    }

    const user = new User({ name, phoneNumber, password: hashedPassword, role: 'user' });
    await user.save();
    const token = jwt.sign(
      { user: { id: user.id, role: user.role } },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, phoneNumber: user.phoneNumber } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Check client (User) collection first
    let account = await User.findOne({ phoneNumber });
    let role = account?.role ?? null;

    // Fall back to Worker collection
    if (!account) {
      account = await Worker.findOne({ phoneNumber });
      if (account) role = 'labor';
    }

    if (!account) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign(
      { user: { id: account.id, role } },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: account.id, name: account.name, role, phoneNumber: account.phoneNumber } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
