// Implémentation du serveur MCP

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProxyAdapter } from '../proxy/adapter';

interface ServerConfig {
  name: string;
  version: string;
  adapter: ProxyAdapter;
}

export class Server {
  private mcpServer: McpServer;
  private adapter: ProxyAdapter;
  private initialized: boolean = false;

  constructor(config: ServerConfig) {
    this.adapter = config.adapter;
    this.mcpServer = new McpServer({
      name: config.name,
      version: config.version
    });
  }

  /**
   * Initialise le serveur et l'adaptateur
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialiser l'adaptateur pour découvrir les commandes disponibles
      await this.adapter.initialize();
      
      // Enregistrer les outils et ressources
      await this.registerTools();
      this.registerResources();
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing server:', error);
      throw error;
    }
  }

  private async registerTools() {
    // Récupérer la liste des commandes disponibles
    const commands = await this.adapter.getAvailableCommands();
    
    // Enregistrer un outil générique pour chaque commande
    for (const command of commands) {
      this.registerCommand(command);
    }
  }

  /**
   * Enregistre une commande comme outil MCP
   */
  private registerCommand(command: string) {
    // Définir un schéma Zod de base pour la commande
    // Note: Idéalement, on pourrait récupérer le schéma détaillé depuis le serveur
    this.mcpServer.tool(
      command,
      {
        args: z.string().optional()
      },
      async ({ args }) => {
        const result = await this.adapter.executeCommand(`${command} ${args || ''}`);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );
  }

  private registerResources() {
    // Ressource: project-files
    // Permet de lister et accéder aux fichiers d'un projet
    this.mcpServer.resource(
      'project-files',
      new ResourceTemplate('project://{projectName}/{filePath}', { list: undefined }),
      async (uri, params) => {
        // Extraction des paramètres avec typage correct
        const projectName = typeof params.projectName === 'string' 
          ? params.projectName 
          : Array.isArray(params.projectName) 
            ? params.projectName[0] 
            : '';
            
        const filePath = typeof params.filePath === 'string' 
          ? params.filePath 
          : Array.isArray(params.filePath) 
            ? params.filePath.join('/') 
            : '';
        
        const content = await this.adapter.getProjectFile(projectName, filePath);
        
        return {
          contents: [{
            uri: uri.href,
            text: content
          }]
        };
      }
    );
  }

  /**
   * Connecte le serveur MCP au transport spécifié
   */
  async connect(transport: any) {
    // S'assurer que le serveur est initialisé avant de se connecter
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.mcpServer.connect(transport);
  }

  /**
   * Ferme proprement le serveur MCP
   */
  async close() {
    return this.mcpServer.close();
  }
}
