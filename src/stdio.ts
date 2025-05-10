#!/usr/bin/env node

// Point d'entrée pour le transport stdio (utilisé avec Claude Desktop)

import { main } from './index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as fs from 'fs';
import * as path from 'path';

// Rediriger les logs vers un fichier au lieu de stdout
function setupLogging() {
  // Créer le dossier logs s'il n'existe pas
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Créer un fichier de log daté
  const logFile = path.join(logsDir, `vibepmcp-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  // Rediriger console.log
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  console.log = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logStream.write(`${new Date().toISOString()} [INFO] ${message}\n`);
  };
  
  console.error = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logStream.write(`${new Date().toISOString()} [ERROR] ${message}\n`);
  };

  // Retourner des fonctions pour restaurer les comportements originaux si nécessaire
  return { 
    restore: () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    },
    stream: logStream
  };
}

async function startStdioServer() {
  // Configurer la journalisation avant tout
  const logging = setupLogging();
  
  try {
    console.log('Démarrage du serveur VibePMCP en mode stdio...');
    
    const server = await main();
    const transport = new StdioServerTransport();
    
    // Gestion de la fermeture propre
    process.on('SIGINT', async () => {
      console.log('Fermeture du serveur...');
      await server.close();
      logging.stream.end();
      process.exit(0);
    });
    
    // Connexion au transport
    console.log('Connexion au transport stdio...');
    await server.connect(transport);
    console.log('Serveur connecté et prêt à recevoir des commandes');
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur stdio:', error);
    logging.stream.end();
    process.exit(1);
  }
}

// Démarrer le serveur si exécuté directement
if (require.main === module) {
  startStdioServer();
}
