import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await authService.signUp(req.body);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await authService.signIn(req.body);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
