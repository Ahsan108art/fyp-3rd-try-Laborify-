<<<<<<< HEAD
# Laborify — Smart Labor Hiring App

A full-stack, mobile-first labor marketplace connecting clients with skilled workers. Built with React + TypeScript (frontend), Node.js + Express + MongoDB (backend), and Capacitor (Android).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Building for Android](#building-for-android)
- [API Overview](#api-overview)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| UI Components | Radix UI, shadcn/ui, Framer Motion |
| Maps | Mapbox GL JS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Real-time | Socket.IO |
| Auth | JWT + bcrypt |
| AI Chatbot | Groq API (llama-3.3-70b-versatile) |
| Mobile | Capacitor (Android) |
| HTTP Client | Axios |

---

## Prerequisites

Install the following tools before setting up the project:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | >= 22.x | Runtime for frontend and backend |
| [npm](https://www.npmjs.com/) | >= 10.x | Package manager (comes with Node) |
| [MongoDB](https://www.mongodb.com/try/download/community) | >= 6.x | Local database |
| [Git](https://git-scm.com/) | Any | Version control |
| [Java JDK](https://adoptium.net/) | 21 | Required only for Android builds |
| [Android Studio](https://developer.android.com/studio) | Latest | Required only for Android builds |

> Verify your Node version: `node --version`
> Verify npm: `npm --version`
> Verify MongoDB: `mongod --version`

---

## Project Structure

```
Laborify/
├── src/                    # React frontend source
│   ├── app/
│   │   ├── App.tsx         # Main router (23 screens)
│   │   ├── screens/        # All screen components
│   │   └── components/     # Reusable UI components
│   └── styles/             # Global CSS
├── backend/                # Express backend
│   ├── server.js           # Entry point (port 5000)
│   ├── models/             # Mongoose schemas (User, Worker, Job, Chat...)
│   ├── routes/             # REST API routes
│   ├── middleware/         # JWT auth middleware
│   └── sockets/            # Socket.IO event handlers
├── android/                # Capacitor Android project
├── public/                 # Static assets
├── package.json            # All dependencies (frontend + backend)
├── vite.config.ts          # Vite + Tailwind config
├── capacitor.config.json   # Capacitor mobile config
└── .env                    # Environment variables (create from .env.example)
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/laborify.git
cd laborify
```

### 2. Install all dependencies

All frontend and backend dependencies are in the root `package.json`. Run:

```bash
npm install
```

### 3. Start MongoDB locally

Make sure MongoDB is running before starting the backend:

**Windows (as a service):**
```
net start MongoDB
```

**Or start manually:**
```bash
mongod --dbpath "C:/data/db"
```

**macOS/Linux:**
```bash
brew services start mongodb-community
# or
sudo systemctl start mongod
```

### 4. Create environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for what each variable does.

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ── Frontend (Vite) ─────────────────────────────────
# Mapbox access token — get one free at https://mapbox.com
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# Backend API base URL (use localhost for local dev)
VITE_API_URL=http://localhost:5000

# ── Backend ─────────────────────────────────────────
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/laborify

# JWT signing secret — use any long random string
JWT_SECRET=your_super_secret_jwt_key_here

# Port for the Express server
PORT=5000

# ── AI / External APIs ───────────────────────────────
# Groq API key — get one free at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# HuggingFace API key (optional, for AI features)
HF_API_KEY=your_huggingface_key_here
```

> **Note:** Variables prefixed with `VITE_` are exposed to the browser. Never put secrets in `VITE_` variables.

---

## Running the App

You need **two terminal windows** — one for the frontend and one for the backend.

### Terminal 1 — Backend (Express API)

```bash
npm run backend
```

The API server starts at `http://localhost:5000`.

### Terminal 2 — Frontend (Vite Dev Server)

```bash
npm run dev
```

The web app opens at `http://localhost:5173`. Vite automatically proxies `/api` requests to `http://localhost:5000`, so no CORS issues during development.

### Both at once (optional)

If you have `concurrently` installed globally:

```bash
npx concurrently "npm run backend" "npm run dev"
```

---

## Building for Production

### Build the frontend

```bash
npm run build
```

Output goes to the `dist/` folder.

### Preview the production build

```bash
npm run preview
```

---

## Building for Android

Requirements: Java 21 and Android Studio must be installed.

### 1. Build the web app

```bash
npm run build
```

### 2. Sync with Capacitor

```bash
npx cap sync android
```

### 3. Open in Android Studio

```bash
npx cap open android
```

Then click **Run** in Android Studio to deploy to a device or emulator.

### 3a. Build APK from command line

```bash
cd android
./gradlew assembleDebug
```

The APK is output to `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## API Overview

All API routes are prefixed with `/api`.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user or worker |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/workers/me` | Get current worker profile |
| GET | `/api/workers/nearby` | Find nearby workers (geospatial) |
| PUT | `/api/workers/location` | Update worker GPS location |
| PUT | `/api/workers/profile` | Update worker profile/skills |
| GET | `/api/jobs` | List jobs |
| POST | `/api/jobs` | Create a new job (with image upload) |
| POST | `/api/ai/chat` | AI chatbot endpoint (Groq) |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | Join personal notification room |
| `join_chat` | Client → Server | Join a job's chat room |
| `send_message` | Client → Server | Send a chat message |
| `location_update` | Worker → Server | Broadcast current GPS location |
| `job_request` | Client → Server | Request a specific worker |
| `job_accepted` | Worker → Server | Accept a job request |
| `job_declined` | Worker → Server | Decline a job request |
| `work_started` | Worker → Server | Mark job as in progress |
| `work_completed` | Worker → Server | Mark job as done |

---

## Common Issues

**MongoDB connection refused**
Make sure MongoDB is running: `mongod` or check your service status.

**Port 5000 already in use**
Change the `PORT` value in `.env` and update `VITE_API_URL` accordingly.

**Mapbox map not loading**
Verify `VITE_MAPBOX_TOKEN` is set in `.env`. The token must be a valid Mapbox public token.

**`npm run dev` can't reach the backend**
Ensure the backend is running (`npm run backend`) and `VITE_API_URL=http://localhost:5000` is set.
=======
# laborify
>>>>>>> 25c7d0b7872ca9aa190cca6027227b595ab60ffc
