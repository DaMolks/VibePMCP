// Point d'entrée principal pour VibePMCP

import { Server } from './mcp/server';
import { ProxyAdapter } from './proxy/adapter';
import { config } from './config';

async function main() {
  console.log('VibePMCP - Proxy MCP pour VibeMCP-Lite');
  console.log(`Version: ${config.version}`);
  console.log(`Connexion au serveur VibeMCP-Lite: ${config.vibeServerUrl}`);

  const adapter = new ProxyAdapter({
    vibeServerUrl: config.vibeServerUrl,
    timeout: config.timeout
  });

  const server = new Server({
    name: 'VibePMCP',
    version: config.version,
    adapter
  });

  // Le transport exact sera déterminé dans les fichiers d'entrée spécifiques (stdio.ts ou http.ts)
  console.log('Serveur MCP prêt. En attente de connexions...');

  return server;
}

export { main };
