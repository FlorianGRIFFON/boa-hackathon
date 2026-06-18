// Copy this file to apps/<app-name>/metro.config.js when scaffolding a new app.
// It extends the default Expo config to watch the workspace root so Metro
// can resolve @boa/* packages directly from their TypeScript source.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Let Metro watch all packages in the monorepo
config.watchFolders = [workspaceRoot]

// Resolve @boa/* to their source without a build step
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
