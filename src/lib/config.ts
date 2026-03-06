import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  server: {
    port:    Number(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    url: requireEnv('DATABASE_URL'),
  },
  jwt: {
    secret:    requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cloudinary: {
    cloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey:    requireEnv('CLOUDINARY_API_KEY'),
    apiSecret: requireEnv('CLOUDINARY_API_SECRET'),
  },
  cors: {
    allowedOrigin: requireEnv('ALLOWED_ORIGIN'),
  },
  google: {
    clientId:     requireEnv('GOOGLE_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    callbackUrl:  requireEnv('GOOGLE_CALLBACK_URL'),
  },
  auth: {
    adminAllowedEmail: requireEnv('ADMIN_ALLOWED_EMAIL'),
    frontendUrl:       requireEnv('FRONTEND_URL'),
  },
} as const;