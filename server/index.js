const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Load environment variables
dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL?.replace(/\/$/, '') || '*',
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

// Google Login
app.post('/api/google-login', async (req, res) => {
    try {
        const { credential } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        const email = payload.email || payload.name || "user";
        const sub = payload.sub; // Google's unique user ID
        
        // Slice the email before the @ sign
        let baseUsername = email.includes('@') ? email.split('@')[0] : email;
        
        // Find existing Google Auth user or user who previously signed up with this email
        let user = await User.findOne({ 
            $or: [{ googleId: sub }, { username: email }] 
        });

        if (!user) {
            // Ensure username is unique
            let isTaken = await User.findOne({ username: baseUsername });
            if (isTaken) {
                baseUsername = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
            }

            // New user via Google
            user = new User({
                username: baseUsername,
                googleId: sub
            });
            await user.save();
        } else if (!user.googleId || user.username.includes('@')) {
            // Existing user signing in with Google for the first time
            // Or updating old full-email username to the sliced version
            user.googleId = sub;
            
            let isTaken = await User.findOne({ username: baseUsername });
            if (!isTaken || isTaken._id.equals(user._id)) {
                user.username = baseUsername;
            }
            
            await user.save();
        }

        // Issue standard app JWT
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ token, username: user.username });
    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(400).json({ message: 'Google authentication failed' });
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
