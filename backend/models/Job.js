const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  issueSummary: { type: String, default: '' },
  imageUrl: { type: String },
  images: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  address: { type: String, default: '' },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
  preferredTime: { type: String, default: '' },
  budgetMin: { type: Number, default: 0 },
  budgetMax: { type: Number, default: 0 },
  status: { type: String, enum: ['pending_worker_selection', 'open', 'assigned', 'in_progress', 'completed', 'cancelled'], default: 'pending_worker_selection' },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedLaborId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  createdAt: { type: Date, default: Date.now }
});

jobSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Job', jobSchema);

