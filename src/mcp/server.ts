// Implémentation du serveur MCP

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProxyAdapter } from '../proxy/adapter';

interface ServerConfig {
  name: string;
  version: string;
  adapter: ProxyAdapter;
}

// Liste des outils qui doivent être disponibles
const EXPECTED_TOOLS = [
  'create-project',
  'list-projects',
  'switch-project',
  'create-file',
  'list-files',
  'read-file',
  'update-file',
  'delete-file',
  'edit',
  'help'
];

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
    
    // Vérifier que tous les outils attendus sont enregistrés
    this.verifyToolsRegistration();
  }

  // Nouvelle méthode pour vérifier que tous les outils sont correctement enregistrés
  private verifyToolsRegistration() {
    const registeredTools = Array.from(this.mcpServer.tools.keys());
    console.log(`Outils enregistrés: ${registeredTools.join(', ')}`);
    
    // Vérifier si des outils attendus sont manquants
    const missingTools = EXPECTED_TOOLS.filter(tool => !registeredTools.includes(tool));
    if (missingTools.length > 0) {
      console.error(`ATTENTION: Les outils suivants ne sont pas enregistrés: ${missingTools.join(', ')}`);
    } else {
      console.log('Tous les outils attendus sont correctement enregistrés.');
    }
    
    // Vérifier les paramètres des outils
    for (const toolName of registeredTools) {
      const tool = this.mcpServer.tools.get(toolName);
      if (tool) {
        console.log(`Outil ${toolName} - Paramètres:`, 
          Object.keys(tool.schema.shape).length > 0 
            ? Object.keys(tool.schema.shape) 
            : '(aucun paramètre)');
      }
    }
  }

  private registerTools() {
    // Enregistrement des outils VibeMCP-Lite en tant qu'outils MCP
    console.log('Enregistrement des outils MCP...');
    
    // Outil: create-project
    this.mcpServer.tool(
      'create-project',
      {
        name: z.string(),
        description: z.string().optional()
      },
      async ({ name, description }) => {
        console.log(`Exécution de create-project avec: name=${name}, description=${description || '(vide)'}`);
        const result = await this.adapter.createProject(name, description || '');
        console.log(`Résultat de create-project:`, result);
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
        console.log('Exécution de list-projects');
        const result = await this.adapter.listProjects();
        console.log('Résultat de list-projects:', result);
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
        console.log(`Exécution de switch-project avec: name=${name}`);
        const result = await this.adapter.switchProject(name);
        console.log('Résultat de switch-project:', result);
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
        console.log(`Exécution de create-file avec: path=${path}, content=${content ? '(contenu présent)' : '(vide)'}`);
        const result = await this.adapter.createFile(path, content || '');
        console.log('Résultat de create-file:', result);
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
        console.log(`Exécution de list-files avec: directory=${directory || '(racine)'}`);
        const result = await this.adapter.listFiles(directory || '');
        console.log('Résultat de list-files:', result);
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
        console.log(`Exécution de read-file avec: path=${path}`);
        const result = await this.adapter.readFile(path);
        console.log('Résultat de read-file:', result.substring(0, 100) + '...');
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
        console.log(`Exécution de update-file avec: path=${path}, content=${content ? '(contenu présent)' : '(vide)'}`);
        const result = await this.adapter.updateFile(path, content);
        console.log('Résultat de update-file:', result);
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
        console.log(`Exécution de delete-file avec: path=${path}`);
        const result = await this.adapter.deleteFile(path);
        console.log('Résultat de delete-file:', result);
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
        console.log(`Exécution de edit avec: path=${path}, lineRange=${lineRange}, content=${content ? '(contenu présent)' : '(vide)'}`);
        const result = await this.adapter.editFile(path, lineRange, content || '');
        console.log('Résultat de edit:', result);
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
        console.log('Exécution de help');
        const result = await this.adapter.help();
        console.log('Résultat de help:', result);
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
        
        console.log(`Accès à la ressource project-files: projectName=${projectName}, filePath=${filePath}`);
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
    console.log('Connexion du serveur MCP au transport...');
    return this.mcpServer.connect(transport);
  }

  /**
   * Ferme proprement le serveur MCP
   */
  async close() {
    console.log('Fermeture du serveur MCP...');
    return this.mcpServer.close();
  }
}