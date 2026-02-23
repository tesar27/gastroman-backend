import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { database } from './db/database';
import { errorMiddleware } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurantRoutes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Routes
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', env: config.appEnv });
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use(errorMiddleware);

// Start server
const bootstrap = async () => {
  await database.init();

  app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
  });
};

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});