import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Parsea variable de entorno con lista de correos.
 * Normaliza cada entrada: trim + lowercase.
 * Muestra si la variable no esta definida o resulta vacia tras parsear.
 */
function requireEmailList(key: string): string[] {
  const raw = requireEnv(key);
  const emails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length === 0) {
    throw new Error(`Environment variable ${key} must contain at least one valid email address.`);
  }

  return emails;
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
    adminAllowedEmails: requireEmailList('ADMIN_ALLOWED_EMAILS'),
    frontendUrl:       requireEnv('FRONTEND_URL'),
  },

  // Config Const
  catalog: {
    // true -> Endpoint Publico (devuelve todos los productos)
    // false -> Producción (solo productos con isVisible = true)
    showAllProducts: true,
  },
} as const;