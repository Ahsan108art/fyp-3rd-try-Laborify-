const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
  },
  rating: { type: Number, default: 0 },
  reviews: [{
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now },
  }],
  profileImage: { type: String, default: '' },
  skills: [{ type: String }],
  chargePerHour: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['available', 'occupied', 'offline', 'busy', 'on_job'],
    default: 'available',
  },
  currentJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  jobsCompleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

workerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Worker', workerSchema);
