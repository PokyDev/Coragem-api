/**
 * src/server.ts
 *
 * Punto de entrada del proceso Node.js.
 * Importa buildApp() y arranca el servidor en el puerto configurado.
 *
 * Separado de app.ts para permitir que los tests importen la app
 * sin abrir el puerto.
 */

import { buildApp } from './app';
import { config   } from './lib/config';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({
      port: config.server.port,
      host: '0.0.0.0', // necesario para EC2 / Docker
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();