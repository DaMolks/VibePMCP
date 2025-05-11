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
        return `Projets disponibles (${projects.length}):\\\\\\n\\\\\\n${projects.map((p: any) => 
          `- ${p.name}${p.description ? ': ' + p.description : ''}`
        ).join('\\\\\\n')}`;
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
  async createFile(filePath: string, content: string = ''): Promise<string> {
    try {
      this.logDebug('Création de fichier', { filePath, content });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      // Appel direct à l'API files/write au lieu d'utiliser executeCommand
      const response = await this.callApi('post', '/api/files/write', {
        project: this.currentProject,
        path: filePath,
        content: content
      });

      if (response.success) {
        return `Fichier '${filePath}' créé avec succès`;
      } else {
        return `Erreur lors de la création du fichier: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Liste les fichiers dans le répertoire spécifié
   */
  async listFiles(directory: string = ''): Promise<string> {
    try {
      this.logDebug('Listage des fichiers', { directory });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      // Appel direct à l'API files/list au lieu d'utiliser executeCommand
      const response = await this.callApi('get', '/api/files/list', null, {
        project: this.currentProject,
        path: directory
      });

      if (response.files) {
        const files = response.files;
        let result = `Fichiers dans ${directory || '/'} (${files.length}):\\\\\\n\\\\\\n`;
        
        // Formatter les fichiers en liste
        const filesList = files.map((f: any) => 
          `- ${f.type === 'directory' ? '[Dir] ' : ''}${f.name} ${f.size ? `(${f.size} octets)` : ''}`
        ).join('\\\\\\n');
        
        return result + filesList;
      } else {
        return `Erreur lors de la récupération des fichiers: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Lit le contenu d'un fichier
   */
  async readFile(filePath: string): Promise<string> {
    try {
      this.logDebug('Lecture de fichier', { filePath });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      // Appel direct à l'API files/read au lieu d'utiliser executeCommand
      const response = await this.callApi('get', '/api/files/read', null, {
        project: this.currentProject,
        path: filePath
      });

      if (response.content !== undefined) {
        return JSON.stringify({
          path: filePath,
          content: response.content,
          size: response.content.length,
          lines: response.content.split('\n').length
        });
      } else {
        return `Erreur lors de la lecture du fichier: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Met à jour le contenu d'un fichier
   */
  async updateFile(filePath: string, content: string): Promise<string> {
    try {
      this.logDebug('Mise à jour de fichier', { filePath, contentLength: content.length });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      // Appel direct à l'API files/write au lieu d'utiliser executeCommand
      const response = await this.callApi('post', '/api/files/write', {
        project: this.currentProject,
        path: filePath,
        content: content
      });

      if (response.success) {
        return `Fichier '${filePath}' mis à jour avec succès`;
      } else {
        return `Erreur lors de la mise à jour du fichier: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Supprime un fichier ou répertoire
   */
  async deleteFile(filePath: string): Promise<string> {
    try {
      this.logDebug('Suppression de fichier', { filePath });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      // Appel direct à l'API files/delete au lieu d'utiliser executeCommand
      const response = await this.callApi('delete', '/api/files/delete', {
        project: this.currentProject,
        path: filePath
      });

      if (response.success) {
        return `'${filePath}' supprimé avec succès`;
      } else {
        return `Erreur lors de la suppression: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Édite des lignes spécifiques d'un fichier
   */
  async editFile(filePath: string, lineRange: string, content: string = ''): Promise<string> {
    try {
      this.logDebug('Édition de fichier', { filePath, lineRange, content });
      
      if (!this.currentProject) {
        return 'Erreur: Aucun projet actif. Utilisez switch-project d\'abord.';
      }
      
      // Analyser la plage de lignes (format: début-fin)
      const rangeMatch = lineRange.match(/^(\d+)-(\d+)$/);
      if (!rangeMatch) {
        return 'Erreur: Format de plage de lignes invalide. Utilisez: début-fin';
      }

      const startLine = parseInt(rangeMatch[1], 10);
      const endLine = parseInt(rangeMatch[2], 10);
      
      // Appel direct à l'API files/edit-lines au lieu d'utiliser executeCommand
      const response = await this.callApi('patch', '/api/files/edit-lines', {
        project: this.currentProject,
        path: filePath,
        startLine: startLine,
        endLine: endLine,
        content: content
      });

      if (response.success) {
        return `Lignes ${startLine}-${endLine} du fichier '${filePath}' modifiées avec succès`;
      } else {
        return `Erreur lors de l'édition du fichier: ${response.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeServer: ${error.message}`;
    }
  }

  /**
   * Affiche l'aide des commandes disponibles
   */
  async help(): Promise<string> {
    return this.executeCommand('help');
  }
}
