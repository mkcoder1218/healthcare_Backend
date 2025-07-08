import db from '../config/db';
import { IEducation } from '../types';

export class Education {
  /**
   * Find education by ID
   */
  static async findById(id: number): Promise<IEducation | null> {
    const result = await db.query('SELECT * FROM education WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find education by professional ID
   */
  static async findByProfessionalId(professionalId: number): Promise<IEducation[]> {
    const result = await db.query('SELECT * FROM education WHERE professional_id = $1', [professionalId]);
    return result.rows;
  }

  /**
   * Create new education record
   */
  static async create(
    professionalId: number,
    institution: string,
    degree: string,
    fieldOfStudy: string,
    startDate: Date,
    endDate: Date | null = null,
    description: string | null = null
  ): Promise<IEducation> {
    const result = await db.query(
      'INSERT INTO education (professional_id, institution, degree, field_of_study, start_date, end_date, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [professionalId, institution, degree, fieldOfStudy, startDate, endDate, description]
    );
    return result.rows[0];
  }

  /**
   * Update education record
   */
  static async update(
    id: number,
    data: Partial<IEducation>
  ): Promise<IEducation | null> {
    const { institution, degree, field_of_study, start_date, end_date, description } = data;
    
    const result = await db.query(
      'UPDATE education SET institution = $1, degree = $2, field_of_study = $3, start_date = $4, end_date = $5, description = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [institution, degree, field_of_study, start_date, end_date, description, id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete education record
   */
  static async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM education WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  /**
   * Verify education record belongs to a professional
   */
  static async verifyOwnership(id: number, professionalId: number): Promise<boolean> {
    const result = await db.query(
      'SELECT * FROM education WHERE id = $1 AND professional_id = $2',
      [id, professionalId]
    );
    return result.rowCount > 0;
  }
} 