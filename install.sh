#!/usr/bin/env bash
set -e

echo ""
echo "============================================================"
echo "  Laborify - Automated Setup Script"
echo "============================================================"
echo ""

# ── Check Node.js ─────────────────────────────────────────────
echo "[1/4] Checking Node.js..."
if ! command -v node &>/dev/null; then
    echo ""
    echo " ERROR: Node.js is not installed."
    echo " Please install Node.js 22+ from: https://nodejs.org/"
    exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
NODE_VER=$(node --version)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo ""
    echo " WARNING: Node.js $NODE_VER is too old. Laborify requires >= 22."
    echo " Please upgrade from: https://nodejs.org/"
    exit 1
fi
echo " OK - Node.js found: $NODE_VER"

# ── Check npm ─────────────────────────────────────────────────
echo ""
echo "[2/4] Checking npm..."
if ! command -v npm &>/dev/null; then
    echo ""
    echo " ERROR: npm not found. It should come bundled with Node.js."
    exit 1
fi
NPM_VER=$(npm --version)
echo " OK - npm found: v$NPM_VER"

# ── Check MongoDB ─────────────────────────────────────────────
echo ""
echo "[3/4] Checking MongoDB..."
if ! command -v mongod &>/dev/null; then
    echo " WARNING: mongod not found in PATH."
    echo " Install MongoDB Community from:"
    echo " https://www.mongodb.com/try/download/community"
    echo " Start it with: brew services start mongodb-community"
    echo " or:            sudo systemctl start mongod"
else
    MONGO_VER=$(mongod --version | head -n1)
    echo " OK - $MONGO_VER"
fi

# ── Install npm packages ───────────────────────────────────────
echo ""
echo "[4/4] Installing npm packages (frontend + backend)..."
echo " Running: npm install"
echo ""
npm install

# ── Create .env if missing ────────────────────────────────────
echo ""
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo " Created .env from .env.example"
        echo " IMPORTANT: Open .env and fill in your API keys before running the app."
    else
        echo " WARNING: No .env file found. Create one based on README.md."
    fi
else
    echo " .env already exists - skipping."
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  Setup complete!"
echo "============================================================"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Open .env and fill in your API keys"
echo "     (VITE_MAPBOX_TOKEN, GROQ_API_KEY, MONGO_URI, JWT_SECRET)"
echo ""
echo "  2. Make sure MongoDB is running:"
echo "     brew services start mongodb-community   (macOS)"
echo "     sudo systemctl start mongod             (Linux)"
echo ""
echo "  3. Start the backend (Terminal 1):"
echo "     npm run backend"
echo ""
echo "  4. Start the frontend (Terminal 2):"
echo "     npm run dev"
echo ""
echo "  App will open at: http://localhost:5173"
echo "  API running at:   http://localhost:5000"
echo ""
