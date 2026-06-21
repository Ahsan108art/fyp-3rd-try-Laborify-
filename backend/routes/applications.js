const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { jobId, proposalText, proposedPrice } = req.body;
    
    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    // Check if worker is available
    const worker = await Worker.findById(req.user.id);
    if (worker && (worker.status === 'occupied' || worker.status === 'on_job')) {
      return res.status(400).json({ message: 'You cannot apply while on another job' });
    }

    // Check for duplicate application
    const existingApp = await Application.findOne({ jobId, laborId: req.user.id });
    if (existingApp) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const application = new Application({
      jobId, laborId: req.user.id, proposalText, proposedPrice
    });
    await application.save();

    // Create Notification and emit websocket
    const notif = new Notification({
      userId: job.creatorId,
      message: `Someone applied to your job: ${job.title}`,
      type: 'application',
      referenceId: application.id
    });
    await notif.save();
    
    // Real-time update
    req.io.to(job.creatorId.toString()).emit('notification', notif);

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId }).populate('laborId', 'name rating profileImage');
    res.json(applications);
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/accept', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Not found' });

    // Check if worker is still available (prevent double-booking)
    const worker = await Worker.findById(application.laborId);
    if (worker && (worker.status === 'occupied' || worker.status === 'on_job')) {
      return res.status(400).json({ message: 'This worker is currently occupied and cannot be hired' });
    }

    application.status = 'accepted';
    await application.save();

    // Update the job
    const job = await Job.findById(application.jobId);
    job.assignedLaborId = application.laborId;
    // Also set assignedWorkerId if the labor is in the Worker collection
    if (worker) {
      job.assignedWorkerId = worker._id;
    }
    job.status = 'assigned';
    await job.save();

    // Update worker status to occupied
    if (worker) {
      worker.status = 'occupied';
      worker.currentJobId = job._id;
      await worker.save();

      // Broadcast worker status change to all clients
      req.io.emit('worker_status_changed', {
        workerId: worker._id.toString(),
        status: 'occupied',
        isOnline: worker.isOnline,
      });
    }

    // Reject all other pending applications for this job
    await Application.updateMany(
      { jobId: application.jobId, _id: { $ne: application._id }, status: 'pending' },
      { status: 'rejected' }
    );

    // Notify the accepted labor
    const notif = new Notification({
      userId: application.laborId,
      message: `Your application for ${job.title} was accepted!`,
      type: 'system',
      referenceId: job.id
    });
    await notif.save();
    req.io.to(application.laborId.toString()).emit('notification', notif);

    // Broadcast job status change
    req.io.emit('job_status_changed', {
      jobId: job._id.toString(),
      status: 'assigned',
    });

    res.json(application);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
