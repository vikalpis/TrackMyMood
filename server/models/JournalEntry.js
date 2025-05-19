import mongoose from 'mongoose';

const JournalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  sentimentScore: {
    type: Number,
    required: true
  },
  mood: {
    type: String,
    required: true
  },
  tags: {
    emotions: [String],
    people: [String],
    activities: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
JournalEntrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const JournalEntry = mongoose.model('JournalEntry', JournalEntrySchema);

export default JournalEntry;