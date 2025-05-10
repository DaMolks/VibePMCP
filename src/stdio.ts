#!/usr/bin/env node

// Point d'entrée pour le transport stdio (utilisé avec Claude Desktop)

import { main } from './index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function startStdioServer() {
  try {
    const server = await main();
    const transport = new StdioServerTransport();
    
    console.log('Démarrage du serveur VibePMCP en mode stdio...');
    
    // Gestion de la fermeture propre
    process.on('SIGINT', async () => {
      console.log('\nFermeture du serveur...');
      await server.close();
      process.exit(0);
    });
    
    // Connexion au transport
    await server.connect(transport);
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur stdio:', error);
    process.exit(1);
  }
}

// Démarrer le serveur si exécuté directement
if (require.main === module) {
  startStdioServer();
}
