import { Request, Response } from 'express';
import { RequestWithUser } from '../types';
import { ActivityLog } from '../models/ActivityLog';

export class ActivityLogController {
  /**
   * Create a new activity log
   */
  static async create(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { action, details } = req.body;
      
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Get IP address
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Create activity log
      const log = await ActivityLog.create(
        req.user.id,
        req.user.email, // Using email as admin_name, could use actual name if available
        action,
        details || '',
        ipAddress
      );
      
      res.status(201).json({ success: true, log });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get all activity logs with pagination
   */
  static async getAll(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await ActivityLog.findAll(page, limit);
      
      res.json({
        logs: result.logs,
        pagination: {
          page,
          limit,
          totalItems: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get activity logs by admin ID
   */
  static async getByAdminId(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const adminId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await ActivityLog.findByAdminId(adminId, page, limit);
      
      res.json({
        logs: result.logs,
        pagination: {
          page,
          limit,
          totalItems: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get activity logs by action type
   */
  static async getByAction(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const action = req.params.action;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await ActivityLog.findByAction(action, page, limit);
      
      res.json({
        logs: result.logs,
        pagination: {
          page,
          limit,
          totalItems: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get activity statistics
   */
  static async getStats(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      
      const stats = await ActivityLog.getStats(days);
      
      res.json({
        stats,
        period: {
          days,
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
} 