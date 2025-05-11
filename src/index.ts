// Point d'entrée principal pour VibePMCP

import { Server } from './mcp/server';
import { ProxyAdapter } from './proxy/adapter';
import { config } from './config';

async function main() {
  // Les logs sont maintenant gérés par le fichier de transport (stdio.ts ou http.ts)
  // Éviter tout console.log ici car il pourrait aller vers stdout
  
  try {
    // Créer l'adaptateur qui communiquera avec VibeServer
    const adapter = new ProxyAdapter({
      vibeServerUrl: config.vibeServerUrl,
      timeout: config.timeout,
      debug: config.debug
    });
    
    // Créer le serveur MCP
    const server = new Server({
      name: 'VibePMCP',
      version: config.version,
      adapter
    });
    
    // Initialiser le serveur et l'adaptateur
    await server.initialize();
    
    return server;
  } catch (error) {
    // En cas d'erreur, log vers stderr (ne perturbe pas le protocole MCP sur stdout)
    process.stderr.write(`Error initializing VibePMCP: ${error}\n`);
    throw error;
  }
}

export { main };
