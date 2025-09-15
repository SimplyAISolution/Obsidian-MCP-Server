/**
 * MCP Server Implementation for Obsidian
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import type { ServerConfig } from './types/config.js';
import { VaultHandler } from './handlers/vault.js';
import { logger } from './utils/logger.js';

export function createServer(config: ServerConfig): Server {
  const server = new Server(
    { name: 'obsidian-mcp-server', version: '1.0.0' },
    { capabilities: { resources: {} } }
  );

  const vaultHandler = new VaultHandler(config.vaultPath);

  // Resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'obsidian://vault',
        name: 'Obsidian Vault',
        description: 'Access to Obsidian vault contents',
        mimeType: 'application/json'
      }
    ]
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params?.uri;
    
    if (!uri || !uri.startsWith('obsidian://')) {
      throw new Error('Invalid URI scheme');
    }

    try {
      const result = await vaultHandler.readResource(uri);
      return { 
        contents: [{
          uri: result.uri,
          mimeType: 'text/plain',
          text: result.content
        }]
      };
    } catch (error) {
      logger.error('Resource read error:', error);
      throw new Error('Failed to read resource');
    }
  });

  return server;
}

export async function startServer(config: ServerConfig): Promise<void> {
  const server = createServer(config);
  const transport = new StdioServerTransport();
  
  logger.info('Starting Obsidian MCP Server...');
  await server.connect(transport);
  
  logger.info('Obsidian MCP Server started successfully');
}