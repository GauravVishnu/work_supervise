require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

app.use("/", authRoutes);
app.use("/", taskRoutes);
app.use("/", friendRoutes);

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});