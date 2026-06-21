@echo off
setlocal EnableDelayedExpansion
title Laborify - Dependency Installer

echo.
echo ============================================================
echo   Laborify - Automated Setup Script
echo ============================================================
echo.

:: ── Check Node.js ────────────────────────────────────────────
echo [1/4] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Please download and install Node.js 22 or higher from:
    echo  https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%v in ('node --version') do set NODE_RAW=%%v
for /f "tokens=1 delims=." %%m in ('node --version') do set NODE_MAJOR=%%m
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% lss 18 (
    echo.
    echo  WARNING: Node.js version is too old (found v%NODE_MAJOR%).
    echo  Laborify requires Node.js 22 or higher.
    echo  Please upgrade at: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  OK - Node.js found: %NODE_RAW%

:: ── Check npm ────────────────────────────────────────────────
echo.
echo [2/4] Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERROR: npm not found. It should come bundled with Node.js.
    echo  Try reinstalling Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f %%v in ('npm --version') do set NPM_VER=%%v
echo  OK - npm found: v%NPM_VER%

:: ── Check MongoDB ────────────────────────────────────────────
echo.
echo [3/4] Checking MongoDB...
where mongod >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  WARNING: mongod not found in PATH.
    echo  MongoDB may still be installed as a Windows service.
    echo  If the backend fails to connect, install MongoDB from:
    echo  https://www.mongodb.com/try/download/community
    echo  and make sure it is running before starting the backend.
) else (
    for /f "tokens=*" %%v in ('mongod --version 2^>^&1') do (
        echo  OK - %%v
        goto :mongo_done
    )
    :mongo_done
)

:: ── Install npm packages ──────────────────────────────────────
echo.
echo [4/4] Installing npm packages (frontend + backend)...
echo  Running: npm install
echo.
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERROR: npm install failed. Check the error above.
    echo.
    pause
    exit /b 1
)

:: ── Create .env if missing ────────────────────────────────────
echo.
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  Created .env from .env.example
        echo  IMPORTANT: Open .env and fill in your API keys before running the app.
    ) else (
        echo  WARNING: No .env file found. Create one with your environment variables.
        echo  See README.md for required variables.
    )
) else (
    echo  .env already exists - skipping.
)

:: ── Done ─────────────────────────────────────────────────────
echo.
echo ============================================================
echo   Setup complete!
echo ============================================================
echo.
echo   Next steps:
echo.
echo   1. Open .env and fill in your API keys
echo      (VITE_MAPBOX_TOKEN, GROQ_API_KEY, MONGO_URI, JWT_SECRET)
echo.
echo   2. Make sure MongoDB is running:
echo      net start MongoDB
echo.
echo   3. Start the backend (Terminal 1):
echo      npm run backend
echo.
echo   4. Start the frontend (Terminal 2):
echo      npm run dev
echo.
echo   App will open at: http://localhost:5173
echo   API running at:   http://localhost:5000
echo.
pause
