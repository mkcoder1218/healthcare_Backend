import db from '../config/db';
import { IProfessionalProfile } from '../types';

export class ProfessionalProfile {
  /**
   * Find a professional profile by user ID
   */
  static async findByUserId(userId: number): Promise<IProfessionalProfile | null> {
    const result = await db.query('SELECT * FROM professional_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find a professional profile by ID
   */
  static async findById(id: number): Promise<IProfessionalProfile | null> {
    const result = await db.query('SELECT * FROM professional_profiles WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new professional profile
   */
  static async create(userId: number, data: Partial<IProfessionalProfile> = {}): Promise<IProfessionalProfile> {
    const { specialization, years_of_experience, bio } = data;
    
    const result = await db.query(
      'INSERT INTO professional_profiles (user_id, specialization, years_of_experience, bio) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, specialization || null, years_of_experience || null, bio || null]
    );
    
    return result.rows[0];
  }

  /**
   * Update a professional profile
   */
  static async update(userId: number, data: Partial<IProfessionalProfile>): Promise<IProfessionalProfile | null> {
    const { specialization, years_of_experience, bio } = data;
    
    const result = await db.query(
      'UPDATE professional_profiles SET specialization = $1, years_of_experience = $2, bio = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4 RETURNING *',
      [specialization, years_of_experience, bio, userId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Find all professionals with their user information
   */
  static async findAllWithUserInfo() {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, p.id AS profile_id, p.specialization, p.years_of_experience, p.bio
      FROM users u
      JOIN professional_profiles p ON u.id = p.user_id
      WHERE u.role = 'professional'
    `);
    
    return result.rows;
  }

  /**
   * Find a professional with full profile by ID
   */
  static async findFullProfileById(userId: number) {
    // Get basic professional info
    const professional = await db.query(`
      SELECT u.id, u.name, u.email, p.id AS profile_id, p.specialization, p.years_of_experience, p.bio
      FROM users u
      JOIN professional_profiles p ON u.id = p.user_id
      WHERE u.id = $1 AND u.role = 'professional'
    `, [userId]);
    
    if (professional.rows.length === 0) {
      return null;
    }

    const profileId = professional.rows[0].profile_id;
    
    // Get education
    const education = await db.query(`
      SELECT * FROM education WHERE professional_id = $1
    `, [profileId]);
    
    // Get work experience
    const workExperience = await db.query(`
      SELECT * FROM work_experience WHERE professional_id = $1
    `, [profileId]);
    
    // Get certifications
    const certifications = await db.query(`
      SELECT * FROM certifications WHERE professional_id = $1
    `, [profileId]);
    
    return {
      ...professional.rows[0],
      education: education.rows,
      work_experience: workExperience.rows,
      certifications: certifications.rows
    };
  }
} 