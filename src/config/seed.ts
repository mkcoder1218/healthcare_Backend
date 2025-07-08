import { query } from './db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Main seed function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Check if data already exists to prevent duplicate seeding
    const userCheck = await query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) > 3) { // We expect 3 users from db_init.sql
      console.log('Database already contains user data. Skipping seed operation.');
      console.log('If you want to reseed, please run npm run reset-db first.');
      return;
    }

    // Create users: admin, professionals, and regular users
    console.log('Creating users...');
    const adminPassword = await hashPassword('admin123');
    const profPassword = await hashPassword('prof123');
    const userPassword = await hashPassword('user123');

    // Check if admin user exists
    const adminCheck = await query("SELECT COUNT(*) FROM users WHERE email = 'admin@mentalhealthcare.com'");
    if (parseInt(adminCheck.rows[0].count) === 0) {
      await query(`
        INSERT INTO users (name, email, password, role) VALUES
        ('Admin User', 'admin@mentalhealthcare.com', $1, 'admin')
      `, [adminPassword]);
    }

    // Add more users
    await query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Dr. Sarah Johnson', 'sarah.johnson@example.com', $1, 'professional'),
      ('Dr. Michael Chen', 'michael.chen@example.com', $1, 'professional'),
      ('Dr. Olivia Rodriguez', 'olivia.rodriguez@example.com', $1, 'professional'),
      ('John Smith', 'john.smith@example.com', $2, 'user'),
      ('Emma Wilson', 'emma.wilson@example.com', $2, 'user'),
      ('David Lee', 'david.lee@example.com', $2, 'user'),
      ('Sophia Garcia', 'sophia.garcia@example.com', $2, 'user')
    `, [profPassword, userPassword]);

    // Create professional profiles
    console.log('Creating professional profiles...');
    await query(`
      INSERT INTO professional_profiles (user_id, specialization, years_of_experience, bio) VALUES
      ((SELECT id FROM users WHERE email = 'sarah.johnson@example.com'), 'Clinical Psychology', 12, 'Dr. Johnson specializes in cognitive behavioral therapy with a focus on anxiety disorders and depression. She has extensive experience working with adults and adolescents in both individual and group therapy settings.'),
      ((SELECT id FROM users WHERE email = 'michael.chen@example.com'), 'Psychiatry', 8, 'Dr. Chen is a board-certified psychiatrist specializing in mood disorders and psychopharmacology. He takes a holistic approach to mental health, combining medication management with therapeutic interventions.'),
      ((SELECT id FROM users WHERE email = 'olivia.rodriguez@example.com'), 'Family Therapy', 10, 'Dr. Rodriguez is an experienced family therapist who specializes in relationship counseling, parenting challenges, and family dynamics. She is trained in systemic therapy and solution-focused approaches.')
    `);

    // Get professional IDs for further data insertion
    const profIds = await query(`
      SELECT p.id, u.email 
      FROM professional_profiles p 
      JOIN users u ON p.user_id = u.id 
      WHERE u.email IN ('sarah.johnson@example.com', 'michael.chen@example.com', 'olivia.rodriguez@example.com')
    `);
    
    const profIdMap = new Map();
    profIds.rows.forEach(row => {
      profIdMap.set(row.email, row.id);
    });

    // Create education records
    console.log('Creating education records...');
    await query(`
      INSERT INTO education (professional_id, institution, degree, field_of_study, start_date, end_date, description) VALUES
      ($1, 'Stanford University', 'Ph.D.', 'Clinical Psychology', '2006-09-01', '2011-06-15', 'Dissertation on cognitive behavioral interventions for anxiety disorders'),
      ($1, 'University of California, Berkeley', 'B.A.', 'Psychology', '2002-09-01', '2006-05-30', 'Graduated with honors, research focus on developmental psychology'),
      ($2, 'Harvard Medical School', 'M.D.', 'Psychiatry', '2009-08-15', '2013-05-20', 'Specialized in neuropsychiatry and psychopharmacology'),
      ($2, 'Yale University', 'B.S.', 'Neuroscience', '2005-09-01', '2009-05-15', 'Magna cum laude, thesis on neurotransmitter systems'),
      ($3, 'Columbia University', 'Ph.D.', 'Clinical Psychology', '2008-09-01', '2013-06-01', 'Focus on family systems therapy and multicultural counseling'),
      ($3, 'New York University', 'M.A.', 'Psychology', '2006-09-01', '2008-05-30', 'Specialized in developmental psychology')
    `, [
      profIdMap.get('sarah.johnson@example.com'),
      profIdMap.get('michael.chen@example.com'),
      profIdMap.get('olivia.rodriguez@example.com')
    ]);

    // Create work experience records
    console.log('Creating work experience records...');
    await query(`
      INSERT INTO work_experience (professional_id, company, position, start_date, end_date, description) VALUES
      ($1, 'Bay Area Mental Health Center', 'Senior Clinical Psychologist', '2015-07-01', NULL, 'Provide individual and group therapy for adults with anxiety, depression, and trauma-related disorders'),
      ($1, 'Stanford University Medical Center', 'Staff Psychologist', '2011-08-01', '2015-06-30', 'Conducted psychological assessments and provided therapy in outpatient psychiatric department'),
      ($2, 'Comprehensive Psychiatric Services', 'Medical Director', '2018-01-15', NULL, 'Oversee clinical operations and provide psychiatric evaluations and medication management'),
      ($2, 'General Hospital Psychiatric Department', 'Staff Psychiatrist', '2013-07-01', '2017-12-31', 'Provided inpatient and outpatient psychiatric services'),
      ($3, 'Family Counseling Institute', 'Director of Clinical Services', '2017-03-01', NULL, 'Supervise clinical staff and provide family therapy services'),
      ($3, 'Community Mental Health Clinic', 'Family Therapist', '2013-09-01', '2017-02-28', 'Provided therapy for families experiencing relationship difficulties, parenting challenges, and life transitions')
    `, [
      profIdMap.get('sarah.johnson@example.com'),
      profIdMap.get('michael.chen@example.com'),
      profIdMap.get('olivia.rodriguez@example.com')
    ]);

    // Create certification records
    console.log('Creating certification records...');
    await query(`
      INSERT INTO certifications (professional_id, name, issuing_organization, issue_date, expiration_date, credential_id) VALUES
      ($1, 'Certified Clinical Trauma Professional', 'International Association of Trauma Professionals', '2016-05-15', '2024-05-15', 'CCTP-45678'),
      ($1, 'Certified CBT Specialist', 'Academy of Cognitive Behavioral Therapies', '2014-03-10', '2023-03-10', 'CBTS-12345'),
      ($2, 'Board Certification in Psychiatry', 'American Board of Psychiatry and Neurology', '2015-06-20', NULL, 'BP-789012'),
      ($2, 'Certification in Psychopharmacology', 'American Society of Clinical Psychopharmacology', '2017-11-05', '2023-11-05', 'CP-56789'),
      ($3, 'Licensed Marriage and Family Therapist', 'State Board of Marriage and Family Therapy', '2014-07-15', '2024-07-15', 'LMFT-34567'),
      ($3, 'Certified Family Trauma Professional', 'International Association of Trauma Professionals', '2018-04-22', '2024-04-22', 'CFTP-67890')
    `, [
      profIdMap.get('sarah.johnson@example.com'),
      profIdMap.get('michael.chen@example.com'),
      profIdMap.get('olivia.rodriguez@example.com')
    ]);

    // Check if we need to add more consultation types
    const consultationCheck = await query('SELECT COUNT(*) FROM consultation_types');
    if (parseInt(consultationCheck.rows[0].count) < 10) {
      console.log('Adding additional consultation types...');
      await query(`
        INSERT INTO consultation_types (name, description, duration, price, is_online) VALUES
        ('Initial Psychiatric Evaluation', 'Comprehensive assessment with a psychiatrist', 90, 250.00, true),
        ('Medication Management', 'Follow-up appointment for medication review and adjustment', 30, 120.00, true),
        ('Family Therapy Session', 'Therapy session for families to address relationship dynamics', 75, 180.00, false),
        ('Couples Counseling', 'Therapy for couples experiencing relationship difficulties', 60, 160.00, false),
        ('Online Quick Check-in', 'Brief virtual session for established clients', 20, 60.00, true)
      `);
    }

    // Create appointments (mix of past, current, and future)
    console.log('Creating appointments...');
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    // Past dates
    const pastDate1 = new Date();
    pastDate1.setDate(today.getDate() - 30);
    const pastDate2 = new Date();
    pastDate2.setDate(today.getDate() - 23);
    const pastDate3 = new Date();
    pastDate3.setDate(today.getDate() - 20);
    const pastDate4 = new Date();
    pastDate4.setDate(today.getDate() - 15);
    const pastDate5 = new Date();
    pastDate5.setDate(today.getDate() - 10);
    const pastDate6 = new Date();
    pastDate6.setDate(today.getDate() - 5);

    // Future dates
    const futureDate1 = new Date();
    futureDate1.setDate(today.getDate() + 1);
    const futureDate2 = new Date();
    futureDate2.setDate(today.getDate() + 2);
    const futureDate3 = new Date();
    futureDate3.setDate(today.getDate() + 3);
    const futureDate5 = new Date();
    futureDate5.setDate(today.getDate() + 5);
    const futureDate7 = new Date();
    futureDate7.setDate(today.getDate() + 7);
    
    try {
      // Get user IDs
      const userIds = await query(`
        SELECT id, email FROM users WHERE email IN (
          'john.smith@example.com', 
          'emma.wilson@example.com', 
          'david.lee@example.com', 
          'sophia.garcia@example.com'
        )
      `);
      
      const userIdMap = new Map();
      userIds.rows.forEach(row => {
        userIdMap.set(row.email, row.id);
      });

      // Past appointments
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 1, $3, '09:00:00', 'completed', 'Initial assessment completed. Recommended weekly therapy sessions.')`,
        [userIdMap.get('john.smith@example.com'), profIdMap.get('sarah.johnson@example.com'), formatDate(pastDate1)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 2, $3, '10:00:00', 'completed', 'Client showing improvement with anxiety symptoms.')`,
        [userIdMap.get('john.smith@example.com'), profIdMap.get('sarah.johnson@example.com'), formatDate(pastDate2)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 6, $3, '14:30:00', 'completed', 'Medication prescribed for depression. Follow-up in two weeks.')`,
        [userIdMap.get('emma.wilson@example.com'), profIdMap.get('michael.chen@example.com'), formatDate(pastDate3)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 7, $3, '15:00:00', 'completed', 'Medication dosage adjusted due to side effects.')`,
        [userIdMap.get('emma.wilson@example.com'), profIdMap.get('michael.chen@example.com'), formatDate(pastDate4)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 8, $3, '16:00:00', 'completed', 'Family attended session. Focus on improving communication patterns.')`,
        [userIdMap.get('david.lee@example.com'), profIdMap.get('olivia.rodriguez@example.com'), formatDate(pastDate5)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 8, $3, '16:00:00', 'cancelled', 'Client called to cancel due to illness.')`,
        [userIdMap.get('david.lee@example.com'), profIdMap.get('olivia.rodriguez@example.com'), formatDate(pastDate6)]
      );
      
      // Current/upcoming appointments
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 2, $3, '11:00:00', 'confirmed', 'Follow-up session to discuss progress with anxiety management techniques.')`,
        [userIdMap.get('john.smith@example.com'), profIdMap.get('sarah.johnson@example.com'), formatDate(today)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 10, $3, '09:30:00', 'confirmed', 'Quick check-in on medication effectiveness.')`,
        [userIdMap.get('emma.wilson@example.com'), profIdMap.get('michael.chen@example.com'), formatDate(futureDate1)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 8, $3, '15:00:00', 'confirmed', 'Continuing work on family communication strategies.')`,
        [userIdMap.get('david.lee@example.com'), profIdMap.get('olivia.rodriguez@example.com'), formatDate(futureDate2)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 1, $3, '13:00:00', 'pending', 'New client initial assessment.')`,
        [userIdMap.get('sophia.garcia@example.com'), profIdMap.get('sarah.johnson@example.com'), formatDate(futureDate3)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 7, $3, '10:00:00', 'pending', NULL)`,
        [userIdMap.get('sophia.garcia@example.com'), profIdMap.get('michael.chen@example.com'), formatDate(futureDate5)]
      );
      
      await query(`
        INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
        ($1, $2, 9, $3, '14:00:00', 'pending', 'Client requested couples counseling with partner.')`,
        [userIdMap.get('john.smith@example.com'), profIdMap.get('olivia.rodriguez@example.com'), formatDate(futureDate7)]
      );
      
    } catch (error) {
      console.error('Error creating appointments:', error);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seed function
seedDatabase(); 