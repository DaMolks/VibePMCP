/**
 * command-discovery.ts
 * 
 * Module pour découvrir dynamiquement les commandes disponibles sur le serveur VibeServer
 */

import axios, { AxiosInstance } from 'axios';

interface Command {
  name: string;
  handler: string;
}

interface CommandDiscoveryConfig {
  vibeServerUrl: string;
  timeout?: number;
  debug?: boolean;
}

/**
 * Classe responsable de la découverte et du chargement des commandes disponibles
 * sur le serveur VibeServer
 */
export class CommandDiscovery {
  private client: AxiosInstance;
  private debug: boolean;
  private commands: Command[] = [];
  private isInitialized: boolean = false;

  constructor(config: CommandDiscoveryConfig) {
    this.client = axios.create({
      baseURL: config.vibeServerUrl,
      timeout: config.timeout || 30000
    });
    this.debug = config.debug || false;
  }

  /**
   * Fonction de log pour le débogage
   */
  private logDebug(message: string, data?: any) {
    if (this.debug) {
      // Utiliser un fichier de log au lieu de console.log pour éviter d'interférer avec stdio
      const logMessage = `${new Date().toISOString()} [CommandDiscovery] ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
      
      // Dans un environnement de production, remplacer par une écriture dans un fichier
      // Ici, nous utilisons un log vers stderr qui ne perturbe pas le protocole MCP sur stdout
      process.stderr.write(logMessage + '\n');
    }
  }

  /**
   * Initialisation du module : découverte des commandes disponibles
   */
  async initialize(): Promise<void> {
    try {
      this.logDebug('Initialisation de la découverte des commandes');
      
      // Récupérer la liste des commandes depuis le serveur
      const response = await this.client.get('/api/mcp/commands');
      this.commands = response.data.commands || [];
      
      this.logDebug(`${this.commands.length} commandes découvertes`, this.commands);
      this.isInitialized = true;
    } catch (error: any) {
      this.logDebug('Erreur lors de la découverte des commandes', error.message);
      throw error;
    }
  }

  /**
   * Vérifie si une commande existe sur le serveur
   */
  hasCommand(commandName: string): boolean {
    if (!this.isInitialized) {
      throw new Error('CommandDiscovery not initialized. Call initialize() first.');
    }
    
    return this.commands.some(cmd => cmd.name === commandName);
  }

  /**
   * Récupère toutes les commandes disponibles
   */
  getAllCommands(): Command[] {
    if (!this.isInitialized) {
      throw new Error('CommandDiscovery not initialized. Call initialize() first.');
    }
    
    return [...this.commands];
  }

  /**
   * Obtient le schéma complet d'une commande
   */
  async getCommandSchema(commandName: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('CommandDiscovery not initialized. Call initialize() first.');
    }
    
    if (!this.hasCommand(commandName)) {
      throw new Error(`Command '${commandName}' not found on server.`);
    }
    
    try {
      this.logDebug(`Récupération du schéma de la commande '${commandName}'`);
      
      // Récupérer le schéma complet depuis le serveur
      const response = await this.client.get(`/api/mcp-api/commands/${commandName}/schema`);
      
      if (response.data.success) {
        return response.data.schema;
      } else {
        throw new Error(response.data.error || 'Error retrieving command schema');
      }
    } catch (error: any) {
      this.logDebug(`Erreur lors de la récupération du schéma de la commande '${commandName}'`, error.message);
      throw error;
    }
  }

  /**
   * Obtient les exemples d'utilisation d'une commande
   */
  async getCommandExamples(commandName: string): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('CommandDiscovery not initialized. Call initialize() first.');
    }
    
    if (!this.hasCommand(commandName)) {
      throw new Error(`Command '${commandName}' not found on server.`);
    }
    
    try {
      this.logDebug(`Récupération des exemples de la commande '${commandName}'`);
      
      // Récupérer les exemples depuis le serveur
      const response = await this.client.get(`/api/mcp-api/commands/${commandName}/examples`);
      
      if (response.data.success) {
        return response.data.examples || [];
      } else {
        throw new Error(response.data.error || 'Error retrieving command examples');
      }
    } catch (error: any) {
      this.logDebug(`Erreur lors de la récupération des exemples de la commande '${commandName}'`, error.message);
      throw error;
    }
  }

  /**
   * Actualise la liste des commandes disponibles
   */
  async refresh(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Obtient des suggestions pour l'autocomplétion
   */
  async getCompletionSuggestions(prefix: string): Promise<any> {
    try {
      this.logDebug(`Récupération des suggestions pour le préfixe '${prefix}'`);
      
      // Récupérer les suggestions depuis le serveur
      const response = await this.client.post('/api/mcp-api/complete', { prefix });
      
      if (response.data.success) {
        return response.data.suggestions || [];
      } else {
        throw new Error(response.data.error || 'Error retrieving completion suggestions');
      }
    } catch (error: any) {
      this.logDebug(`Erreur lors de la récupération des suggestions`, error.message);
      throw error;
    }
  }
}
