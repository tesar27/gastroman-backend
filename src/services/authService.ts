import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env';
import { database } from '../db/database';
import { HttpError } from '../errors/httpErrors';
import type { User } from '../models/userModel';

const authSchema = z.object({
  email: z.email().max(255).transform((value) => value.toLowerCase().trim()),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must include at least one letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
});

interface AuthResult {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

export class AuthService {
  async signUp(input: unknown): Promise<AuthResult> {
    const { email, password } = authSchema.parse(input);

    const existingUsers = await database.query<User>('SELECT id, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length > 0) {
      throw new HttpError(409, 'User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await database.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, passwordHash]);

    if (!result.insertId) {
      throw new HttpError(500, 'Could not create user');
    }

    return this.createAuthResult(result.insertId, email);
  }

  async signIn(input: unknown): Promise<AuthResult> {
    const { email, password } = authSchema.parse(input);

    const users = await database.query<User>('SELECT id, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];

    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new HttpError(401, 'Invalid credentials');
    }

    return this.createAuthResult(user.id, user.email);
  }

  private createAuthResult(id: number, email: string): AuthResult {
    const jwtOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
    };

    const token = jwt.sign({ id, email }, config.jwtSecret, {
      ...jwtOptions,
    });

    return {
      token,
      user: {
        id,
        email,
      },
    };
  }
}
