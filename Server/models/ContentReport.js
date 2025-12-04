const mongoose = require('mongoose');

const contentReportSchema = new mongoose.Schema({
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History',
    required: true
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous reports
  },
  reporterEmail: {
    type: String,
    required: false
  },
  reason: {
    type: String,
    required: true,
    enum: ['inappropriate_content', 'copyright_violation', 'spam', 'violence', 'adult_content', 'other']
  },
  description: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContentReport', contentReportSchema);