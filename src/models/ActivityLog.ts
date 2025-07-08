import db from '../config/db';

export interface IActivityLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: Date;
}

export class ActivityLog {
  /**
   * Create a new activity log
   */
  static async create(adminId: number, adminName: string, action: string, details: string, ipAddress: string): Promise<IActivityLog> {
    const result = await db.query(
      `INSERT INTO admin_activity_logs 
       (admin_id, admin_name, action, details, ip_address) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [adminId, adminName, action, details, ipAddress]
    );
    
    return result.rows[0];
  }

  /**
   * Get all activity logs with pagination
   */
  static async findAll(page: number = 1, limit: number = 20): Promise<{ logs: IActivityLog[], total: number }> {
    const offset = (page - 1) * limit;
    
    const countResult = await db.query('SELECT COUNT(*) FROM admin_activity_logs');
    const total = parseInt(countResult.rows[0].count);
    
    const result = await db.query(
      `SELECT * FROM admin_activity_logs 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return { logs: result.rows, total };
  }

  /**
   * Get activity logs by admin ID with pagination
   */
  static async findByAdminId(adminId: number, page: number = 1, limit: number = 20): Promise<{ logs: IActivityLog[], total: number }> {
    const offset = (page - 1) * limit;
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM admin_activity_logs WHERE admin_id = $1', 
      [adminId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await db.query(
      `SELECT * FROM admin_activity_logs 
       WHERE admin_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [adminId, limit, offset]
    );
    
    return { logs: result.rows, total };
  }

  /**
   * Get activity logs by action type with pagination
   */
  static async findByAction(action: string, page: number = 1, limit: number = 20): Promise<{ logs: IActivityLog[], total: number }> {
    const offset = (page - 1) * limit;
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM admin_activity_logs WHERE action = $1', 
      [action]
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await db.query(
      `SELECT * FROM admin_activity_logs 
       WHERE action = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [action, limit, offset]
    );
    
    return { logs: result.rows, total };
  }

  /**
   * Get activity statistics for the past n days
   */
  static async getStats(days: number = 7): Promise<any> {
    // Get count by action type
    const actionStatsResult = await db.query(
      `SELECT action, COUNT(*) as count 
       FROM admin_activity_logs 
       WHERE created_at > NOW() - INTERVAL '${days} days' 
       GROUP BY action 
       ORDER BY count DESC`
    );
    
    // Get count by admin
    const adminStatsResult = await db.query(
      `SELECT admin_id, admin_name, COUNT(*) as count 
       FROM admin_activity_logs 
       WHERE created_at > NOW() - INTERVAL '${days} days' 
       GROUP BY admin_id, admin_name 
       ORDER BY count DESC`
    );
    
    // Get daily activity count
    const dailyStatsResult = await db.query(
      `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count 
       FROM admin_activity_logs 
       WHERE created_at > NOW() - INTERVAL '${days} days' 
       GROUP BY DATE_TRUNC('day', created_at) 
       ORDER BY date`
    );
    
    return {
      byAction: actionStatsResult.rows,
      byAdmin: adminStatsResult.rows,
      daily: dailyStatsResult.rows
    };
  }
} 