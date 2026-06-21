const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E6) + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST /api/jobs — create a new job with enhanced details
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title, description, category, latitude, longitude,
      address, urgency, preferredTime, budgetMin, budgetMax, issueSummary
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    let location = undefined;
    if (longitude && latitude) {
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);
      // Validate coordinates are within valid range
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }
      location = { type: 'Point', coordinates: [lng, lat] };
    }

    // Handle multiple image uploads
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/${file.filename}`);
      });
    }
    // Also support legacy single 'image' field from old requests
    if (req.file) {
      imageUrls.push(`/uploads/${req.file.filename}`);
    }

    const newJob = new Job({
      title,
      description,
      category,
      issueSummary: issueSummary || '',
      imageUrl: imageUrls[0] || '',
      images: imageUrls,
      location,
      address: address || '',
      urgency: urgency || 'medium',
      preferredTime: preferredTime || '',
      budgetMin: budgetMin ? parseFloat(budgetMin) : 0,
      budgetMax: budgetMax ? parseFloat(budgetMax) : 0,
      creatorId: req.user.id
    });

    await newJob.save();
    res.json(newJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/jobs — list jobs with profession-based filtering for laborers
router.get('/', auth, async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    let query = {};

    // Filter jobs by worker's skills when the requester is a worker
    if (req.user.role === 'labor') {
      // Only show open jobs to laborers
      query.status = 'open';

      const worker = await Worker.findById(req.user.id).select('skills');
      if (worker && worker.skills && worker.skills.length > 0) {
        const skillRegexes = worker.skills.map(skill => new RegExp('^' + skill.trim() + '$', 'i'));
        query.category = { $in: skillRegexes };
      } else {
        // If a laborer has no skills configured, they should see NO jobs, not ALL jobs
        return res.json([]);
      }
    }

    if (lat && lng && radius) { // Location based filtering
      const parsedLng = parseFloat(lng);
      const parsedLat = parseFloat(lat);
      if (!isNaN(parsedLng) && !isNaN(parsedLat)) {
        query.location = {
          $near: {
            $geometry: { type: "Point", coordinates: [parsedLng, parsedLat] },
            $maxDistance: parseInt(radius) * 1000 // converts km to meters
          }
        };
      }
    }

    const jobs = await Job.find(query)
      .populate('creatorId', 'name rating profileImage phoneNumber location')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/jobs/:id — get single job details (now with auth)
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('creatorId', 'name rating profileImage phoneNumber location')
      .populate('assignedWorkerId', 'name rating profileImage phoneNumber skills chargePerHour');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch(err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/jobs/:id/status — update job status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Only creator or assigned worker can update status
    const userId = req.user.id;
    const isCreator = job.creatorId.toString() === userId;
    const isAssigned = (job.assignedLaborId && job.assignedLaborId.toString() === userId) ||
                       (job.assignedWorkerId && job.assignedWorkerId.toString() === userId);

    if (!isCreator && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    job.status = status;
    await job.save();

    // If job is completed, release the worker
    if (status === 'completed' || status === 'cancelled') {
      const workerId = job.assignedWorkerId || job.assignedLaborId;
      if (workerId) {
        const worker = await Worker.findByIdAndUpdate(workerId, {
          status: 'available',
          currentJobId: null,
        }, { new: true });

        // Broadcast worker availability change
        if (req.io && worker) {
          req.io.emit('worker_status_changed', {
            workerId: worker._id.toString(),
            status: 'available',
            isOnline: worker.isOnline,
          });
        }
      }
    }

    // Broadcast job status change
    if (req.io) {
      req.io.emit('job_status_changed', {
        jobId: job._id.toString(),
        status: job.status,
      });
    }

    res.json(job);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/jobs/:id/complete — mark job as completed and release worker
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.status = 'completed';
    await job.save();

    // Release the assigned worker
    const workerId = job.assignedWorkerId || job.assignedLaborId;
    if (workerId) {
      const worker = await Worker.findById(workerId);
      if (worker) {
        worker.status = 'available';
        worker.currentJobId = null;
        worker.jobsCompleted = (worker.jobsCompleted || 0) + 1;
        await worker.save();

        if (req.io) {
          req.io.emit('worker_status_changed', {
            workerId: worker._id.toString(),
            status: 'available',
            isOnline: worker.isOnline,
          });
        }
      }
    }

    if (req.io) {
      req.io.emit('job_status_changed', {
        jobId: job._id.toString(),
        status: 'completed',
      });
    }

    res.json(job);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
