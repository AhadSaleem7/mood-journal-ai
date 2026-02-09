const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());

// Models
const User = require('./models/User');
const Entry = require('./models/Entry');

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Auth Middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// Routes

// --- Auth Routes ---

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            username,
            password: hashedPassword
        });

        await user.save();

        // Create token
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ token, username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Create token
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ token, username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Entry Routes ---

// Get all entries for logged in user
app.get('/api/entries', auth, async (req, res) => {
    try {
        const entries = await Entry.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new entry
app.post('/api/entries', auth, async (req, res) => {
    try {
        const { text, mood_score, dominant_emotion, summary, Advice } = req.body;

        const newEntry = new Entry({
            userId: req.user.id,
            text,
            mood_score,
            dominant_emotion,
            summary,
            Advice,
        });

        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
