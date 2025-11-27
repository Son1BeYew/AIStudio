const mongoose = require("mongoose");

const premiumPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['FREE', 'PRO', 'MAX']
  },
  displayName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true,
    enum: ['Vĩnh viễn', '1 tháng', '1 năm (tiết kiệm 17%)']
  },
  features: [{
    type: String,
    required: true
  }],
  icon: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    default: null
  },
  popular: {
    type: Boolean,
    default: false
  },
  yearlyDiscount: {
    type: Number,
    default: 0
  },
  credits: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("PremiumPlan", premiumPlanSchema);