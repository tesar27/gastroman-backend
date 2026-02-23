import express from 'express';
import rateLimit from 'express-rate-limit';
import { signIn, signUp } from '../controllers/authController';

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authRateLimiter, signUp);
router.post('/signin', authRateLimiter, signIn);

export default router;
