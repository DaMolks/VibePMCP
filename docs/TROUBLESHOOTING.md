# Guide de dépannage VibePMCP

Ce document fournit des conseils pour résoudre les problèmes courants lors de l'utilisation de VibePMCP, notamment les problèmes liés à l'exposition des outils MCP.

## Problèmes avec les outils MCP

### Outil non trouvé

Si vous recevez une erreur indiquant qu'un outil n'est pas trouvé (`Tool 'xxx' not found`), cela peut être dû à plusieurs raisons :

1. **L'outil n'est pas correctement enregistré** - Vérifiez que l'outil est bien déclaré dans `src/mcp/server.ts` dans la méthode `registerTools()`.

2. **Paramètres incorrects** - Assurez-vous d'utiliser les bons noms de paramètres pour chaque outil. Par exemple, pour `list-files`, utilisez `directory` et non `path` :

   ```
   // Correct
   list-files directory=src
   
   // Incorrect
   list-files path=src
   ```

3. **Problème de transport MCP** - Le protocole MCP peut ne pas exposer correctement tous les outils enregistrés. Vérifiez les logs dans le dossier `logs` pour voir si les outils sont bien enregistrés.

### Vérification des outils disponibles

Avec les modifications apportées dans cette branche, VibePMCP affiche maintenant la liste de tous les outils enregistrés au démarrage. Vous pouvez consulter ces informations dans les fichiers de log générés dans le dossier `logs/`.

Exemple de sortie de log :
```
2025-05-11T11:10:00.000Z [INFO] Outils enregistrés: create-project, list-projects, switch-project, create-file, list-files, read-file, update-file, delete-file, edit, help
2025-05-11T11:10:00.000Z [INFO] Tous les outils attendus sont correctement enregistrés.
2025-05-11T11:10:00.000Z [INFO] Outil create-project - Paramètres: name, description
2025-05-11T11:10:00.000Z [INFO] Outil list-projects - Paramètres: (aucun paramètre)
...
```

## Paramètres des outils MCP

Voici la liste complète des outils et leurs paramètres :

| Outil | Paramètres |
|-------|------------|
| `create-project` | `name` (obligatoire), `description` (optionnel) |
| `list-projects` | *(aucun)* |
| `switch-project` | `name` (obligatoire) |
| `create-file` | `path` (obligatoire), `content` (optionnel) |
| `list-files` | `directory` (optionnel) |
| `read-file` | `path` (obligatoire) |
| `update-file` | `path` (obligatoire), `content` (obligatoire) |
| `delete-file` | `path` (obligatoire) |
| `edit` | `path` (obligatoire), `lineRange` (obligatoire), `content` (optionnel) |
| `help` | *(aucun)* |

## Résolution des problèmes de connexion

Si VibePMCP ne se connecte pas correctement à VibeServer :

1. Vérifiez que VibeServer est en cours d'exécution
2. Confirmez que l'URL dans le fichier `.env` est correcte
3. Vérifiez les logs de VibeServer et VibePMCP pour identifier d'éventuelles erreurs

## Journalisation améliorée

Dans cette version, nous avons ajouté une journalisation améliorée pour faciliter le débogage :

- Tous les appels d'outils sont journalisés avec leurs paramètres
- Les résultats des appels sont également journalisés
- La liste des outils enregistrés est vérifiée au démarrage

Pour consulter les logs, regardez dans le dossier `logs/` à la racine du projet VibePMCP.

## Rapport de problèmes

Si vous rencontrez des problèmes persistants, veuillez :

1. Collecter les fichiers de log dans le dossier `logs/`
2. Expliquer en détail les étapes pour reproduire le problème
3. Ouvrir une issue sur GitHub avec ces informations

---

Ces informations devraient vous aider à résoudre les problèmes les plus courants avec VibePMCP.