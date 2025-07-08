import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { UserRole } from '../types';
import db from '../config/db';

async function createAdminUser() {
  try {
    // Admin user details
    const adminName = 'Admin User';
    const adminEmail = 'admin@healthcare.com';
    const adminPassword = 'admin123'; // This should be changed after first login
    
    console.log('Checking if admin user already exists...');
    const existingUser = await User.findByEmail(adminEmail);
    
    if (existingUser) {
      console.log('Admin user already exists.');
      return;
    }
    
    // Hash the password
    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Create the admin user
    const adminUser = await User.create(
      adminName,
      adminEmail,
      hashedPassword,
      UserRole.ADMIN
    );
    
    console.log('Admin user created successfully:');
    console.log({
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    });
    
    console.log('\nAdmin Credentials:');
    console.log('------------------');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\nIMPORTANT: Please change this password after the first login!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the database connection
    await db.pool.end();
  }
}

// Run the script
createAdminUser(); 