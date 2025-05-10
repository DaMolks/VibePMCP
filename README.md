# VibePMCP

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

VibePMCP est un proxy Model Context Protocol (MCP) qui permet l'intégration de VibeMCP-Lite avec Claude Desktop et d'autres clients MCP.

## 🌟 Caractéristiques principales

- **Compatibilité MCP complète** : Implémente le protocole MCP pour une intégration parfaite avec Claude Desktop
- **Proxy transparent** : Transfère les requêtes entre Claude Desktop et votre serveur VibeMCP-Lite
- **Support stdio et HTTP** : Compatible avec les deux méthodes de transport du protocole MCP
- **Gestion de session** : Maintient les sessions entre Claude Desktop et le serveur VibeMCP-Lite
- **Négociation de capacités** : Expose les ressources, outils et prompts de VibeMCP-Lite au format MCP

## 🚀 Pourquoi VibePMCP ?

Claude Desktop et les autres clients MCP utilisent un protocole standardisé pour communiquer avec des serveurs externes. VibePMCP agit comme une couche d'adaptation qui :

1. Reçoit les requêtes MCP de Claude Desktop
2. Les convertit au format attendu par VibeMCP-Lite
3. Transmet ces requêtes à votre serveur VibeMCP-Lite sur le réseau local
4. Retourne les réponses dans le format MCP attendu

Cela permet d'utiliser toutes les fonctionnalités de VibeMCP-Lite directement depuis Claude Desktop, sans nécessiter de modifications au serveur existant.

## 💻 Architecture

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│               │      │               │      │               │
│ Claude Desktop│◄────►│   VibePMCP    │◄────►│ VibeMCP-Lite  │
│    (Client)   │ MCP  │    (Proxy)    │ HTTP │   (Serveur)   │
│               │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
```

VibePMCP fait l'interface entre le protocole MCP utilisé par Claude Desktop et l'API HTTP de VibeMCP-Lite.

## 📋 Fonctionnalités prises en charge

VibePMCP traduit les primitives MCP suivantes :

| Primitive MCP | Correspondance VibeMCP-Lite |
|---------------|----------------------------|
| Resources     | Fichiers et contenu de projets |
| Tools         | Commandes MCP (create-project, edit, etc.) |
| Prompts       | Modèles de requêtes pour Claude |

## 🔧 Installation

```bash
# Cloner le dépôt
git clone https://github.com/DaMolks/VibePMCP.git
cd VibePMCP

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifiez .env avec l'URL de votre serveur VibeMCP-Lite
```

## ⚡ Démarrage rapide

### Via stdio (pour Claude Desktop)

```bash
# Démarrer le proxy en mode stdio
npm run start:stdio
```

### Via HTTP (pour clients Web)

```bash
# Démarrer le proxy en mode HTTP sur le port 3456
npm run start:http
```

## 🔌 Configuration avec Claude Desktop

Ajoutez VibePMCP à votre configuration Claude Desktop (`claude_desktop_config.json`) :

```json
{
  "mcpServers": {
    "vibemcp": {
      "command": "node",
      "args": [
        "/chemin/vers/VibePMCP/dist/stdio.js"
      ],
      "cwd": "/chemin/vers/VibePMCP"
    }
  }
}
```

Après redémarrage de Claude Desktop, vous pourrez utiliser les commandes VibeMCP directement :

```
```mcp create-project mon-projet "Description du projet"```
```

## 🏗️ Structure du projet

```
VibePMCP/
├── src/                  # Code source
│   ├── mcp/              # Implémentation du protocole MCP
│   │   ├── client.ts     # Client MCP
│   │   ├── server.ts     # Server MCP
│   │   └── types.ts      # Types partagés
│   ├── proxy/            # Logique du proxy
│   │   ├── adapter.ts    # Adaptateurs pour VibeMCP-Lite
│   │   └── converter.ts  # Convertisseurs de format
│   ├── transport/        # Transports MCP
│   │   ├── stdio.ts      # Transport stdio
│   │   └── http.ts       # Transport HTTP Streamable
│   └── index.ts          # Point d'entrée principal
├── dist/                 # Code compilé
├── tests/                # Tests unitaires et d'intégration
└── scripts/              # Scripts utilitaires
```

## 🛠️ Développement

```bash
# Compiler le code
npm run build

# Exécuter les tests
npm test

# Vérifier le style de code
npm run lint
```

## 📚 Documentation technique

- [Documentation complète](./docs/DOCUMENTATION.md)
- [Protocole MCP](./docs/MCP_PROTOCOL.md)
- [API VibeMCP-Lite](./docs/VIBEMCP_API.md)
- [Guide d'utilisation avec Claude](./docs/CLAUDE_USAGE.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les directives.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

Développé avec ❤️ pour faciliter l'intégration entre VibeMCP-Lite et Claude Desktop.
