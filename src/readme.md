Viewed .env:1-5
Viewed package.json:1-90

Here is a step-by-step guide to get the full-stack project up and running locally on your machine. You will need to run the database, the backend, and the frontend simultaneously.

### Step 1: Start MongoDB
This application uses a local MongoDB database. 
1. Make sure you have **MongoDB Community Server** installed on your computer.
2. The backend is configured to look for a database at `mongodb://localhost:27017/laborify`. Start your MongoDB service (this usually runs automatically in the background on Windows, but you can also open **MongoDB Compass** and click "Connect" with the default settings to ensure it's alive).

### Step 2: Run the Backend Node.js Server
You will need to open a terminal/command prompt to start the backend.

1. Open your terminal and navigate to the `backend` folder:
   ```powershell
   cd c:\Users\l1f22bsse0328\Desktop\demo\backend
   ```
2. Install the necessary dependencies (only needed the first time):
   ```powershell
   npm install
   ```
3. Start the backend development server:
   ```powershell
   npm run dev
   ```
   *You should see a message confirming the server is listening on port `5000` and has connected to MongoDB.* Keep this terminal window open.

### Step 3: Run the Frontend React Application
You will need a second, separate terminal window for the frontend.

1. Open a new terminal and navigate to your main project root:
   ```powershell
   cd c:\Users\l1f22bsse0328\Desktop\demo
   ```
2. Install the frontend dependencies (only needed the first time):
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. The terminal will give you a local URL (e.g., `http://localhost:5173`). Ctrl-click that link or copy it into your browser to open the app!

*Note: Whenever you want to stop either server, you can click into its terminal window and press `Ctrl + C`.*