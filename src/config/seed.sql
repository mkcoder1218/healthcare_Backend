-- Seed data for mental_health_db
-- Run this after db_init.sql to populate the database with test data

-- Clear existing data (uncomment if needed)
-- TRUNCATE users, professional_profiles, education, work_experience, certifications, consultation_types, appointments CASCADE;

-- Users: admin, professionals, and regular users
-- Passwords are hashed versions of simple passwords (admin123, prof123, user123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@mentalhealthcare.com', '$2b$10$7JWm.z9BM7iDsl0ahf3ebe0xRla5EGh/bn6tWxgmnvpl/5/x4rRF6', 'admin'),
('Dr. Sarah Johnson', 'sarah.johnson@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'professional'),
('Dr. Michael Chen', 'michael.chen@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'professional'),
('Dr. Olivia Rodriguez', 'olivia.rodriguez@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'professional'),
('John Smith', 'john.smith@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'user'),
('Emma Wilson', 'emma.wilson@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'user'),
('David Lee', 'david.lee@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'user'),
('Sophia Garcia', 'sophia.garcia@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'user');

-- Professional profiles
INSERT INTO professional_profiles (user_id, specialization, years_of_experience, bio) VALUES
(2, 'Clinical Psychology', 12, 'Dr. Johnson specializes in cognitive behavioral therapy with a focus on anxiety disorders and depression. She has extensive experience working with adults and adolescents in both individual and group therapy settings.'),
(3, 'Psychiatry', 8, 'Dr. Chen is a board-certified psychiatrist specializing in mood disorders and psychopharmacology. He takes a holistic approach to mental health, combining medication management with therapeutic interventions.'),
(4, 'Family Therapy', 10, 'Dr. Rodriguez is an experienced family therapist who specializes in relationship counseling, parenting challenges, and family dynamics. She is trained in systemic therapy and solution-focused approaches.');

-- Education records
INSERT INTO education (professional_id, institution, degree, field_of_study, start_date, end_date, description) VALUES
(1, 'Stanford University', 'Ph.D.', 'Clinical Psychology', '2006-09-01', '2011-06-15', 'Dissertation on cognitive behavioral interventions for anxiety disorders'),
(1, 'University of California, Berkeley', 'B.A.', 'Psychology', '2002-09-01', '2006-05-30', 'Graduated with honors, research focus on developmental psychology'),
(2, 'Harvard Medical School', 'M.D.', 'Psychiatry', '2009-08-15', '2013-05-20', 'Specialized in neuropsychiatry and psychopharmacology'),
(2, 'Yale University', 'B.S.', 'Neuroscience', '2005-09-01', '2009-05-15', 'Magna cum laude, thesis on neurotransmitter systems'),
(3, 'Columbia University', 'Ph.D.', 'Clinical Psychology', '2008-09-01', '2013-06-01', 'Focus on family systems therapy and multicultural counseling'),
(3, 'New York University', 'M.A.', 'Psychology', '2006-09-01', '2008-05-30', 'Specialized in developmental psychology');

-- Work experience
INSERT INTO work_experience (professional_id, company, position, start_date, end_date, description) VALUES
(1, 'Bay Area Mental Health Center', 'Senior Clinical Psychologist', '2015-07-01', NULL, 'Provide individual and group therapy for adults with anxiety, depression, and trauma-related disorders'),
(1, 'Stanford University Medical Center', 'Staff Psychologist', '2011-08-01', '2015-06-30', 'Conducted psychological assessments and provided therapy in outpatient psychiatric department'),
(2, 'Comprehensive Psychiatric Services', 'Medical Director', '2018-01-15', NULL, 'Oversee clinical operations and provide psychiatric evaluations and medication management'),
(2, 'General Hospital Psychiatric Department', 'Staff Psychiatrist', '2013-07-01', '2017-12-31', 'Provided inpatient and outpatient psychiatric services'),
(3, 'Family Counseling Institute', 'Director of Clinical Services', '2017-03-01', NULL, 'Supervise clinical staff and provide family therapy services'),
(3, 'Community Mental Health Clinic', 'Family Therapist', '2013-09-01', '2017-02-28', 'Provided therapy for families experiencing relationship difficulties, parenting challenges, and life transitions');

-- Certifications
INSERT INTO certifications (professional_id, name, issuing_organization, issue_date, expiration_date, credential_id) VALUES
(1, 'Certified Clinical Trauma Professional', 'International Association of Trauma Professionals', '2016-05-15', '2024-05-15', 'CCTP-45678'),
(1, 'Certified CBT Specialist', 'Academy of Cognitive Behavioral Therapies', '2014-03-10', '2023-03-10', 'CBTS-12345'),
(2, 'Board Certification in Psychiatry', 'American Board of Psychiatry and Neurology', '2015-06-20', NULL, 'BP-789012'),
(2, 'Certification in Psychopharmacology', 'American Society of Clinical Psychopharmacology', '2017-11-05', '2023-11-05', 'CP-56789'),
(3, 'Licensed Marriage and Family Therapist', 'State Board of Marriage and Family Therapy', '2014-07-15', '2024-07-15', 'LMFT-34567'),
(3, 'Certified Family Trauma Professional', 'International Association of Trauma Professionals', '2018-04-22', '2024-04-22', 'CFTP-67890');

-- Consultation types (if not already in db_init.sql)
INSERT INTO consultation_types (name, description, duration, price, is_online) VALUES
('Initial Psychiatric Evaluation', 'Comprehensive assessment with a psychiatrist', 90, 250.00, true),
('Medication Management', 'Follow-up appointment for medication review and adjustment', 30, 120.00, true),
('Family Therapy Session', 'Therapy session for families to address relationship dynamics', 75, 180.00, false),
('Couples Counseling', 'Therapy for couples experiencing relationship difficulties', 60, 160.00, false),
('Online Quick Check-in', 'Brief virtual session for established clients', 20, 60.00, true);

-- Appointments (mix of past, current, and future appointments with different statuses)
INSERT INTO appointments (user_id, professional_id, consultation_type_id, appointment_date, appointment_time, status, notes) VALUES
-- Past appointments
(5, 1, 1, '2023-10-15', '09:00:00', 'completed', 'Initial assessment completed. Recommended weekly therapy sessions.'),
(5, 1, 2, '2023-10-22', '10:00:00', 'completed', 'Client showing improvement with anxiety symptoms.'),
(6, 2, 1, '2023-10-18', '14:30:00', 'completed', 'Medication prescribed for depression. Follow-up in two weeks.'),
(6, 2, 2, '2023-11-01', '15:00:00', 'completed', 'Medication dosage adjusted due to side effects.'),
(7, 3, 3, '2023-10-20', '16:00:00', 'completed', 'Family attended session. Focus on improving communication patterns.'),
(7, 3, 3, '2023-11-03', '16:00:00', 'cancelled', 'Client called to cancel due to illness.'),

-- Current/upcoming appointments
(5, 1, 2, CURRENT_DATE, '11:00:00', 'confirmed', 'Follow-up session to discuss progress with anxiety management techniques.'),
(6, 2, 5, CURRENT_DATE + 1, '09:30:00', 'confirmed', 'Quick check-in on medication effectiveness.'),
(7, 3, 3, CURRENT_DATE + 2, '15:00:00', 'confirmed', 'Continuing work on family communication strategies.'),
(8, 1, 1, CURRENT_DATE + 3, '13:00:00', 'pending', 'New client initial assessment.'),
(8, 2, 2, CURRENT_DATE + 5, '10:00:00', 'pending', NULL),
(5, 3, 4, CURRENT_DATE + 7, '14:00:00', 'pending', 'Client requested couples counseling with partner.'); 