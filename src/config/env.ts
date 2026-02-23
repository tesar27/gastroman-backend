import dotenv from 'dotenv';

dotenv.config();

type AppEnv = 'local' | 'dev' | 'staging' | 'prod';

const envTag = (process.env.APP_ENV ?? process.env.ENV_TAG ?? process.env.NODE_ENV ?? 'dev').toLowerCase();

const appEnv: AppEnv = envTag === 'production' ? 'prod' : (envTag as AppEnv);
const isProdLike = appEnv === 'staging' || appEnv === 'prod';

export const config = {
  appEnv,
  isProdLike,
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  sqliteFile: process.env.SQLITE_FILE ?? './data/gastroman.sqlite',
  mariadb: {
    host: process.env.MARIADB_HOST ?? 'localhost',
    port: Number(process.env.MARIADB_PORT ?? 3306),
    user: process.env.MARIADB_USER ?? 'root',
    password: process.env.MARIADB_PASSWORD ?? '',
    database: process.env.MARIADB_DATABASE ?? 'gastroman',
    connectionLimit: Number(process.env.MARIADB_CONNECTION_LIMIT ?? 5),
  },
};

if (isProdLike && config.jwtSecret === 'change-this-in-production') {
  throw new Error('JWT_SECRET must be set in staging/prod environments.');
}
