// Configuration pour VibePMCP

// Charger les variables d'environnement depuis .env
import * as dotenv from 'dotenv';
dotenv.config();

// Configuration par défaut
const defaultConfig = {
  vibeServerUrl: 'http://localhost:3000',
  timeout: 30000,
  version: '0.1.0',
  debug: true
};

// Extraire la configuration depuis les variables d'environnement
export const config = {
  vibeServerUrl: process.env.VIBE_SERVER_URL || defaultConfig.vibeServerUrl,
  timeout: process.env.VIBE_TIMEOUT ? parseInt(process.env.VIBE_TIMEOUT) : defaultConfig.timeout,
  version: process.env.VIBE_VERSION || defaultConfig.version,
  debug: process.env.VIBE_DEBUG ? process.env.VIBE_DEBUG === 'true' : defaultConfig.debug
};
