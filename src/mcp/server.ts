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

  constructor(config: ServerConfig) {
    this.adapter = config.adapter;
    this.mcpServer = new McpServer({
      name: config.name,
      version: config.version
    });

    this.registerTools();
    this.registerResources();
  }

  private registerTools() {
    // Enregistrement des outils VibeMCP-Lite en tant qu'outils MCP
    
    // Outil: create-project
    this.mcpServer.tool(
      'create-project',
      {
        name: z.string(),
        description: z.string().optional()
      },
      async ({ name, description }) => {
        const result = await this.adapter.createProject(name, description || '');
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: list-projects
    this.mcpServer.tool(
      'list-projects',
      {},
      async () => {
        const result = await this.adapter.listProjects();
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: switch-project
    this.mcpServer.tool(
      'switch-project',
      { name: z.string() },
      async ({ name }) => {
        const result = await this.adapter.switchProject(name);
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
      async (uri, { projectName, filePath }) => {
        const content = await this.adapter.getProjectFile(projectName, filePath || '');
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
    return this.mcpServer.connect(transport);
  }

  /**
   * Ferme proprement le serveur MCP
   */
  async close() {
    return this.mcpServer.close();
  }
}
