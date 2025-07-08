import db from '../config/db';
import { IUser, UserRole } from '../types';

export class User {
  /**
   * Find a user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  /**
   * Find a user by ID
   */
  static async findById(id: number): Promise<IUser | null> {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  static async create(name: string, email: string, hashedPassword: string, role: UserRole = UserRole.USER): Promise<IUser> {
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, role]
    );
    return result.rows[0];
  }

  /**
   * Find all users
   */
  static async findAll(): Promise<IUser[]> {
    const result = await db.query('SELECT id, name, email, role, created_at, updated_at FROM users');
    return result.rows;
  }

  /**
   * Update a user
   */
  static async update(id: number, data: Partial<IUser>): Promise<IUser | null> {
    const { name, email, role } = data;
    const result = await db.query(
      'UPDATE users SET name = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, email, role, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a user
   */
  static async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
} 