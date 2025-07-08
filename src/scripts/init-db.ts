import { query } from '../config/db';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../config/db_init.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL script into individual statements
    // This is a simple implementation and might not work for all SQL scripts
    const statements = sqlScript
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      await query(statement);
    }
    
    console.log('Database schema initialized successfully!');
  } catch (error) {
    console.error('Error initializing database schema:', error);
  }
}

// Run the initialization function
initializeDatabase(); 