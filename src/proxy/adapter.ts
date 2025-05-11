// Adaptateur pour la communication avec VibeMCP-Lite

import axios, { AxiosInstance } from 'axios';
import { CommandDiscovery } from './command-discovery';

interface AdapterConfig {
  vibeServerUrl: string;
  timeout?: number;
  debug?: boolean;
}

/**
 * Classe qui gère la communication avec le serveur VibeServer
 */
export class ProxyAdapter {
  private client: AxiosInstance;
  private currentProject: string | null = null;
  private debug: boolean = true; // Mode debug pour tracer les communications
  private commandDiscovery: CommandDiscovery;
  private initialized: boolean = false;

  constructor(config: AdapterConfig) {
    // Initialiser le client HTTP avec les paramètres de configuration
    this.client = axios.create({
      baseURL: config.vibeServerUrl,
      timeout: config.timeout || 30000
    });
    
    // Initialiser le module de découverte des commandes
    this.commandDiscovery = new CommandDiscovery({
      vibeServerUrl: config.vibeServerUrl,
      timeout: config.timeout,
      debug: config.debug
    });
    
    this.debug = config.debug || true;
    
    // Log de démarrage
    this.logDebug(`Adaptateur initialisé, URL du serveur: ${config.vibeServerUrl}`);
  }

  /**
   * Initialise l'adaptateur en découvrant les commandes disponibles
   */
  async initialize(): Promise<void> {
    try {
      this.logDebug('Initialisation de l\'adaptateur');
      
      // Initialiser le module de découverte des commandes
      await this.commandDiscovery.initialize();
      
      this.initialized = true;
      this.logDebug('Adaptateur initialisé avec succès');
    } catch (error: any) {
      this.logDebug('Erreur lors de l\'initialisation de l\'adaptateur', error.message);
      throw error;
    }
  }

  /**
   * Vérifie si l'adaptateur a été initialisé
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Adapter not initialized. Call initialize() first.');
    }
  }

  /**
   * Fonction de log pour le débogage
   */
  private logDebug(message: string, data?: any) {
    if (this.debug) {
      // Utiliser un fichier de log au lieu de console.log pour éviter d'interférer avec stdio
      const logMessage = `${new Date().toISOString()} [ProxyAdapter] ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
      
      // Dans un environnement de production, remplacer par une écriture dans un fichier
      // Ici, nous utilisons un log vers stderr qui ne perturbe pas le protocole MCP sur stdout
      process.stderr.write(logMessage + '\n');
    }
  }

  /**
   * Méthode générique pour appeler une API du serveur
   */
  private async callApi(method: string, endpoint: string, data?: any, params?: any): Promise<any> {
    try {
      this.logDebug(`Appel API: ${method.toUpperCase()} ${endpoint}`, { data, params });
      
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
        params
      });
      
      this.logDebug(`Réponse API:`, response.data);
      return response.data;
    } catch (error: any) {
      this.logDebug(`Erreur API: ${method.toUpperCase()} ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * Méthode générique pour exécuter une commande MCP
   */
  async executeCommand(command: string): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Exécution de commande MCP', { command });
      
      // Appel à l'API MCP
      const response = await this.callApi('post', '/api/mcp/execute', {
        command
      });

      if (response.success) {
        // Mettre à jour le projet courant si c'est une commande switch-project
        const parts = command.trim().split(' ');
        if (parts[0] === 'switch-project' && parts.length > 1) {
          this.currentProject = parts[1];
        }
        
        return response.result ? JSON.stringify(response.result) : 'Commande exécutée avec succès';
      } else {
        return `Erreur lors de l'exécution de la commande: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Crée un nouveau projet sur VibeServer
   */
  async createProject(name: string, description: string): Promise<string> {
    this.ensureInitialized();
    return this.executeCommand(`create-project ${name} ${description}`);
  }

  /**
   * Liste tous les projets disponibles
   */
  async listProjects(): Promise<string> {
    this.ensureInitialized();
    return this.executeCommand('list-projects');
  }

  /**
   * Change le projet actif
   */
  async switchProject(name: string): Promise<string> {
    this.ensureInitialized();
    return this.executeCommand(`switch-project ${name}`);
  }

  /**
   * Récupère le contenu d'un fichier projet
   */
  async getProjectFile(projectName: string, filePath: string): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Récupération de fichier', { projectName, filePath });
      
      // D'abord, s'assurer que le projet est actif
      if (this.currentProject !== projectName) {
        await this.switchProject(projectName);
      }
      
      return this.executeCommand(`read-file ${filePath}`);
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Crée un nouveau fichier dans le projet spécifié
   */
  async createFile(filePath: string, content: string = ''): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Création de fichier', { filePath, content });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      return this.executeCommand(`create-file ${filePath} ${content}`);
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Liste les fichiers dans le répertoire spécifié
   */
  async listFiles(directory: string = ''): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Listage des fichiers', { directory });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      return this.executeCommand(`list-files ${directory}`);
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Lit le contenu d'un fichier
   */
  async readFile(filePath: string): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Lecture de fichier', { filePath });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      return this.executeCommand(`read-file ${filePath}`);
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Met à jour le contenu d'un fichier
   */
  async updateFile(filePath: string, content: string): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Mise à jour de fichier', { filePath, contentLength: content.length });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      return this.executeCommand(`update-file ${filePath} ${content}`);
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Supprime un fichier ou répertoire
   */
  async deleteFile(filePath: string): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Suppression de fichier', { filePath });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      return this.executeCommand(`delete-file ${filePath}`);
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Édite des lignes spécifiques d'un fichier
   */
  async editFile(filePath: string, lineRange: string, content: string = ''): Promise<string> {
    this.ensureInitialized();
    try {
      this.logDebug('Édition de fichier', { filePath, lineRange, content });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      return this.executeCommand(`edit ${filePath} ${lineRange} ${content}`);
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Exécute une commande Git sur le serveur
   */
  async executeGit(gitCommand: string, args: string = ''): Promise<string> {
    this.ensureInitialized();
    // Vérifier si la commande Git est supportée par le serveur
    if (!await this.isGitCommandSupported(gitCommand)) {
      return `Erreur: La commande Git '${gitCommand}' n'est pas supportée par le serveur.`;
    }
    
    return this.executeCommand(`${gitCommand} ${args}`);
  }

  /**
   * Vérifie si une commande Git est supportée par le serveur
   */
  private async isGitCommandSupported(gitCommand: string): Promise<boolean> {
    try {
      return this.commandDiscovery.hasCommand(gitCommand);
    } catch (error) {
      this.logDebug(`Erreur lors de la vérification de la commande Git '${gitCommand}'`, error);
      return false;
    }
  }

  /**
   * Affiche l'aide des commandes disponibles
   */
  async help(): Promise<string> {
    this.ensureInitialized();
    return this.executeCommand('help');
  }

  /**
   * Obtient la liste des commandes disponibles
   */
  async getAvailableCommands(): Promise<string[]> {
    this.ensureInitialized();
    const commands = this.commandDiscovery.getAllCommands();
    return commands.map(cmd => cmd.name);
  }
}
