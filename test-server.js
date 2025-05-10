// Script simple pour tester la communication avec VibeServer

const axios = require('axios');

// URL du serveur VibeServer (modifiez selon votre configuration)
const SERVER_URL = 'http://localhost:3000';

// Fonction pour créer un projet directement via l'API
async function createProject(name, description) {
  try {
    console.log(`Tentative de création du projet "${name}" avec description "${description}"...`);
    
    // Appel à l'API projects/create de VibeServer
    const response = await axios.post(`${SERVER_URL}/api/projects/create`, {
      name,
      description
    });
    
    console.log('Réponse du serveur:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    throw error;
  }
}

// Fonction pour lister les projets
async function listProjects() {
  try {
    console.log('Récupération de la liste des projets...');
    
    // Appel à l'API projects/list de VibeServer
    const response = await axios.get(`${SERVER_URL}/api/projects/list`);
    
    console.log('Projets disponibles:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    throw error;
  }
}

// Fonction pour exécuter une commande MCP
async function executeMcpCommand(command) {
  try {
    console.log(`Exécution de la commande MCP: "${command}"...`);
    
    // Appel à l'API mcp/execute de VibeServer
    const response = await axios.post(`${SERVER_URL}/api/mcp/execute`, {
      command
    });
    
    console.log('Réponse du serveur:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la commande MCP:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    throw error;
  }
}

// Test des fonctions
async function runTests() {
  try {
    // Vérifier si le serveur est accessible
    console.log(`Vérification de la connexion au serveur ${SERVER_URL}...`);
    const statusResponse = await axios.get(`${SERVER_URL}/api/status`);
    console.log('Statut du serveur:', statusResponse.data);
    
    // Lister les projets existants
    await listProjects();
    
    // Créer un projet via l'API directe
    await createProject('projet-test-direct', 'Projet créé directement via l\'API');
    
    // Créer un projet via la commande MCP
    await executeMcpCommand('create-project projet-test-mcp Projet créé via commande MCP');
    
    // Vérifier que les projets ont été créés
    await listProjects();
    
    console.log('Tests terminés avec succès');
  } catch (error) {
    console.error('Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
runTests();
