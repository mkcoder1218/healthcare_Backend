-- Create database (run this separately)
-- CREATE DATABASE mental_health_db;

-- Connect to the database
-- \c mental_health_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultation types table
CREATE TABLE IF NOT EXISTS consultation_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INT NOT NULL, -- Duration in minutes
  price DECIMAL(10,2) NOT NULL,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  consultation_type_id INT REFERENCES consultation_types(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample consultation types
INSERT INTO consultation_types (name, description, duration, price, is_online)
VALUES 
  ('Initial Consultation', 'First time assessment of mental health needs', 60, 120.00, true),
  ('Follow-up Session', 'Regular follow-up therapy session', 45, 90.00, true),
  ('In-person Therapy', 'Face to face therapy session', 60, 150.00, false),
  ('Crisis Intervention', 'Immediate assistance for urgent mental health needs', 90, 200.00, true),
  ('Group Therapy', 'Therapy session in a group setting', 120, 80.00, false);

-- Create an admin user (password: admin123)
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@mentalhealthcare.com', '$2b$10$7JWm.z9BM7iDsl0ahf3ebe0xRla5EGh/bn6tWxgmnvpl/5/x4rRF6', 'admin');

-- Create a client user (password: client123)
INSERT INTO users (name, email, password, role)
VALUES ('Client User', 'client@example.com', '$2b$10$1YfvSWC5dMz1CouQQJ3R8eXXMxq2yYKt.OXQ/J1IRKvp5wZzYjXqm', 'client'); 