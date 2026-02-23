import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { HttpError } from '../errors/httpErrors';
import type { JwtPayload } from '../models/userModel';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new HttpError(401, 'Authorization token missing'));
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
};
