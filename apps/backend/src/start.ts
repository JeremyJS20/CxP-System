import dotenv from 'dotenv';
import net from 'net';

dotenv.config();

const LOCAL_DB_HOST = 'localhost';
const LOCAL_DB_PORT = parseInt(process.env.LOCAL_DB_PORT || '5432', 10);

function isLocalDbAvailable(): Promise<boolean> {
  return new Promise(resolve => {
    const socket = net.createConnection(LOCAL_DB_PORT, LOCAL_DB_HOST);
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  if (process.env.VERCEL) {
    await import('./server');
    return;
  }

  const localAvailable = await isLocalDbAvailable();
  if (localAvailable) {
    console.log('✅ Usando PostgreSQL local');
  } else if (process.env.DATABASE_URL_NEON) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_NEON;
    if (process.env.DATABASE_URL_DIRECT_NEON) {
      process.env.DATABASE_URL_DIRECT = process.env.DATABASE_URL_DIRECT_NEON;
    }
    console.log('⚠️ PostgreSQL local no disponible — usando Neon (producción)');
  } else {
    console.log('⚠️ PostgreSQL local no disponible y no hay DATABASE_URL_NEON configurada');
  }

  await import('./server');
}

main().catch(error => {
  console.error('Error al iniciar el backend:', error);
  process.exit(1);
});