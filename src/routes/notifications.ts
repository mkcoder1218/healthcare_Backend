import express from 'express';
import { verifyToken } from '../middlewares/auth';
import { Notification } from '../models/Notification';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const notifications = Notification.findByUserId(req.user.id);
    
    res.json({
      notifications,
      unreadCount: Notification.getUnreadCount(req.user.id)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count for the authenticated user
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const unreadCount = Notification.getUnreadCount(req.user.id);
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    const success = Notification.markAsRead(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read for the authenticated user
router.patch('/mark-all-read', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const count = Notification.markAllAsRead(req.user.id);
    
    res.json({ 
      message: `${count} notifications marked as read`,
      count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    const success = Notification.delete(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all notifications for the authenticated user
router.delete('/', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const count = Notification.deleteAllForUser(req.user.id);
    
    res.json({ 
      message: `${count} notifications deleted`,
      count
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TEST ENDPOINT: Create a test notification for the authenticated user
router.post('/test', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { type = 'info', title, message, link } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    const notification = Notification.create({
      userId: req.user.id,
      title,
      message,
      type: type as 'info' | 'success' | 'warning' | 'error',
      link
    });
    
    res.status(201).json({ 
      message: 'Test notification created',
      notification 
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TEST ENDPOINT: Create a test system announcement (sends to all users)
router.post('/test/system-announcement', verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can send system announcements' });
    }
    
    const { title, message, type = 'info' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    await NotificationService.sendSystemAnnouncement(
      title,
      message,
      type as 'info' | 'success' | 'warning' | 'error'
    );
    
    res.status(201).json({ 
      message: 'System announcement sent to all users'
    });
  } catch (error) {
    console.error('Error sending system announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 