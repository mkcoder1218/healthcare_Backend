import { v4 as uuidv4 } from 'uuid';

export interface INotification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// In-memory store for notifications
const notifications: Map<string, INotification> = new Map();

export class Notification {
  // Create a new notification
  static create(data: Omit<INotification, 'id' | 'createdAt' | 'isRead'>): INotification {
    const id = uuidv4();
    const notification: INotification = {
      id,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.set(id, notification);
    return notification;
  }
  
  // Get all notifications for a user
  static findByUserId(userId: number): INotification[] {
    return Array.from(notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Get unread notifications count for a user
  static getUnreadCount(userId: number): number {
    return Array.from(notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .length;
  }
  
  // Mark a notification as read
  static markAsRead(id: string): boolean {
    const notification = notifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    notifications.set(id, notification);
    return true;
  }
  
  // Mark all notifications as read for a user
  static markAllAsRead(userId: number): number {
    let count = 0;
    
    Array.from(notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .forEach(notification => {
        notification.isRead = true;
        notifications.set(notification.id, notification);
        count++;
      });
    
    return count;
  }
  
  // Delete a notification
  static delete(id: string): boolean {
    return notifications.delete(id);
  }
  
  // Delete all notifications for a user
  static deleteAllForUser(userId: number): number {
    let count = 0;
    
    Array.from(notifications.values())
      .filter(notification => notification.userId === userId)
      .forEach(notification => {
        notifications.delete(notification.id);
        count++;
      });
    
    return count;
  }
} 