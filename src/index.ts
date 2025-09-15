#!/usr/bin/env node
/**
 * Obsidian MCP Server - Main Entry Point
 * Provides Model Context Protocol access to Obsidian vaults
 */

import { startServer } from './server.js';
import { loadConfig } from './config.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  try {
    const config = loadConfig();
    logger.setLevel(config.logLevel);
    
    await startServer(config);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down server...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Shutting down server...');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}