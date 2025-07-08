import db from '../config/db';
import { ICertification } from '../types';

export class Certification {
  /**
   * Find certification by ID
   */
  static async findById(id: number): Promise<ICertification | null> {
    const result = await db.query('SELECT * FROM certifications WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find certifications by professional ID
   */
  static async findByProfessionalId(professionalId: number): Promise<ICertification[]> {
    const result = await db.query('SELECT * FROM certifications WHERE professional_id = $1', [professionalId]);
    return result.rows;
  }

  /**
   * Create new certification record
   */
  static async create(
    professionalId: number,
    name: string,
    issuingOrganization: string,
    issueDate: Date,
    expirationDate: Date | null = null,
    credentialId: string | null = null
  ): Promise<ICertification> {
    const result = await db.query(
      'INSERT INTO certifications (professional_id, name, issuing_organization, issue_date, expiration_date, credential_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [professionalId, name, issuingOrganization, issueDate, expirationDate, credentialId]
    );
    return result.rows[0];
  }

  /**
   * Update certification record
   */
  static async update(
    id: number,
    data: Partial<ICertification>
  ): Promise<ICertification | null> {
    const { name, issuing_organization, issue_date, expiration_date, credential_id } = data;
    
    const result = await db.query(
      'UPDATE certifications SET name = $1, issuing_organization = $2, issue_date = $3, expiration_date = $4, credential_id = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, issuing_organization, issue_date, expiration_date, credential_id, id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete certification record
   */
  static async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM certifications WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  /**
   * Verify certification record belongs to a professional
   */
  static async verifyOwnership(id: number, professionalId: number): Promise<boolean> {
    const result = await db.query(
      'SELECT * FROM certifications WHERE id = $1 AND professional_id = $2',
      [id, professionalId]
    );
    return result.rowCount > 0;
  }
} 