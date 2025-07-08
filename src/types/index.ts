// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  PROFESSIONAL = 'professional',
  USER = 'user'
}

// Base interface for timestamps
export interface TimeStamps {
  created_at: Date;
  updated_at: Date;
}

// User interface
export interface IUser extends TimeStamps {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// Professional profile interface
export interface IProfessionalProfile extends TimeStamps {
  id: number;
  user_id: number;
  specialization: string | null;
  years_of_experience: number | null;
  bio: string | null;
}

// Education interface
export interface IEducation extends TimeStamps {
  id: number;
  professional_id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: Date;
  end_date: Date | null;
  description: string | null;
}

// Work experience interface
export interface IWorkExperience extends TimeStamps {
  id: number;
  professional_id: number;
  company: string;
  position: string;
  start_date: Date;
  end_date: Date | null;
  description: string | null;
}

// Certification interface
export interface ICertification extends TimeStamps {
  id: number;
  professional_id: number;
  name: string;
  issuing_organization: string;
  issue_date: Date;
  expiration_date: Date | null;
  credential_id: string | null;
}

// Consultation type interface
export interface IConsultationType extends TimeStamps {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  is_online: boolean;
}

// Appointment status enum
export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Appointment interface
export interface IAppointment extends TimeStamps {
  id: number;
  user_id: number;
  professional_id: number;
  consultation_type_id: number;
  appointment_date: Date;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
}

// JWT payload interface
export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

// Request with user interface
import { Request } from 'express';
export interface RequestWithUser extends Request {
  user?: JwtPayload;
} 