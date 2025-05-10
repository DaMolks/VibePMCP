// Configuration centralisée pour VibePMCP

import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env
dotenv.config();

export const config = {
  // Informations sur le serveur
  name: 'VibePMCP',
  version: '0.1.0',
  
  // URL du serveur VibeMCP-Lite
  vibeServerUrl: process.env.VIBE_SERVER_URL || 'http://localhost:3000',
  
  // Configuration du serveur HTTP
  port: parseInt(process.env.PORT || '3456', 10),
  host: process.env.HOST || 'localhost',
  
  // Timeout pour les requêtes au serveur VibeMCP-Lite (ms)
  timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
  
  // Chemins importants
  paths: {
    root: path.resolve(__dirname, '..')
  },
  
  // Logs
  logLevel: process.env.LOG_LEVEL || 'info'
};
