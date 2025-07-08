import { query } from '../config/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Drop all tables with CASCADE to handle dependencies
    await query(`
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS consultation_types CASCADE;
      DROP TABLE IF EXISTS certifications CASCADE;
      DROP TABLE IF EXISTS work_experience CASCADE;
      DROP TABLE IF EXISTS education CASCADE;
      DROP TABLE IF EXISTS professional_profiles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    console.log('All tables dropped successfully!');
    console.log('Please run npm run setup-db to recreate the schema and seed data.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

// Run the reset function
resetDatabase(); 