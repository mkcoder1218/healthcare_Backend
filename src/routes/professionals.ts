import express from 'express';
import { ProfessionalController } from '../controllers/ProfessionalController';
import { verifyToken, isProfessional } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User } from '../models/User';
import { ProfessionalProfile } from '../models/ProfessionalProfile';
import mockStorage from '../utils/mockStorage';
import { Request } from 'express';

const router = express.Router();

// Configure multer storage for CV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/cv');
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

// Public routes
router.get('/', ProfessionalController.getAllProfessionals);
router.get('/:id', ProfessionalController.getProfessionalById);

// CV upload endpoint - can be used during registration
router.post('/cv', verifyToken, upload.single('cv'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }

    // Get the user ID from the token
    const userId = req.user.id;

    // Get the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get or create professional in mock storage
    let professional;
    if (mockStorage.professionals.has(userId)) {
      professional = mockStorage.professionals.get(userId);
      professional.cvPath = req.file.path;
    } else {
      // Get professional profile
      const profile = await ProfessionalProfile.findByUserId(userId);
      
      // Get status (default to 'pending')
      const status = user.status || 'pending';
      
      // Only approved professionals have patients
      const patientsCount = status.toLowerCase() === 'approved' ? Math.floor(Math.random() * 50) : 0;
      
      professional = {
        id: user.id,
        name: user.name,
        email: user.email,
        specialty: profile?.specialty || 'General',
        status: status,
        patients: patientsCount,
        cvPath: req.file.path
      };
      
      mockStorage.professionals.set(userId, professional);
    }

    // Generate CV URL
    const cvUrl = `/api/professionals/cv/${path.basename(req.file.path)}`;
    professional.cvUrl = cvUrl;

    // Log for debugging
    console.log(`Updated professional ${userId} with CV path: ${req.file.path}`);
    console.log('Professional data:', professional);
    
    res.json({ 
      message: 'CV uploaded successfully',
      cvPath: req.file.path,
      cvUrl: cvUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get CV file
router.get('/cv/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/cv', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'CV not found' });
    }
    
    // Send the file
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Professional only routes
router.put('/profile', verifyToken, isProfessional, ProfessionalController.updateProfile);
router.post('/education', verifyToken, isProfessional, ProfessionalController.addEducation);
router.put('/education/:id', verifyToken, isProfessional, ProfessionalController.updateEducation);
router.delete('/education/:id', verifyToken, isProfessional, ProfessionalController.deleteEducation);
router.post('/work-experience', verifyToken, isProfessional, ProfessionalController.addWorkExperience);
router.post('/certification', verifyToken, isProfessional, ProfessionalController.addCertification);

export default router; 