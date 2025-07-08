import db from '../config/db';

async function initActivityLogsTable() {
  try {
    console.log('Creating admin_activity_logs table if not exists...');
    
    // Create the table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        admin_name VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for faster querying
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
      CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON admin_activity_logs(action);
      CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);
    `);
    
    console.log('Admin activity logs table initialized successfully!');
  } catch (error) {
    console.error('Error initializing admin activity logs table:', error);
  } finally {
    await db.pool.end();
  }
}

// Run the script
initActivityLogsTable(); 