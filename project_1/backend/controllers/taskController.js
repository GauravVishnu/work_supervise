const pool = require("../config/db");

const createTask = async (req, res) => {
  try {
    const { name, description, completionPercentage, visibility } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: "Task name required" });
    }

    const result = await pool.query(
      `INSERT INTO tasks 
       (user_id, name, description, completion_percentage, visibility, task_date, created_by, created_on_client, created_on_server)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, NOW(), NOW())
       RETURNING *`,
      [userId, name, description || "", completionPercentage || 0, visibility !== undefined ? visibility : true, "SYS001"]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: result.rows[0],
    });

  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM tasks WHERE user_id = $1 AND task_date = CURRENT_DATE ORDER BY created_on_server DESC`,
      [userId]
    );

    res.json({
      message: "Tasks fetched successfully",
      tasks: result.rows,
    });

  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { completionPercentage, remarks, visibility } = req.body;
    const userId = req.user.id;

    // Build dynamic update query
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (completionPercentage !== undefined) {
      updateFields.push(`completion_percentage = $${paramCount}`);
      values.push(completionPercentage);
      paramCount++;
    }

    if (remarks !== undefined) {
      updateFields.push(`remarks = $${paramCount}`);
      values.push(remarks);
      paramCount++;
    }

    if (visibility !== undefined) {
      updateFields.push(`visibility = $${paramCount}`);
      values.push(visibility);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id, userId);

    const result = await pool.query(
      `UPDATE tasks 
       SET ${updateFields.join(", ")}
       WHERE task_id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      message: "Task updated successfully",
      task: result.rows[0],
    });

  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM tasks WHERE task_id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      message: "Task deleted successfully",
    });

  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
