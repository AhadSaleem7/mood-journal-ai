const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    mood_score: {
        type: Number,
        required: true
    },
    dominant_emotion: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        default: ''
    },
    Advice: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Entry', EntrySchema);
