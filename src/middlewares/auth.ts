import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole, RequestWithUser } from '../types';

// Middleware to verify JWT token
export const verifyToken = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  // Check for x-auth-token header first
  let token = req.header('x-auth-token');
  
  // If not found, check for Authorization header with Bearer token
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret') as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to verify if user is admin
export const isAdmin = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    next();
    return;
  }
  
  res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

// Middleware to verify if user is a professional
export const isProfessional = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === UserRole.PROFESSIONAL) {
    next();
    return;
  }
  
  res.status(403).json({ message: 'Access denied. Professional privileges required.' });
};

// Middleware to verify if user is a professional or admin
export const isProfessionalOrAdmin = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === UserRole.PROFESSIONAL || req.user.role === UserRole.ADMIN)) {
    next();
    return;
  }
  
  res.status(403).json({ message: 'Access denied. Professional or admin privileges required.' });
};

// Middleware to verify user owns the requested resource or is admin
export const isOwnerOrAdmin = (resourceUserId: number) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (req.user && (req.user.id === resourceUserId || req.user.role === UserRole.ADMIN)) {
      next();
      return;
    }
    
    res.status(403).json({ message: 'Access denied. You do not have permission to access this resource.' });
  };
}; 