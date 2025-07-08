import express from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth';
import { RequestWithUser } from '../types';
import db from '../config/db';
import { IConsultationType } from '../types';

const router = express.Router();

// Get all consultation types (public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, description, duration, price, is_online, created_at, updated_at
      FROM consultation_types
      ORDER BY name ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consultation type by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT id, name, description, duration, price, is_online, created_at, updated_at
      FROM consultation_types
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Consultation type not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new consultation type (admin only)
router.post('/', verifyToken, isAdmin, async (req: RequestWithUser, res) => {
  try {
    const { name, description, duration, price, is_online } = req.body;
    
    // Validate required fields
    if (!name || !duration || price === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await db.query(`
      INSERT INTO consultation_types (name, description, duration, price, is_online)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, duration, price, is_online, created_at, updated_at
    `, [name, description, duration, price, is_online]);
    
    res.status(201).json({ consultation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update consultation type (admin only)
router.put('/:id', verifyToken, isAdmin, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration, price, is_online } = req.body;
    
    // Check if consultation type exists
    const checkResult = await db.query('SELECT id FROM consultation_types WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Consultation type not found' });
    }
    
    // Update consultation type
    const result = await db.query(`
      UPDATE consultation_types
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          duration = COALESCE($3, duration),
          price = COALESCE($4, price),
          is_online = COALESCE($5, is_online),
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, name, description, duration, price, is_online, created_at, updated_at
    `, [name, description, duration, price, is_online, id]);
    
    res.json({ consultation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete consultation type (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;
    
    // Check if consultation type exists
    const checkResult = await db.query('SELECT id FROM consultation_types WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Consultation type not found' });
    }
    
    // Delete consultation type
    await db.query('DELETE FROM consultation_types WHERE id = $1', [id]);
    
    res.json({ message: 'Consultation type deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 