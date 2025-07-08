import db from '../config/db';
import { IWorkExperience } from '../types';

export class WorkExperience {
  /**
   * Find work experience by ID
   */
  static async findById(id: number): Promise<IWorkExperience | null> {
    const result = await db.query('SELECT * FROM work_experience WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find work experience by professional ID
   */
  static async findByProfessionalId(professionalId: number): Promise<IWorkExperience[]> {
    const result = await db.query('SELECT * FROM work_experience WHERE professional_id = $1', [professionalId]);
    return result.rows;
  }

  /**
   * Create new work experience record
   */
  static async create(
    professionalId: number,
    company: string,
    position: string,
    startDate: Date,
    endDate: Date | null = null,
    description: string | null = null
  ): Promise<IWorkExperience> {
    const result = await db.query(
      'INSERT INTO work_experience (professional_id, company, position, start_date, end_date, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [professionalId, company, position, startDate, endDate, description]
    );
    return result.rows[0];
  }

  /**
   * Update work experience record
   */
  static async update(
    id: number,
    data: Partial<IWorkExperience>
  ): Promise<IWorkExperience | null> {
    const { company, position, start_date, end_date, description } = data;
    
    const result = await db.query(
      'UPDATE work_experience SET company = $1, position = $2, start_date = $3, end_date = $4, description = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [company, position, start_date, end_date, description, id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete work experience record
   */
  static async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM work_experience WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  /**
   * Verify work experience record belongs to a professional
   */
  static async verifyOwnership(id: number, professionalId: number): Promise<boolean> {
    const result = await db.query(
      'SELECT * FROM work_experience WHERE id = $1 AND professional_id = $2',
      [id, professionalId]
    );
    return result.rowCount > 0;
  }
} 