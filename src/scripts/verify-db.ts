import { query } from '../config/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyDatabase() {
  try {
    console.log('Verifying database data...');
    
    // Check users
    const users = await query('SELECT id, name, email, role FROM users');
    console.log('\n--- Users ---');
    console.log(`Total users: ${users.rows.length}`);
    users.rows.forEach(user => {
      console.log(`${user.id}: ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // Check professional profiles
    const professionals = await query(`
      SELECT p.id, u.name, p.specialization, p.years_of_experience 
      FROM professional_profiles p
      JOIN users u ON p.user_id = u.id
    `);
    console.log('\n--- Professional Profiles ---');
    console.log(`Total professionals: ${professionals.rows.length}`);
    professionals.rows.forEach(prof => {
      console.log(`${prof.id}: ${prof.name} - ${prof.specialization} (${prof.years_of_experience} years)`);
    });
    
    // Check consultation types
    const consultations = await query('SELECT id, name, duration, price, is_online FROM consultation_types');
    console.log('\n--- Consultation Types ---');
    console.log(`Total consultation types: ${consultations.rows.length}`);
    consultations.rows.forEach(consult => {
      console.log(`${consult.id}: ${consult.name} - ${consult.duration} mins, $${consult.price} (${consult.is_online ? 'Online' : 'In-person'})`);
    });
    
    // Check appointments
    const appointments = await query(`
      SELECT a.id, u.name as client, p.specialization, c.name as consultation_type, 
             a.appointment_date, a.appointment_time, a.status
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN professional_profiles p ON a.professional_id = p.id
      JOIN consultation_types c ON a.consultation_type_id = c.id
      ORDER BY a.appointment_date, a.appointment_time
    `);
    console.log('\n--- Appointments ---');
    console.log(`Total appointments: ${appointments.rows.length}`);
    appointments.rows.forEach(appt => {
      console.log(`${appt.id}: ${appt.client} - ${appt.consultation_type} with ${appt.specialization} specialist`);
      console.log(`   Date: ${appt.appointment_date} at ${appt.appointment_time} (${appt.status})`);
    });
    
    console.log('\nDatabase verification complete!');
  } catch (error) {
    console.error('Error verifying database:', error);
  }
}

// Run the verification function
verifyDatabase(); 