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

    // Outil: create-file
    this.mcpServer.tool(
      'create-file',
      { 
        path: z.string(),
        content: z.string().optional()
      },
      async ({ path, content }) => {
        const result = await this.adapter.createFile(path, content || '');
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: list-files
    this.mcpServer.tool(
      'list-files',
      { 
        directory: z.string().optional()
      },
      async ({ directory }) => {
        const result = await this.adapter.listFiles(directory || '');
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: read-file
    this.mcpServer.tool(
      'read-file',
      { path: z.string() },
      async ({ path }) => {
        const result = await this.adapter.readFile(path);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: update-file
    this.mcpServer.tool(
      'update-file',
      { 
        path: z.string(),
        content: z.string()
      },
      async ({ path, content }) => {
        const result = await this.adapter.updateFile(path, content);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: delete-file
    this.mcpServer.tool(
      'delete-file',
      { path: z.string() },
      async ({ path }) => {
        const result = await this.adapter.deleteFile(path);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: edit
    this.mcpServer.tool(
      'edit',
      { 
        path: z.string(),
        lineRange: z.string(),
        content: z.string().optional()
      },
      async ({ path, lineRange, content }) => {
        const result = await this.adapter.editFile(path, lineRange, content || '');
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Outil: help
    this.mcpServer.tool(
      'help',
      {},
      async () => {
        const result = await this.adapter.help();
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
    return this.mcpServer.connect(transport);
  }

  /**
   * Ferme proprement le serveur MCP
   */
  async close() {
    return this.mcpServer.close();
  }
}