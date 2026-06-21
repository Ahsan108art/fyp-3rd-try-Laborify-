const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// GET /api/workers/me — current worker's profile + stats
router.get('/me', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id).select('-password');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const jobsCompleted = await Job.countDocuments({
      $or: [
        { assignedLaborId: req.user.id },
        { assignedWorkerId: req.user.id },
      ],
      status: 'completed',
    });

    res.json({
      _id: worker._id,
      name: worker.name,
      phoneNumber: worker.phoneNumber,
      role: 'labor',
      rating: worker.rating || 0,
      skills: worker.skills || [],
      location: worker.location,
      profileImage: worker.profileImage || '',
      chargePerHour: worker.chargePerHour || 0,
      isOnline: worker.isOnline || false,
      status: worker.status || 'available',
      currentJobId: worker.currentJobId || null,
      jobsCompleted,
      reviewCount: worker.reviews ? worker.reviews.length : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/workers/nearby — find workers near given coords
// Removes fake distances, filters out occupied workers, expands radius if needed
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius = '20', category } = req.query;

    // Base query: only available workers (not occupied/on_job)
    let baseQuery = {
      status: { $in: ['available'] },
      isOnline: true,
    };

    if (category && category !== 'all') {
      baseQuery.skills = { $in: [new RegExp(category.replace(/-/g, ' '), 'i')] };
    }

    let workers = [];
    const clientLat = lat ? parseFloat(lat) : null;
    const clientLng = lng ? parseFloat(lng) : null;

    if (clientLat && clientLng) {
      // Try with expanding radius: 20km → 50km → 100km
      const radiusSteps = [parseFloat(radius), 50, 100];

      for (const r of radiusSteps) {
        try {
          workers = await Worker.find({
            ...baseQuery,
            'location.coordinates': { $ne: [0, 0] },
            location: {
              $near: {
                $geometry: { type: 'Point', coordinates: [clientLng, clientLat] },
                $maxDistance: r * 1000,
              },
            },
          })
            .select('name rating skills location profileImage chargePerHour reviews isOnline phoneNumber status jobsCompleted')
            .limit(20);
        } catch {
          workers = [];
        }

        if (workers.length > 0) break;
      }
    }

    const result = workers.map((w) => {
      const coords = w.location?.coordinates;
      let distance = null;
      let distanceMeters = null;

      if (clientLat && clientLng && coords && (coords[0] !== 0 || coords[1] !== 0)) {
        const d = haversine([clientLng, clientLat], coords);
        distanceMeters = d;
        distance = d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`;
      } else {
        distance = 'Unknown';
      }

      return {
        _id: w._id,
        name: w.name,
        rating: +(w.rating || 0).toFixed(1),
        skills: w.skills || [],
        location: w.location,
        profileImage: w.profileImage || '',
        chargePerHour: w.chargePerHour || 0,
        jobsCompleted: w.jobsCompleted || 0,
        isOnline: w.isOnline || false,
        status: w.status || 'available',
        phoneNumber: w.phoneNumber || '',
        distance,
        distanceMeters,
      };
    });

    // Sort by distance (closest first), unknown distances at end
    result.sort((a, b) => {
      if (a.distanceMeters === null && b.distanceMeters === null) return 0;
      if (a.distanceMeters === null) return 1;
      if (b.distanceMeters === null) return -1;
      return a.distanceMeters - b.distanceMeters;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/workers/location — update worker's GPS position
router.put('/location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ message: 'lat/lng required' });

    await Worker.findByIdAndUpdate(req.user.id, {
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/workers/profile — update skills, chargePerHour, isOnline
router.put('/profile', auth, async (req, res) => {
  try {
    const { skills, chargePerHour, isOnline } = req.body;
    const update = {};
    if (skills !== undefined) update.skills = skills;
    if (chargePerHour !== undefined) update.chargePerHour = parseFloat(chargePerHour);
    if (isOnline !== undefined) {
      update.isOnline = Boolean(isOnline);
      // When going online, set status to available; when going offline, set to offline
      if (isOnline) {
        update.status = 'available';
      } else {
        update.status = 'offline';
      }
    }

    const worker = await Worker.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    
    // Broadcast status change to all connected clients
    if (req.io && update.status) {
      req.io.emit('worker_status_changed', {
        workerId: worker._id.toString(),
        status: worker.status,
        isOnline: worker.isOnline,
      });
    }

    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/workers/status — update worker availability status
router.put('/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['available', 'occupied', 'offline', 'busy', 'on_job'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const update = { status };
    if (status === 'available') {
      update.currentJobId = null;
    }
    if (status === 'offline') {
      update.isOnline = false;
    }

    const worker = await Worker.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    
    // Broadcast status change
    if (req.io) {
      req.io.emit('worker_status_changed', {
        workerId: worker._id.toString(),
        status: worker.status,
        isOnline: worker.isOnline,
      });
    }

    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Haversine distance in metres
function haversine(a, b) {
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function toRad(d) { return (d * Math.PI) / 180; }

module.exports = router;
