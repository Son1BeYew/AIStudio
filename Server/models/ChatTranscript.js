const mongoose = require("mongoose");

const chatTranscriptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
    },
    transcript: {
      type: String,
      required: true,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatTranscript", chatTranscriptSchema);
