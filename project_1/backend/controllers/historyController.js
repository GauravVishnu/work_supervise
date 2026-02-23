const pool = require("../config/db");

// Save daily snapshot of all user tasks
const saveSnapshot = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await pool.query(
      `SELECT task_id, name, completion_percentage FROM tasks WHERE user_id = $1`,
      [userId]
    );

    if (tasks.rows.length === 0) {
      return res.json({ message: "No tasks to snapshot" });
    }

    for (const task of tasks.rows) {
      await pool.query(
        `INSERT INTO task_history (task_id, user_id, name, completion_percentage, snapshot_date, created_by, created_on_client, created_on_server)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [task.task_id, userId, task.name, task.completion_percentage, "SYS001"]
      );
    }

    res.json({ message: "Snapshot saved", count: tasks.rows.length });
  } catch (err) {
    console.error("Save snapshot error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get history by date range
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = `SELECT * FROM task_history WHERE user_id = $1`;
    const params = [userId];

    if (startDate && endDate) {
      query += ` AND snapshot_date BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY snapshot_date DESC, created_on_server DESC`;

    const result = await pool.query(query, params);

    res.json({
      message: "History fetched",
      history: result.rows,
    });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get statistics by date
const getStatsByDate = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        snapshot_date,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN completion_percentage = 100 THEN 1 END) as completed_tasks,
        AVG(completion_percentage) as avg_completion
       FROM task_history 
       WHERE user_id = $1
       GROUP BY snapshot_date
       ORDER BY snapshot_date DESC
       LIMIT 30`,
      [userId]
    );

    res.json({
      message: "Stats fetched",
      stats: result.rows,
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get tasks for a specific date
const getTasksByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const result = await pool.query(
      `SELECT * FROM task_history 
       WHERE user_id = $1 AND snapshot_date = $2
       ORDER BY completion_percentage DESC`,
      [userId, date]
    );

    res.json({
      message: "Tasks fetched",
      tasks: result.rows,
    });
  } catch (err) {
    console.error("Get tasks by date error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { saveSnapshot, getHistory, getStatsByDate, getTasksByDate };
