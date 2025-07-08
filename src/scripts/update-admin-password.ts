import bcrypt from 'bcrypt';
import db from '../config/db';

async function updateAdminPassword() {
  try {
    // Admin email we want to update
    const adminEmail = 'admin@healthcare.com';
    
    // New secure password
    const newPassword = 'SecureAdmin@2024!';
    
    console.log('Checking if admin user exists...');
    const checkResult = await db.query('SELECT id FROM users WHERE email = $1 AND role = $2', [adminEmail, 'admin']);
    
    if (checkResult.rows.length === 0) {
      console.log('Admin user not found.');
      return;
    }
    
    // Hash the new password
    console.log('Updating admin password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 AND role = $3',
      [hashedPassword, adminEmail, 'admin']
    );
    
    console.log('Admin password updated successfully!');
    console.log('\nNew Admin Credentials:');
    console.log('------------------');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${newPassword}`);
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    // Close the database connection
    await db.pool.end();
  }
}

// Run the script
updateAdminPassword(); 