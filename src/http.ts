#!/usr/bin/env node

// Point d'entrée pour le transport HTTP Streamable

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { main } from './index';
import { config } from './config';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

async function startHttpServer() {
  try {
    const app = express();
    app.use(express.json());
    app.use(cors());
    
    // Map pour stocker les transports par ID de session
    const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
    
    // Route principale MCP
    app.post('/mcp', async (req, res) => {
      try {
        // Vérifier l'ID de session existant
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;
        
        if (sessionId && transports[sessionId]) {
          // Réutiliser le transport existant
          transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // Nouvelle requête d'initialisation
          const server = await main();
          
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              // Stocker le transport par ID de session
              transports[sessionId] = transport;
              console.log(`Nouvelle session initialisée: ${sessionId}`);
            }
          });
          
          // Nettoyage du transport à la fermeture
          transport.onclose = () => {
            if (transport.sessionId) {
              console.log(`Session terminée: ${transport.sessionId}`);
              delete transports[transport.sessionId];
            }
          };
          
          // Connexion au serveur MCP
          await server.connect(transport);
        } else {
          // Requête invalide
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }
        
        // Traiter la requête
        await transport.handleRequest(req, res, req.body);
      } catch (error: any) {
        console.error('Erreur lors du traitement de la requête MCP:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: `Internal server error: ${error.message}`,
            },
            id: null,
          });
        }
      }
    });
    
    // Handler réutilisable pour les requêtes GET et DELETE
    const handleSessionRequest = async (req: express.Request, res: express.Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }
      
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    };
    
    // Gérer les requêtes GET pour les notifications serveur-client via SSE
    app.get('/mcp', handleSessionRequest);
    
    // Gérer les requêtes DELETE pour la terminaison de session
    app.delete('/mcp', handleSessionRequest);
    
    // Route de statut
    app.get('/status', (req, res) => {
      res.json({
        status: 'ok',
        name: config.name,
        version: config.version,
        activeSessions: Object.keys(transports).length
      });
    });
    
    // Démarrer le serveur
    app.listen(config.port, config.host, () => {
      console.log(`Serveur HTTP VibePMCP démarré sur http://${config.host}:${config.port}`);
      console.log(`Point d'entrée MCP disponible à http://${config.host}:${config.port}/mcp`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur HTTP:', error);
    process.exit(1);
  }
}

// Démarrer le serveur si exécuté directement
if (require.main === module) {
  startHttpServer();
}
