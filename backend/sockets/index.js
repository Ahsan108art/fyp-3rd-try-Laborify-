const User = require('../models/User');
const Worker = require('../models/Worker');
const Job = require('../models/Job');

// Track socket → userId mapping for targeted updates and disconnect handling
const userSockets = new Map(); // userId → Set<socketId>

const ioHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', async (userId) => {
      socket.join(userId);
      socket.userId = userId;

      // Track this socket for the user
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      console.log(`User ${userId} joined their personal room.`);
    });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket joined chat room: ${chatId}`);
    });

    socket.on('send_message', (data) => {
      // payload = { chatId, senderId, text }
      io.to(data.chatId).emit('receive_message', data);
      // Optional: push notification to the recipient's personal room
      if(data.recipientId) {
         io.to(data.recipientId).emit('notification', { message: 'New message received', type: 'message' });
      }
    });

    // Client joins a job's tracking room to watch laborer location
    socket.on('watch_job', (jobId) => {
      socket.join(`job_${jobId}`);
    });

    // Laborer broadcasts GPS to everyone watching this job
    socket.on('location_update', ({ jobId, latitude, longitude }) => {
      if (!jobId) return;
      io.to(`job_${jobId}`).emit('location_update', { latitude, longitude });
    });

    // Client sends a job request to a specific worker
    socket.on('job_request', async ({ workerId, clientId, ...jobData }, callback) => {
      if (!workerId) {
        if (typeof callback === 'function') callback({ success: false, message: 'No worker ID' });
        return;
      }

      // Validate worker is available before sending request
      try {
        const worker = await Worker.findById(workerId).select('status phoneNumber');
        if (worker && (worker.status === 'occupied' || worker.status === 'on_job')) {
          // Notify client that worker is no longer available
          if (clientId) {
            io.to(clientId).emit('worker_unavailable', {
              workerId,
              message: 'This worker is currently occupied',
            });
          }
          if (typeof callback === 'function') callback({ success: false, message: 'Worker is currently occupied' });
          return;
        }
      } catch {}

      // Always fetch phone from DB so it works even if client localStorage was stale
      let clientPhone = jobData.clientPhone || '';
      if ((!clientPhone || clientPhone === '') && clientId) {
        try {
          const user = await User.findById(clientId).select('phoneNumber');
          if (user?.phoneNumber) clientPhone = user.phoneNumber;
        } catch {}
      }
      io.to(workerId).emit('job_request', { ...jobData, clientId, clientPhone });
      if (typeof callback === 'function') callback({ success: true });
    });

    // Worker accepts — notify the waiting client + update status
    socket.on('job_accepted', async ({ clientId, workerId, jobId }) => {
      // Update worker status in DB
      if (workerId) {
        try {
          await Worker.findByIdAndUpdate(workerId, {
            status: 'on_job',
            currentJobId: jobId || null,
          });

          // Broadcast status change to all clients
          io.emit('worker_status_changed', {
            workerId,
            status: 'on_job',
            isOnline: true,
          });
        } catch (err) {
          console.error('Failed to update worker status on accept:', err);
        }
      }

      // Update job status if we have a jobId
      if (jobId) {
        try {
          await Job.findByIdAndUpdate(jobId, {
            status: 'assigned',
            assignedWorkerId: workerId,
          });

          io.emit('job_status_changed', {
            jobId,
            status: 'assigned',
          });
        } catch (err) {
          console.error('Failed to update job status on accept:', err);
        }
      }

      if (clientId) io.to(clientId).emit('job_accepted', { workerId, jobId });
    });

    // Worker started work — notify client
    socket.on('work_started', async ({ clientId, jobId }) => {
      if (jobId) {
        try {
          await Job.findByIdAndUpdate(jobId, { status: 'in_progress' });
          io.emit('job_status_changed', { jobId, status: 'in_progress' });
        } catch {}
      }
      if (clientId) io.to(clientId).emit('work_started', {});
    });

    // Worker completed work — notify client + release worker
    socket.on('work_completed', async ({ clientId, jobId, workerId, earnings, elapsed }) => {
      // Release the worker
      const wId = workerId || socket.userId;
      if (wId) {
        try {
          const worker = await Worker.findById(wId);
          if (worker) {
            worker.status = 'available';
            worker.currentJobId = null;
            worker.jobsCompleted = (worker.jobsCompleted || 0) + 1;
            await worker.save();

            io.emit('worker_status_changed', {
              workerId: wId,
              status: 'available',
              isOnline: worker.isOnline,
            });
          }
        } catch (err) {
          console.error('Failed to release worker on complete:', err);
        }
      }

      // Update job status
      if (jobId) {
        try {
          await Job.findByIdAndUpdate(jobId, { status: 'completed' });
          io.emit('job_status_changed', { jobId, status: 'completed' });
        } catch {}
      }

      if (clientId) io.to(clientId).emit('work_completed', { jobId, earnings, elapsed });
    });

    // Worker declines — notify the waiting client
    socket.on('job_declined', ({ clientId }) => {
      if (clientId) io.to(clientId).emit('job_declined', {});
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      // Clean up user socket tracking
      const userId = socket.userId;
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        // If user has no more sockets, they're fully disconnected
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          // Don't auto-set offline here as it could be a temporary disconnect
          // The worker can explicitly go offline via the toggle
        }
      }
    });
  });
};

module.exports = ioHandler;
