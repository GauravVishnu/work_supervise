require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require('./cronJobs'); // Start cron jobs

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/* ================= ENV CHECK ================= */

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET missing in .env");
  process.exit(1);
}

/* ================= DB CONNECTION ================= */

require("./config/db");

/* ================= ROUTES ================= */

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const friendRoutes = require("./routes/friendRoutes");
const historyRoutes = require("./routes/historyRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

app.use("/", authRoutes);
app.use("/", taskRoutes);
app.use("/", friendRoutes);
app.use("/", historyRoutes);
app.use("/", messageRoutes);

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3001;

// WebSocket connection handling
require('./websocket')(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});