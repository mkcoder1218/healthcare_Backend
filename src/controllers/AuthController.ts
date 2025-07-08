import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ProfessionalProfile } from '../models/ProfessionalProfile';
import { UserRole, RequestWithUser } from '../types';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      
      // Validate role
      const validRoles = [UserRole.USER, UserRole.PROFESSIONAL, UserRole.ADMIN];
      if (role && !validRoles.includes(role)) {
        res.status(400).json({ message: 'Invalid role. Role must be one of: user, professional, admin' });
        return;
      }
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insert user with default role as 'user' if not specified
      const newUser = await User.create(name, email, hashedPassword, role || UserRole.USER);
      
      // If the role is professional, create an empty professional profile
      if (role === UserRole.PROFESSIONAL) {
        await ProfessionalProfile.create(newUser.id);
      }
      
      // Generate JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET || 'jwtsecret',
        { expiresIn: '1d' }
      );
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }
      
      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'jwtsecret',
        { expiresIn: '1d' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const user = await User.findById(req.user.id);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // If user is a professional, get their professional profile
      let professionalProfile = null;
      if (user.role === UserRole.PROFESSIONAL) {
        professionalProfile = await ProfessionalProfile.findByUserId(req.user.id);
      }
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        professionalProfile
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
} 