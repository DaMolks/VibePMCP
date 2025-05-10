// Point d'entrée principal pour VibePMCP

import { Server } from './mcp/server';
import { ProxyAdapter } from './proxy/adapter';
import { config } from './config';

async function main() {
  // Les logs sont maintenant gérés par le fichier de transport (stdio.ts ou http.ts)
  // Éviter tout console.log ici car il pourrait aller vers stdout
  
  const adapter = new ProxyAdapter({
    vibeServerUrl: config.vibeServerUrl,
    timeout: config.timeout
  });

  const server = new Server({
    name: 'VibePMCP',
    version: config.version,
    adapter
  });

  return server;
}

export { main };
