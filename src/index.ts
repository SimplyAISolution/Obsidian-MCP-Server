#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import { ObsidianMCPServer } from './obsidianServer.js';

/**
 * Command line interface for the Obsidian MCP Server
 */
class CLI {
  /**
   * Prints usage information
   */
  private static printUsage(): void {
    console.log(`
Usage: obsidian-mcp-server [vault-path]

Arguments:
  vault-path    Absolute path to your Obsidian vault directory
                If not provided, will look for OBSIDIAN_VAULT_PATH environment variable

Options:
  -h, --help    Show this help message
  -v, --version Show version information

Environment Variables:
  OBSIDIAN_VAULT_PATH    Default path to Obsidian vault

Examples:
  obsidian-mcp-server /path/to/my/vault
  OBSIDIAN_VAULT_PATH=/path/to/vault obsidian-mcp-server
    `);
  }

  /**
   * Prints version information
   */
  private static printVersion(): void {
    // Read version from package.json
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as { version: string };
      console.log(`obsidian-mcp-server v${packageJson.version}`);
    } catch {
      console.log('obsidian-mcp-server (version unknown)');
    }
  }

  /**
   * Validates that a path exists and is a directory
   */
  private static async validateVaultPath(vaultPath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(vaultPath);
      const stats = await fs.promises.stat(resolvedPath);
      
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${resolvedPath}`);
      }
      
      // Check if it looks like an Obsidian vault (has .obsidian directory or .md files)
      const entries = await fs.promises.readdir(resolvedPath);
      const hasObsidianDir = entries.includes('.obsidian');
      const hasMarkdownFiles = entries.some(entry => entry.endsWith('.md'));
      
      if (!hasObsidianDir && !hasMarkdownFiles) {
        console.warn(`Warning: Directory doesn't appear to be an Obsidian vault (no .obsidian directory or .md files found): ${resolvedPath}`);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Vault path does not exist: ${vaultPath}`);
      }
      throw error;
    }
  }

  /**
   * Main CLI entry point
   */
  static async main(): Promise<void> {
    const args = process.argv.slice(2);

    // Handle help and version flags
    if (args.includes('-h') || args.includes('--help')) {
      this.printUsage();
      return;
    }

    if (args.includes('-v') || args.includes('--version')) {
      this.printVersion();
      return;
    }

    // Get vault path from arguments or environment
    let vaultPath = args[0] || process.env.OBSIDIAN_VAULT_PATH;

    if (!vaultPath) {
      console.error('Error: No vault path provided');
      this.printUsage();
      process.exit(1);
    }

    try {
      // Validate vault path
      await this.validateVaultPath(vaultPath);
      vaultPath = path.resolve(vaultPath);

      console.error(`Starting Obsidian MCP Server for vault: ${vaultPath}`);
      
      // Create and start the server
      const server = new ObsidianMCPServer({
        vaultPath,
        name: 'obsidian-mcp-server',
        version: '1.0.0',
      });

      await server.start();
      console.error('Obsidian MCP Server started successfully');

    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the CLI
if (require.main === module) {
  CLI.main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { CLI };