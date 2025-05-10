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

  constructor(config: AdapterConfig) {
    this.client = axios.create({
      baseURL: config.vibeServerUrl,
      timeout: config.timeout || 30000
    });
  }

  /**
   * Crée un nouveau projet sur VibeMCP-Lite
   */
  async createProject(name: string, description: string): Promise<string> {
    try {
      const response = await this.client.post('/api/mcp/execute', {
        command: `create-project ${name} ${description}`
      });

      if (response.data.success) {
        this.currentProject = name;
        return `Projet '${name}' créé avec succès`;
      } else {
        return `Erreur lors de la création du projet: ${response.data.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeMCP-Lite: ${error.message}`;
    }
  }

  /**
   * Liste tous les projets disponibles
   */
  async listProjects(): Promise<string> {
    try {
      const response = await this.client.post('/api/mcp/execute', {
        command: 'list-projects'
      });

      if (response.data.success && response.data.result.projects) {
        const projects = response.data.result.projects;
        return `Projets disponibles (${projects.length}):\n\n${projects.map((p: any) => 
          `- ${p.name}${p.isActive ? ' (actif)' : ''}: ${p.description || 'Pas de description'}`
        ).join('\n')}`;
      } else {
        return `Erreur lors de la récupération des projets: ${response.data.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeMCP-Lite: ${error.message}`;
    }
  }

  /**
   * Change le projet actif
   */
  async switchProject(name: string): Promise<string> {
    try {
      const response = await this.client.post('/api/mcp/execute', {
        command: `switch-project ${name}`
      });

      if (response.data.success) {
        this.currentProject = name;
        return `Projet '${name}' sélectionné avec succès`;
      } else {
        return `Erreur lors du changement de projet: ${response.data.error || 'Erreur inconnue'}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeMCP-Lite: ${error.message}`;
    }
  }

  /**
   * Récupère le contenu d'un fichier projet
   */
  async getProjectFile(projectName: string, filePath: string): Promise<string> {
    try {
      const response = await this.client.get('/api/files/read', {
        params: {
          project: projectName,
          path: filePath
        }
      });

      if (response.data.content) {
        return response.data.content;
      } else {
        return `Erreur: Impossible de lire le fichier ${filePath}`;
      }
    } catch (error: any) {
      return `Erreur de communication avec VibeMCP-Lite: ${error.message}`;
    }
  }
}
