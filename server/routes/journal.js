import express from 'express';
import natural from 'natural';
import JournalEntry from '../models/JournalEntry.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const tokenizer = new natural.WordTokenizer();
const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

// Enhanced mood detection with more nuanced scoring
const determineMood = (score) => {
  if (score > 4) return 'Ecstatic';
  if (score > 2) return 'Happy';
  if (score > 0.5) return 'Content';
  if (score > -0.5) return 'Neutral';
  if (score > -2) return 'Sad';
  if (score > -4) return 'Depressed';
  return 'Very Depressed';
};

// Enhanced sentiment analysis with natural language processing
const analyzeSentiment = (text) => {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const score = analyzer.getSentiment(tokens);
  
  // Adjust score based on emotional keywords
  const emotionalKeywords = {
    positive: ['happy', 'joy', 'excited', 'wonderful', 'love', 'great', 'amazing'],
    negative: ['sad', 'depressed', 'anxious', 'worried', 'stressed', 'angry', 'upset']
  };

  let adjustment = 0;
  tokens.forEach(token => {
    if (emotionalKeywords.positive.includes(token)) adjustment += 0.5;
    if (emotionalKeywords.negative.includes(token)) adjustment -= 0.5;
  });

  const finalScore = score + adjustment;
  return {
    score: finalScore,
    mood: determineMood(finalScore)
  };
};

router.post('/analyze', auth, (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }
  
  const result = analyzeSentiment(text);
  res.json(result);
});

// @route   POST /api/journal
// @desc    Create new journal entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, sentimentScore, mood, tags } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    // Create new entry
    const newEntry = new JournalEntry({
      user: req.user.id,
      title,
      content,
      sentimentScore: sentimentScore || 0,
      mood: mood || 'Neutral',
      tags: {
        emotions: tags?.emotions || [],
        people: tags?.people || [],
        activities: tags?.activities || []
      }
    });
    
    const entry = await newEntry.save();
    res.status(201).json(entry);
  } catch (err) {
    console.error('Error creating journal entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/journal
// @desc    Get all journal entries for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    console.error('Error fetching journal entries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/journal/:id
// @desc    Get a specific journal entry
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Check if entry belongs to user
    if (entry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(entry);
  } catch (err) {
    console.error('Error fetching journal entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/journal/:id
// @desc    Update a journal entry
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, sentimentScore, mood, tags } = req.body;
    
    // Find entry
    let entry = await JournalEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Check if entry belongs to user
    if (entry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update entry
    entry.title = title || entry.title;
    entry.content = content || entry.content;
    entry.sentimentScore = sentimentScore !== undefined ? sentimentScore : entry.sentimentScore;
    entry.mood = mood || entry.mood;
    
    if (tags) {
      entry.tags = {
        emotions: tags.emotions || entry.tags.emotions,
        people: tags.people || entry.tags.people,
        activities: tags.activities || entry.tags.activities
      };
    }
    
    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error('Error updating journal entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/journal/:id
// @desc    Delete a journal entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Check if entry belongs to user
    if (entry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await entry.remove();
    res.json({ message: 'Entry removed' });
  } catch (err) {
    console.error('Error deleting journal entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;