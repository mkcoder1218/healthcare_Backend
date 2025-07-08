import express from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth';
import { User } from '../models/User';
import { ProfessionalProfile } from '../models/ProfessionalProfile';
import { ActivityLogController } from '../controllers/ActivityLogController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mockStorage from '../utils/mockStorage';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `cv-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow PDFs
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all users (admin only)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Get all users
    const allUsers = await User.findAll();
    
    // Apply pagination
    const paginatedUsers = allUsers.slice(offset, offset + limit);
    
    // Map to the format expected by the frontend
    const formattedUsers = paginatedUsers.map(user => {
      // Check if we have this user in our mock storage
      if (mockStorage.users.has(user.id)) {
        const storedUser = mockStorage.users.get(user.id);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.charAt(0).toUpperCase() + user.role.slice(1), // Capitalize role
          status: storedUser.status.charAt(0).toUpperCase() + storedUser.status.slice(1), // Use stored status
          lastLogin: user.lastLogin || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1), // Capitalize role
        status: user.status === 'active' ? 'Active' : 'Inactive', // Format status
        lastLogin: user.lastLogin || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    });
    
    // Return paginated data with total count
    res.json({
      users: formattedUsers,
      total: allUsers.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting an admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    
    // Delete user
    const deleted = await User.delete(userId);
    
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete user' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all professionals (admin only)
router.get('/professionals', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;
    
    // Get all users with role 'professional'
    const allUsers = await User.findAll();
    let professionals = allUsers.filter(user => user.role === 'professional');
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      professionals = professionals.filter(pro => {
        const nameMatch = pro.name.toLowerCase().includes(searchLower);
        const emailMatch = pro.email.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch;
      });
    }
    
    // Get total count before pagination
    const totalCount = professionals.length;
    
    // Apply pagination
    const paginatedProfessionals = professionals.slice(offset, offset + limit);
    
    // Calculate actual patient counts for each professional based on consultations
    const professionalPatientCounts = new Map();
    
    // Count consultations for each professional
    Array.from(mockStorage.consultations.values()).forEach(consultation => {
      if (consultation.professionalId && 
          (consultation.status === 'Scheduled' || consultation.status === 'Pending' || consultation.status === 'SCHEDULED' || consultation.status === 'PENDING')) {
        const profId = consultation.professionalId;
        professionalPatientCounts.set(profId, (professionalPatientCounts.get(profId) || 0) + 1);
      }
    });
    
    // Enhance each professional with their profile data
    const enhancedProfessionals = await Promise.all(paginatedProfessionals.map(async (pro) => {
      // Check if we have this professional in our mock storage
      if (mockStorage.professionals.has(pro.id)) {
        const storedPro = mockStorage.professionals.get(pro.id);
        
        // Ensure pending professionals have 0 patients
        if (storedPro.status.toLowerCase() === 'pending' || storedPro.status.toLowerCase() === 'rejected') {
          storedPro.patients = 0;
        } else if (storedPro.status.toLowerCase() === 'approved') {
          // Update patient count based on actual consultations
          storedPro.patients = professionalPatientCounts.get(pro.id) || 0;
        }
        
        return storedPro;
      }
      
      const profile = await ProfessionalProfile.findByUserId(pro.id);
      
      // Get status (default to 'pending')
      const status = pro.status || 'pending';
      
      // Get patient count based on actual consultations if approved
      const patientCount = status.toLowerCase() === 'approved' ? 
        (professionalPatientCounts.get(pro.id) || 0) : 0;
      
      // Mock data for the response - only assign patients if approved
      const professional = {
        id: pro.id,
        name: pro.name,
        email: pro.email,
        specialty: profile?.specialty || 'General',
        status: status,
        patients: patientCount
      };
      
      // Store in mock storage for future requests
      mockStorage.professionals.set(pro.id, professional);
      
      return professional;
    }));
    
    res.json({
      professionals: enhancedProfessionals,
      total: totalCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get professional by ID (admin only)
router.get('/professionals/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Calculate actual patient count for this professional based on consultations
    let patientCount = 0;
    Array.from(mockStorage.consultations.values()).forEach(consultation => {
      if (consultation.professionalId === userId && 
          (consultation.status === 'Scheduled' || consultation.status === 'Pending' || 
           consultation.status === 'SCHEDULED' || consultation.status === 'PENDING')) {
        patientCount++;
      }
    });
    
    // Check if we have this professional in our mock storage
    if (mockStorage.professionals.has(userId)) {
      const professional = mockStorage.professionals.get(userId);
      
      // Check if professional has a CV path and add CV URL if it exists
      if (professional.cvPath) {
        professional.cvUrl = `/api/professionals/cv/${path.basename(professional.cvPath)}`;
      }
      
      // Ensure pending professionals have 0 patients
      if (professional.status.toLowerCase() === 'pending' || professional.status.toLowerCase() === 'rejected') {
        professional.patients = 0;
      } else if (professional.status.toLowerCase() === 'approved') {
        // Update patient count based on actual consultations
        professional.patients = patientCount;
      }
      
      return res.json({ professional });
    }
    
    // If not in storage, get user with role 'professional'
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'professional') {
      return res.status(404).json({ message: 'Professional not found' });
    }
    
    // Get professional profile
    const profile = await ProfessionalProfile.findByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }
    
    // Get status (default to 'pending')
    const status = user.status || 'pending';
    
    // Return professional data
    const professional = {
      id: user.id,
      name: user.name,
      email: user.email,
      specialty: profile.specialty || 'General',
      status: status,
      patients: status.toLowerCase() === 'approved' ? patientCount : 0 // Only approved professionals have patients
    };
    
    // Store in mock storage for future requests
    mockStorage.professionals.set(userId, professional);
    
    res.json({ professional });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update professional status (admin only)
router.patch('/professionals/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = parseInt(id);
    
    // Accept both lowercase and uppercase status values
    const validStatuses = ['approved', 'pending', 'rejected'];
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.map(s => `"${s}"`).join(', ')}.` 
      });
    }
    
    // Format status with first letter capitalized for display
    const formattedStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
    
    // Get user with role 'professional'
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'professional') {
      return res.status(404).json({ message: 'Professional not found' });
    }
    
    // Get professional profile
    const profile = await ProfessionalProfile.findByUserId(userId);
    
    // Get existing patients count or set to 0
    let patientsCount = 0;
    const oldStatus = mockStorage.professionals.has(userId) ? 
      mockStorage.professionals.get(userId).status.toLowerCase() : '';
    
    if (mockStorage.professionals.has(userId)) {
      patientsCount = mockStorage.professionals.get(userId).patients || 0;
    }
    
    // If status is changing from approved to pending/rejected, reset patients to 0
    // and reassign any active consultations
    if ((oldStatus === 'approved') && (normalizedStatus === 'pending' || normalizedStatus === 'rejected')) {
      patientsCount = 0;
      
      // Find all consultations assigned to this professional
      const professionalConsultations = Array.from(mockStorage.consultations.values())
        .filter(consultation => consultation.professionalId === userId && 
                (consultation.status === 'Pending' || consultation.status === 'Scheduled'));
      
      // Mark these consultations as unassigned
      professionalConsultations.forEach(consultation => {
        consultation.professionalId = null;
        consultation.professional = null;
        consultation.status = 'Pending';
        mockStorage.consultations.set(consultation.id, consultation);
      });
      
      console.log(`Unassigned ${professionalConsultations.length} consultations from professional ${userId}`);
    }
    
    // If status is changing to approved, initialize with 0 patients
    // (patients will be assigned individually)
    if (normalizedStatus === 'approved' && oldStatus !== 'approved') {
      patientsCount = 0;
    }
    
    // Create or update the professional in our mock storage
    const professional = {
      id: user.id,
      name: user.name,
      email: user.email,
      specialty: profile?.specialty || 'General',
      status: formattedStatus, // Use the formatted status
      patients: patientsCount,
      // Preserve CV path if it exists
      cvPath: mockStorage.professionals.get(userId)?.cvPath || null,
      cvUrl: mockStorage.professionals.get(userId)?.cvUrl || null
    };
    
    // Store in mock storage
    mockStorage.professionals.set(userId, professional);
    
    // Send notification to the professional about status change
    await NotificationService.notifyProfessionalStatusChange(userId, formattedStatus);
    
    // Log the update for debugging
    console.log(`Updated professional ${userId} status to ${formattedStatus}`);
    console.log('Current mockStorage professionals:', Array.from(mockStorage.professionals.entries()));
    
    res.json({ professional });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all consultations (admin only)
router.get('/consultations', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Check if we have any consultations in our mock storage
    const storedConsultations = Array.from(mockStorage.consultations.values());
    
    // Generate mock consultations data
    const totalConsultations = 35; // Mock total count
    const consultations = [];
    
    const statuses = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];
    
    for (let i = 1; i <= Math.min(limit, totalConsultations - (page - 1) * limit); i++) {
      const id = (page - 1) * limit + i;
      
      // Check if we have this consultation in our mock storage
      if (mockStorage.consultations.has(id)) {
        const storedConsultation = mockStorage.consultations.get(id);
        consultations.push({
          id: storedConsultation.id,
          patient: storedConsultation.user?.name || `Patient ${storedConsultation.userId}`,
          professional: storedConsultation.professionalId ? 
            (storedConsultation.professional?.name || `Dr. Professional ${(storedConsultation.professionalId % 10) + 1}`) : 
            'Unassigned',
          date: storedConsultation.date,
          time: storedConsultation.startTime,
          duration: 30,
          status: storedConsultation.status
        });
        continue;
      }
      
      // Generate consultation date - spread over next 30 days
      const consultationDate = new Date();
      consultationDate.setDate(consultationDate.getDate() + (id % 30));
      
      // Format date and time
      const dateStr = consultationDate.toISOString().split('T')[0];
      const hours = 9 + (id % 8); // Hours between 9 and 17
      const minutes = (id % 4) * 15; // Minutes: 0, 15, 30, or 45
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Status cycles through statuses array based on ID
      const status = statuses[id % statuses.length];
      
      // Randomly make some consultations unassigned (for demo purposes)
      const hasAssignedProfessional = id % 3 !== 0; // Every third consultation is unassigned
      
      consultations.push({
        id,
        patient: `Patient ${id}`,
        professional: hasAssignedProfessional ? `Dr. Professional ${(id % 10) + 1}` : 'Unassigned',
        date: dateStr,
        time: timeStr,
        duration: [30, 45, 60][id % 3], // Duration: 30, 45, or 60 minutes
        status
      });
    }
    
    res.json({
      consultations,
      total: totalConsultations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consultation by ID (admin only)
router.get('/consultations/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const consultationId = parseInt(id);
    
    // Check if we have this consultation in our mock storage
    if (mockStorage.consultations.has(consultationId)) {
      return res.json(mockStorage.consultations.get(consultationId));
    }
    
    // Generate mock consultation data for the specified ID
    const consultationDate = new Date();
    consultationDate.setDate(consultationDate.getDate() + (consultationId % 30));
    
    const dateStr = consultationDate.toISOString().split('T')[0];
    const hours = 9 + (consultationId % 8);
    const startMinutes = (consultationId % 4) * 15;
    const startTime = `${hours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    
    const duration = [30, 45, 60][consultationId % 3];
    const endHours = hours + Math.floor((startMinutes + duration) / 60);
    const endMinutes = (startMinutes + duration) % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    const statuses = ['PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
    const status = statuses[consultationId % statuses.length];
    
    const userId = 100 + consultationId;
    
    // Randomly make some consultations unassigned (for demo purposes)
    const hasAssignedProfessional = consultationId % 3 !== 0; // Every third consultation is unassigned
    const professionalId = hasAssignedProfessional ? 200 + (consultationId % 10) : null;
    
    const consultation = {
      id: consultationId,
      userId: userId,
      professionalId: professionalId,
      status: status,
      date: dateStr,
      startTime: startTime,
      endTime: endTime,
      notes: `Consultation notes for appointment #${consultationId}. This is a detailed description of the consultation, including any issues discussed and recommendations provided.`,
      user: {
        name: `Patient ${consultationId}`,
        email: `patient${consultationId}@example.com`
      },
      professional: professionalId ? {
        name: `Dr. Professional ${(professionalId % 10) + 1}`,
        specialty: ['Cardiology', 'Dermatology', 'Neurology', 'Psychology', 'General'][consultationId % 5]
      } : null
    };
    
    // Store in mock storage for future requests
    mockStorage.consultations.set(consultationId, consultation);
    
    res.json(consultation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update consultation status (admin only)
router.patch('/consultations/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const consultationId = parseInt(id);
    
    if (!status || !['Pending', 'Scheduled', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Get existing consultation from storage or create a new one
    let consultation;
    
    if (mockStorage.consultations.has(consultationId)) {
      consultation = mockStorage.consultations.get(consultationId);
      consultation.status = status; // Update the status
    } else {
      // Generate mock consultation data with updated status
      const consultationDate = new Date();
      consultationDate.setDate(consultationDate.getDate() + (consultationId % 30));
      
      const dateStr = consultationDate.toISOString().split('T')[0];
      const hours = 9 + (consultationId % 8);
      const startMinutes = (consultationId % 4) * 15;
      const startTime = `${hours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
      
      const duration = [30, 45, 60][consultationId % 3];
      const endHours = hours + Math.floor((startMinutes + duration) / 60);
      const endMinutes = (startMinutes + duration) % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      const userId = 100 + consultationId;
      const professionalId = 200 + (consultationId % 10);
      
      consultation = {
        id: consultationId,
        userId: userId,
        professionalId: professionalId,
        status: status, // Use the provided status
        date: dateStr,
        startTime: startTime,
        endTime: endTime,
        notes: `Consultation notes for appointment #${consultationId}. This is a detailed description of the consultation, including any issues discussed and recommendations provided.`,
        user: {
          name: `Patient ${consultationId}`,
          email: `patient${consultationId}@example.com`
        },
        professional: {
          name: `Dr. Professional ${(consultationId % 10) + 1}`,
          specialty: ['Cardiology', 'Dermatology', 'Neurology', 'Psychology', 'General'][consultationId % 5]
        }
      };
    }
    
    // Store updated consultation
    mockStorage.consultations.set(consultationId, consultation);
    
    res.json(consultation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve professional (admin only)
router.put('/professionals/:id/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Check if user exists and is a professional
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'professional') {
      return res.status(400).json({ message: 'User is not a professional' });
    }
    
    // Check if professional profile exists
    const profile = await ProfessionalProfile.findByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }
    
    // Update professional status (you would need to add an 'approved' field to the professional_profiles table)
    /*
    await db.query(
      'UPDATE professional_profiles SET approved = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
    */
    
    res.json({ message: 'Professional approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard data (admin only)
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Get user statistics
    const users = await User.findAll();
    const activeUsers = users.filter(user => user.status === 'active').length;
    const userIncrease = 10; // This would be calculated based on historical data
    
    // Get professional statistics
    const professionals = users.filter(user => user.role === 'professional');
    const approvedProfessionals = professionals.filter(pro => pro.status === 'approved').length;
    const pendingProfessionals = professionals.filter(pro => pro.status === 'pending').length;
    
    // Get consultation statistics 
    // This is a placeholder. In a real application, you would fetch from your database
    const activeConsultations = 24;
    const completedConsultations = 168;
    const consultationIncrease = 15;
    
    // Generate user growth data (mock data)
    const userGrowth = [];
    const currentDate = new Date();
    for (let i = days; i > 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      userGrowth.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(users.length * (1 - i/days))
      });
    }
    
    // Generate consultation status data (mock data)
    const consultationsByStatus = [
      { name: 'Completed', value: 168 },
      { name: 'Active', value: 24 },
      { name: 'Cancelled', value: 8 },
      { name: 'No-show', value: 3 }
    ];
    
    // Get recent activity
    // This is a placeholder. In a real application, you would fetch from your activity logs
    const recentActivity = [
      {
        id: 1,
        user: 'Admin User',
        action: 'Approved Professional',
        timestamp: new Date().toISOString(),
        details: 'Approved professional profile for John Doe'
      },
      {
        id: 2,
        user: 'Admin User',
        action: 'User Management',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: 'Deactivated account for Jane Smith'
      }
    ];
    
    const dashboardData = {
      userStats: {
        total: users.length,
        active: activeUsers,
        increase: userIncrease
      },
      professionalStats: {
        total: professionals.length,
        approved: approvedProfessionals,
        pending: pendingProfessionals
      },
      consultationStats: {
        active: activeConsultations,
        completed: completedConsultations,
        increase: consultationIncrease
      },
      userGrowth,
      consultationsByStatus,
      recentActivity
    };
    
    res.json(dashboardData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activity Log Routes
// Create activity log
router.post('/activity-logs', verifyToken, isAdmin, ActivityLogController.create);

// Get all activity logs with pagination
router.get('/activity-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // In a real application, ActivityLogController.getAll would be called here
    // For now, let's generate mock data with valid timestamps
    
    // Generate mock activity logs
    const totalLogs = 35; // Mock total count
    const logs = [];
    
    for (let i = 1; i <= Math.min(limit, totalLogs - (page - 1) * limit); i++) {
      const id = (page - 1) * limit + i;
      
      // Generate a valid date for the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - (id % 30));
      
      const actions = ['Login', 'Create User', 'Update Profile', 'Delete Record', 'Approve Professional', 'View Report'];
      const users = ['Admin User', 'System Admin', 'Support Manager', 'IT Admin'];
      
      logs.push({
        id,
        user: users[id % users.length],
        action: actions[id % actions.length],
        timestamp: date.toISOString(), // This ensures a valid ISO date string
        details: `Details for activity ${id}`
      });
    }
    
    res.json({
      logs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: page,
      totalLogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity logs by admin ID
router.get('/activity-logs/admin/:id', verifyToken, isAdmin, ActivityLogController.getByAdminId);

// Get activity logs by action
router.get('/activity-logs/action/:action', verifyToken, isAdmin, ActivityLogController.getByAction);

// Get activity statistics
router.get('/activity-logs/stats', verifyToken, isAdmin, ActivityLogController.getStats);

// Update user status (admin only)
router.patch('/users/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = parseInt(id);
    
    // Accept both lowercase and uppercase status values
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    if (!normalizedStatus || !['active', 'inactive', 'pending'].includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid status. Must be "active", "inactive", or "pending".' });
    }
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get existing user from storage or use the one we just retrieved
    let updatedUser;
    
    if (mockStorage.users.has(userId)) {
      updatedUser = mockStorage.users.get(userId);
      updatedUser.status = normalizedStatus; // Update the status
    } else {
      // Create a new user object with updated status
      updatedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: normalizedStatus
      };
    }
    
    // Store updated user
    mockStorage.users.set(userId, updatedUser);
    
    // Log the update for debugging
    console.log(`Updated user ${userId} status to ${normalizedStatus}`);
    console.log('Current mockStorage users:', Array.from(mockStorage.users.entries()));
    
    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload CV for professional (admin only)
router.post('/professionals/:id/cv', verifyToken, isAdmin, upload.single('cv'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Check if user exists and is a professional
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'professional') {
      return res.status(400).json({ message: 'User is not a professional' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }
    
    // Get professional from storage or create if not exists
    let professional;
    if (mockStorage.professionals.has(userId)) {
      professional = mockStorage.professionals.get(userId);
      professional.cvPath = req.file.path;
    } else {
      const profile = await ProfessionalProfile.findByUserId(userId);
      
      professional = {
        id: user.id,
        name: user.name,
        email: user.email,
        specialty: profile?.specialty || 'General',
        status: user.status || 'pending',
        patients: Math.floor(Math.random() * 50),
        cvPath: req.file.path
      };
      
      mockStorage.professionals.set(userId, professional);
    }
    
    res.json({ 
      message: 'CV uploaded successfully',
      professional: {
        ...professional,
        cvUrl: `/api/admin/professionals/${userId}/cv/view`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get CV for professional (admin only)
router.get('/professionals/:id/cv/view', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Check if professional exists in storage
    if (!mockStorage.professionals.has(userId)) {
      return res.status(404).json({ message: 'Professional not found' });
    }
    
    const professional = mockStorage.professionals.get(userId);
    
    // Check if CV exists
    if (!professional.cvPath) {
      return res.status(404).json({ message: 'CV not found for this professional' });
    }
    
    // Send the file
    res.sendFile(professional.cvPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign professional to consultation (admin only)
router.patch('/consultations/:id/assign', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { professionalId } = req.body;
    const consultationId = parseInt(id);
    const profId = parseInt(professionalId);
    
    if (!professionalId) {
      return res.status(400).json({ message: 'Professional ID is required' });
    }
    
    // Check if professional exists and is approved
    const professional = mockStorage.professionals.get(profId);
    if (!professional) {
      // Check in database
      const user = await User.findById(profId);
      if (!user || user.role !== 'professional') {
        return res.status(404).json({ message: 'Professional not found' });
      }
      
      // Check if professional is approved
      if (user.status !== 'approved') {
        return res.status(400).json({ message: 'Professional is not approved' });
      }
    } else if (professional.status.toLowerCase() !== 'approved') {
      return res.status(400).json({ message: 'Professional is not approved' });
    }
    
    // Get existing consultation from storage or create a new one
    let consultation;
    let isNewAssignment = false;
    
    if (mockStorage.consultations.has(consultationId)) {
      consultation = mockStorage.consultations.get(consultationId);
      
      // Check if this is a new assignment or reassignment
      if (!consultation.professionalId) {
        isNewAssignment = true;
      } else if (consultation.professionalId !== profId) {
        // This is a reassignment, decrement the previous professional's patient count
        const previousProfessional = mockStorage.professionals.get(consultation.professionalId);
        if (previousProfessional) {
          previousProfessional.patients = Math.max(0, (previousProfessional.patients || 0) - 1);
        }
        isNewAssignment = true;
      }
      
      // Update the professional
      consultation.professionalId = profId;
      
      // Update professional object
      consultation.professional = {
        name: professional ? professional.name : `Dr. Professional ${(profId % 10) + 1}`,
        specialty: professional ? professional.specialty : 'General'
      };
      
      // If consultation was pending, update to scheduled
      if (consultation.status === 'PENDING' || consultation.status === 'Pending') {
        consultation.status = 'Scheduled';
      }
    } else {
      // Generate mock consultation data with assigned professional
      const consultationDate = new Date();
      consultationDate.setDate(consultationDate.getDate() + (consultationId % 30));
      
      const dateStr = consultationDate.toISOString().split('T')[0];
      const hours = 9 + (consultationId % 8);
      const startMinutes = (consultationId % 4) * 15;
      const startTime = `${hours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
      
      const duration = [30, 45, 60][consultationId % 3];
      const endHours = hours + Math.floor((startMinutes + duration) / 60);
      const endMinutes = (startMinutes + duration) % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      const userId = 100 + consultationId;
      
      consultation = {
        id: consultationId,
        userId: userId,
        professionalId: profId,
        status: 'Scheduled', // Automatically set to scheduled when assigned
        date: dateStr,
        startTime: startTime,
        endTime: endTime,
        notes: `Consultation notes for appointment #${consultationId}. This is a detailed description of the consultation, including any issues discussed and recommendations provided.`,
        user: {
          name: `Patient ${consultationId}`,
          email: `patient${consultationId}@example.com`
        },
        professional: {
          name: professional ? professional.name : `Dr. Professional ${(profId % 10) + 1}`,
          specialty: professional ? professional.specialty : 'General'
        }
      };
      
      isNewAssignment = true;
    }
    
    // Store updated consultation
    mockStorage.consultations.set(consultationId, consultation);
    
    // Update professional's patient count if this is a new assignment
    if (isNewAssignment) {
      // Get or create professional in storage
      let professionalToUpdate = mockStorage.professionals.get(profId);
      if (professionalToUpdate) {
        // Increment patient count by 1
        professionalToUpdate.patients = (professionalToUpdate.patients || 0) + 1;
      } else {
        // Create a new professional entry with 1 patient
        const user = await User.findById(profId);
        if (user) {
          const profile = await ProfessionalProfile.findByUserId(profId);
          professionalToUpdate = {
            id: profId,
            name: user.name,
            email: user.email,
            specialty: profile?.specialty || 'General',
            status: 'Approved',
            patients: 1,
          };
          mockStorage.professionals.set(profId, professionalToUpdate);
        }
      }
      
      // Send notification about the consultation assignment
      await NotificationService.notifyConsultationAssigned(consultationId);
    }
    
    res.json(consultation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 