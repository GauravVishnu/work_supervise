const cron = require('node-cron');
const pool = require('./config/db');

// Run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  console.log('📸 Running daily snapshot and cleanup...');
  
  try {
    // Get all users
    const users = await pool.query('SELECT udm_id FROM user_details_m');
    
    for (const user of users.rows) {
      const userId = user.udm_id;
      
      // Get yesterday's tasks (tasks that are not from today)
      const tasks = await pool.query(
        'SELECT task_id, name, completion_percentage FROM tasks WHERE user_id = $1 AND task_date < CURRENT_DATE',
        [userId]
      );
      
      // Save snapshot for each old task
      for (const task of tasks.rows) {
        await pool.query(
          `INSERT INTO task_history (task_id, user_id, name, completion_percentage, snapshot_date, created_by, created_on_client, created_on_server)
           VALUES ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '1 day', $5, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [task.task_id, userId, task.name, task.completion_percentage, 'SYS001']
        );
      }
      
      // Delete old tasks (move to history)
      await pool.query(
        'DELETE FROM tasks WHERE user_id = $1 AND task_date < CURRENT_DATE',
        [userId]
      );
      
      console.log(`✅ Moved ${tasks.rows.length} old tasks to history for user ${userId}`);
    }
    
    console.log('📸 Daily snapshot and cleanup completed');
  } catch (err) {
    console.error('❌ Daily snapshot failed:', err.message);
  }
});

console.log('⏰ Daily snapshot scheduler started (runs at midnight)');
