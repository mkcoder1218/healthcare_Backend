import { Notification, INotification } from '../models/Notification';
import { User } from '../models/User';
import mockStorage from '../utils/mockStorage';

export class NotificationService {
  // Send notification to a specific user
  static async sendToUser(userId: number, title: string, message: string, type: INotification['type'] = 'info', link?: string): Promise<INotification | null> {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      
      return Notification.create({
        userId,
        title,
        message,
        type,
        link
      });
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return null;
    }
  }
  
  // Send notification to all admins
  static async sendToAdmins(title: string, message: string, type: INotification['type'] = 'info', link?: string): Promise<INotification[]> {
    try {
      const allUsers = await User.findAll();
      const adminUsers = allUsers.filter(user => user.role === 'admin');
      
      const notifications: INotification[] = [];
      
      for (const admin of adminUsers) {
        const notification = await this.sendToUser(admin.id, title, message, type, link);
        if (notification) {
          notifications.push(notification);
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error sending notification to admins:', error);
      return [];
    }
  }
  
  // Send notification to all professionals
  static async sendToProfessionals(title: string, message: string, type: INotification['type'] = 'info', link?: string): Promise<INotification[]> {
    try {
      const allUsers = await User.findAll();
      const professionalUsers = allUsers.filter(user => user.role === 'professional');
      
      const notifications: INotification[] = [];
      
      for (const professional of professionalUsers) {
        const notification = await this.sendToUser(professional.id, title, message, type, link);
        if (notification) {
          notifications.push(notification);
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error sending notification to professionals:', error);
      return [];
    }
  }
  
  // Send notification for a new consultation
  static async notifyNewConsultation(consultationId: number): Promise<void> {
    try {
      const consultation = mockStorage.consultations.get(consultationId);
      if (!consultation) return;
      
      // Notify the user who created the consultation
      await this.sendToUser(
        consultation.userId,
        'Consultation Created',
        'Your consultation request has been submitted successfully.',
        'success',
        `/consultations/${consultationId}`
      );
      
      // Notify all admins
      await this.sendToAdmins(
        'New Consultation Request',
        `A new consultation request has been created by ${consultation.user?.name || 'a user'}.`,
        'info',
        `/admin/consultations/${consultationId}`
      );
    } catch (error) {
      console.error('Error sending consultation notification:', error);
    }
  }
  
  // Send notification when a professional is assigned to a consultation
  static async notifyConsultationAssigned(consultationId: number): Promise<void> {
    try {
      const consultation = mockStorage.consultations.get(consultationId);
      if (!consultation || !consultation.professionalId) return;
      
      // Notify the user
      await this.sendToUser(
        consultation.userId,
        'Professional Assigned',
        `${consultation.professional?.name || 'A professional'} has been assigned to your consultation.`,
        'info',
        `/consultations/${consultationId}`
      );
      
      // Notify the professional
      await this.sendToUser(
        consultation.professionalId,
        'New Consultation Assignment',
        'You have been assigned to a new consultation.',
        'info',
        `/professional/consultations/${consultationId}`
      );
    } catch (error) {
      console.error('Error sending consultation assignment notification:', error);
    }
  }
  
  // Send notification when a professional status changes
  static async notifyProfessionalStatusChange(professionalId: number, status: string): Promise<void> {
    try {
      // Notify the professional
      await this.sendToUser(
        professionalId,
        'Status Update',
        `Your professional status has been updated to: ${status}`,
        status.toLowerCase() === 'approved' ? 'success' : (status.toLowerCase() === 'rejected' ? 'error' : 'info')
      );
      
      // If approved, notify admins
      if (status.toLowerCase() === 'approved') {
        const professional = mockStorage.professionals.get(professionalId);
        await this.sendToAdmins(
          'Professional Approved',
          `${professional?.name || 'A professional'} has been approved and is now available for consultations.`,
          'success',
          `/admin/professionals/${professionalId}`
        );
      }
    } catch (error) {
      console.error('Error sending professional status notification:', error);
    }
  }
  
  // Send notification for system announcements
  static async sendSystemAnnouncement(title: string, message: string, type: INotification['type'] = 'info'): Promise<void> {
    try {
      const allUsers = await User.findAll();
      
      for (const user of allUsers) {
        await this.sendToUser(user.id, title, message, type);
      }
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  }
} 