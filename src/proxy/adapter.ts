// Adaptateur pour la communication avec VibeMCP-Lite

import axios, { AxiosInstance } from 'axios';

interface AdapterConfig {
  vibeServerUrl: string;
  timeout?: number;
}

/**
 * Classe qui gère la communication avec le serveur VibeMCP-Lite
 */
export class ProxyAdapter {
  private client: AxiosInstance;
  private currentProject: string | null = null;
  private debug: boolean = true; // Mode debug pour tracer les communications

  constructor(config: AdapterConfig) {
    // Initialiser le client HTTP avec les paramètres de configuration
    this.client = axios.create({
      baseURL: config.vibeServerUrl,
      timeout: config.timeout || 30000
    });
    
    // Log de démarrage
    this.logDebug(`Adaptateur initialisé, URL du serveur: ${config.vibeServerUrl}`);
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
    try {
      this.logDebug('Exécution de commande MCP', { command });
      
      // Appel à l'API MCP
      const response = await this.callApi('post', '/api/mcp/execute', {
        command
      });

      if (response.success) {
        return response.result ? JSON.stringify(response.result) : 'Commande exécutée avec succès';
      } else {
        return `Erreur lors de l'exécution de la commande: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Crée un nouveau projet sur VibeMCP-Lite
   */
  async createProject(name: string, description: string): Promise<string> {
    try {
      this.logDebug('Création de projet', { name, description });
      
      // Appel direct à l'API projects/create
      const response = await this.callApi('post', '/api/projects/create', {
        name,
        description
      });

      if (response.success) {
        this.currentProject = name;
        return `Projet '${name}' créé avec succès`;
      } else {
        return `Erreur lors de la création du projet: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Liste tous les projets disponibles
   */
  async listProjects(): Promise<string> {
    try {
      this.logDebug('Listage des projets');
      
      // Appel direct à l'API projects/list
      const response = await this.callApi('get', '/api/projects/list');

      if (response.projects) {
        const projects = response.projects;
        return `Projets disponibles (${projects.length}):\\\n\\\n${projects.map((p: any) => 
          `- ${p.name}${p.description ? ': ' + p.description : ''}`
        ).join('\\\n')}`;
      } else {
        return `Erreur lors de la récupération des projets: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Change le projet actif
   */
  async switchProject(name: string): Promise<string> {
    try {
      this.logDebug('Changement de projet', { name });
      
      // Pour le changement de projet, nous utilisons l'API MCP
      const response = await this.callApi('post', '/api/mcp/execute', {
        command: `switch-project ${name}`
      });

      if (response.success) {
        this.currentProject = name;
        return `Projet '${name}' sélectionné avec succès`;
      } else {
        return `Erreur lors du changement de projet: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Récupère le contenu d'un fichier projet
   */
  async getProjectFile(projectName: string, filePath: string): Promise<string> {
    try {
      this.logDebug('Récupération de fichier', { projectName, filePath });
      
      // Appel direct à l'API files/read
      const response = await this.callApi('get', '/api/files/read', null, {
        project: projectName,
        path: filePath
      });

      if (response.content) {
        return response.content;
      } else {
        return `Erreur: Impossible de lire le fichier ${filePath}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Crée un nouveau fichier dans le projet spécifié
   */
  async createFile(path: string, content: string = ''): Promise<string> {
    if (!this.currentProject) {
      return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
    }
    
    return this.executeCommand(`create-file ${path} ${content}`);
  }

  /**
   * Liste les fichiers dans le répertoire spécifié
   */
  async listFiles(directory: string = ''): Promise<string> {
    if (!this.currentProject) {
      return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
    }
    
    return this.executeCommand(`list-files ${directory}`);
  }

  /**
   * Lit le contenu d'un fichier
   */
  async readFile(path: string): Promise<string> {
    if (!this.currentProject) {
      return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
    }
    
    return this.executeCommand(`read-file ${path}`);
  }

  /**
   * Met à jour le contenu d'un fichier
   */
  async updateFile(path: string, content: string): Promise<string> {
    if (!this.currentProject) {
      return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
    }
    
    return this.executeCommand(`update-file ${path} ${content}`);
  }

  /**
   * Supprime un fichier ou répertoire
   */
  async deleteFile(path: string): Promise<string> {
    if (!this.currentProject) {
      return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
    }
    
    return this.executeCommand(`delete-file ${path}`);
  }

  /**
   * Édite des lignes spécifiques d'un fichier
   */
  async editFile(path: string, lineRange: string, content: string = ''): Promise<string> {
    if (!this.currentProject) {
      return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
    }
    
    return this.executeCommand(`edit ${path} ${lineRange} ${content}`);
  }

  /**
   * Affiche l'aide des commandes disponibles
   */
  async help(): Promise<string> {
    return this.executeCommand('help');
  }
}
