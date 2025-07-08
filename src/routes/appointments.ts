import express from 'express';
import { verifyToken } from '../middlewares/auth';
import { RequestWithUser } from '../types';
import mockStorage from '../utils/mockStorage';

const router = express.Router();

// Get all appointments
router.get('/', verifyToken, async (req: RequestWithUser, res) => {
  try {
    // This functionality would be implemented by calling the appropriate model method
    res.json({ message: 'Get all appointments endpoint' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for a specific user
router.get('/user/:userId', verifyToken, async (req: RequestWithUser, res) => {
  try {
    const { userId } = req.params;
    
    // Check if the requesting user has permission to access these appointments
    // Users should only be able to access their own appointments unless they're admins
    if (req.user?.id !== parseInt(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only access your own appointments' });
    }
    
    // In a real application, we would fetch from the database
    // For now, we'll use mock data from mockStorage
    const allAppointments = Array.from(mockStorage.consultations.values() || []);
    const userAppointments = allAppointments.filter(appointment => 
      appointment.user_id === parseInt(userId)
    );
    
    res.json(userAppointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment by ID
router.get('/:id', verifyToken, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;
    // This functionality would be implemented by calling the appropriate model method
    res.json({ message: `Get appointment ${id} endpoint` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new appointment
router.post('/', verifyToken, async (req: RequestWithUser, res) => {
  try {
    const { user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes } = req.body;
    
    // Validate required fields
    if (!professional_id || !consultation_type_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Generate a unique ID for the new appointment
    const newId = Date.now();
    
    // Create new appointment object
    const newAppointment = {
      id: newId,
      user_id: user_id || req.user?.id,
      professional_id,
      consultation_type_id,
      appointment_date,
      appointment_time,
      status: status || 'pending',
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store appointment in mock storage
    mockStorage.consultations.set(newId, newAppointment);
    
    // Return the created appointment
    res.status(201).json(newAppointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment
router.put('/:id', verifyToken, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;
    // This functionality would be implemented by calling the appropriate model method
    res.json({ message: `Update appointment ${id} endpoint` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment
router.delete('/:id', verifyToken, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;
    // This functionality would be implemented by calling the appropriate model method
    res.json({ message: `Cancel appointment ${id} endpoint` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 