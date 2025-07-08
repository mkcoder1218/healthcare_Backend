import { Request, Response } from 'express';
import { RequestWithUser } from '../types';
import { ProfessionalProfile } from '../models/ProfessionalProfile';
import { Education } from '../models/Education';
import { WorkExperience } from '../models/WorkExperience';
import { Certification } from '../models/Certification';
import mockStorage from '../utils/mockStorage';

export class ProfessionalController {
  /**
   * Get all professionals
   */
  static async getAllProfessionals(req: Request, res: Response): Promise<void> {
    try {
      const statusFilter = req.query.status as string;
      
      // Get all professionals with their user info
      const professionals = await ProfessionalProfile.findAllWithUserInfo();
      
      // Add status from mockStorage or default to 'pending'
      const professionalsWithStatus = professionals.map(prof => {
        const storedProfessional = mockStorage.professionals.get(prof.id);
        const status = storedProfessional?.status?.toLowerCase() || 'pending';
        
        return {
          ...prof,
          status
        };
      });
      
      // If status filter is provided, filter professionals by status
      let filteredProfessionals = professionalsWithStatus;
      if (statusFilter) {
        const normalizedStatus = statusFilter.toLowerCase();
        console.log(`Filtering professionals by status: ${normalizedStatus}`);
        
        filteredProfessionals = professionalsWithStatus.filter(prof => {
          const matches = prof.status === normalizedStatus;
          console.log(`Professional ${prof.id} status: ${prof.status}, matches filter: ${matches}`);
          return matches;
        });
        
        console.log(`Found ${filteredProfessionals.length} professionals with status ${normalizedStatus}`);
      }
      
      res.json(filteredProfessionals);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get professional by ID
   */
  static async getProfessionalById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const professional = await ProfessionalProfile.findFullProfileById(parseInt(id));
      
      if (!professional) {
        res.status(404).json({ message: 'Professional not found' });
        return;
      }
      
      // Add status from mockStorage or default to 'pending'
      const storedProfessional = mockStorage.professionals.get(professional.id);
      professional.status = storedProfessional?.status?.toLowerCase() || 'pending';
      
      res.json(professional);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Update professional profile
   */
  static async updateProfile(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { specialization, years_of_experience, bio } = req.body;
      
      // Check if profile exists
      const profile = await ProfessionalProfile.findByUserId(req.user.id);
      
      if (!profile) {
        res.status(404).json({ message: 'Professional profile not found' });
        return;
      }
      
      // Update profile
      const updatedProfile = await ProfessionalProfile.update(req.user.id, {
        specialization,
        years_of_experience,
        bio
      });
      
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Add education record
   */
  static async addEducation(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { institution, degree, field_of_study, start_date, end_date, description } = req.body;
      
      // Get professional profile ID
      const profile = await ProfessionalProfile.findByUserId(req.user.id);
      
      if (!profile) {
        res.status(404).json({ message: 'Professional profile not found' });
        return;
      }
      
      // Add education
      const newEducation = await Education.create(
        profile.id,
        institution,
        degree,
        field_of_study,
        new Date(start_date),
        end_date ? new Date(end_date) : null,
        description
      );
      
      res.status(201).json(newEducation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Update education record
   */
  static async updateEducation(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      const { institution, degree, field_of_study, start_date, end_date, description } = req.body;
      
      // Get professional profile ID
      const profile = await ProfessionalProfile.findByUserId(req.user.id);
      
      if (!profile) {
        res.status(404).json({ message: 'Professional profile not found' });
        return;
      }
      
      // Check if education entry exists and belongs to this professional
      const isOwner = await Education.verifyOwnership(parseInt(id), profile.id);
      
      if (!isOwner) {
        res.status(404).json({ message: 'Education entry not found' });
        return;
      }
      
      // Update education
      const updatedEducation = await Education.update(parseInt(id), {
        institution,
        degree,
        field_of_study,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        description
      });
      
      res.json({
        message: 'Education entry updated successfully',
        education: updatedEducation
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Delete education record
   */
  static async deleteEducation(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      
      // Get professional profile ID
      const profile = await ProfessionalProfile.findByUserId(req.user.id);
      
      if (!profile) {
        res.status(404).json({ message: 'Professional profile not found' });
        return;
      }
      
      // Check if education entry exists and belongs to this professional
      const isOwner = await Education.verifyOwnership(parseInt(id), profile.id);
      
      if (!isOwner) {
        res.status(404).json({ message: 'Education entry not found' });
        return;
      }
      
      // Delete education
      await Education.delete(parseInt(id));
      
      res.json({ message: 'Education entry deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Add work experience record
   */
  static async addWorkExperience(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { company, position, start_date, end_date, description } = req.body;
      
      // Get professional profile ID
      const profile = await ProfessionalProfile.findByUserId(req.user.id);
      
      if (!profile) {
        res.status(404).json({ message: 'Professional profile not found' });
        return;
      }
      
      // Add work experience
      const newWorkExperience = await WorkExperience.create(
        profile.id,
        company,
        position,
        new Date(start_date),
        end_date ? new Date(end_date) : null,
        description
      );
      
      res.status(201).json(newWorkExperience);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Add certification record
   */
  static async addCertification(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { name, issuing_organization, issue_date, expiration_date, credential_id } = req.body;
      
      // Get professional profile ID
      const profile = await ProfessionalProfile.findByUserId(req.user.id);
      
      if (!profile) {
        res.status(404).json({ message: 'Professional profile not found' });
        return;
      }
      
      // Add certification
      const newCertification = await Certification.create(
        profile.id,
        name,
        issuing_organization,
        new Date(issue_date),
        expiration_date ? new Date(expiration_date) : null,
        credential_id
      );
      
      res.status(201).json(newCertification);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
} 