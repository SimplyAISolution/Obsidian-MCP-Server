import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FileOperations, FileInfo, SearchResult } from './utils/fileOperations';

/**
 * Configuration for the Obsidian MCP Server
 */
export interface ObsidianServerConfig {
  vaultPath: string;
  name?: string;
  version?: string;
}

/**
 * MCP Server for Obsidian vault integration
 * Provides secure, read-only access to Obsidian vault files
 */
export class ObsidianMCPServer {
  private readonly server: Server;
  private readonly fileOps: FileOperations;
  private readonly config: Required<ObsidianServerConfig>;

  /**
   * Creates a new Obsidian MCP Server instance
   * @param config - Server configuration
   */
  constructor(config: ObsidianServerConfig) {
    this.config = {
      name: 'obsidian-mcp-server',
      version: '1.0.0',
      ...config,
    };

    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.fileOps = new FileOperations(this.config.vaultPath);
    this.setupHandlers();
  }

  /**
   * Sets up MCP request handlers
   */
  private setupHandlers(): void {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const files = await this.fileOps.listDirectory('', true);
        const resources = files
          .filter(file => !file.isDirectory && file.extension === '.md')
          .map(file => ({
            uri: `obsidian:///${file.path}`,
            name: file.name,
            description: `Obsidian note: ${file.path}`,
            mimeType: 'text/markdown',
          }));

        return { resources };
      } catch (error) {
        throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (!uri.startsWith('obsidian:///')) {
        throw new Error(`Unsupported URI scheme: ${uri}`);
      }

      try {
        const relativePath = uri.replace('obsidian:///', '');
        const content = await this.fileOps.readFile(relativePath);

        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: content,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read resource '${uri}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: 'Read the contents of a file in the Obsidian vault',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The relative path to the file within the vault',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'list_files',
            description: 'List files and directories in the Obsidian vault',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The relative path to list (defaults to vault root)',
                  default: '',
                },
                recursive: {
                  type: 'boolean',
                  description: 'Whether to list files recursively',
                  default: false,
                },
              },
            },
          },
          {
            name: 'search_files',
            description: 'Search for text content within files in the Obsidian vault',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The text to search for',
                },
                filePattern: {
                  type: 'string',
                  description: 'File pattern to filter (e.g., "*.md")',
                  default: '*.md',
                },
                caseSensitive: {
                  type: 'boolean',
                  description: 'Whether the search should be case sensitive',
                  default: false,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_file_info',
            description: 'Get metadata information about a file or directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The relative path to the file or directory',
                },
              },
              required: ['path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.handleReadFile(args);
          case 'list_files':
            return await this.handleListFiles(args);
          case 'search_files':
            return await this.handleSearchFiles(args);
          case 'get_file_info':
            return await this.handleGetFileInfo(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handles the read_file tool
   */
  private async handleReadFile(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { path: filePath } = args as { path: string };
    const content = await this.fileOps.readFile(filePath);
    
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  /**
   * Handles the list_files tool
   */
  private async handleListFiles(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { path: dirPath = '', recursive = false } = args as { path?: string; recursive?: boolean };
    const files = await this.fileOps.listDirectory(dirPath, recursive);
    
    const fileList = files.map((file: FileInfo) => {
      const type = file.isDirectory ? 'DIR' : 'FILE';
      const size = file.isDirectory ? '' : ` (${file.size} bytes)`;
      return `${type}: ${file.path}${size}`;
    }).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Files in '${dirPath || 'vault root'}':\n${fileList}`,
        },
      ],
    };
  }

  /**
   * Handles the search_files tool
   */
  private async handleSearchFiles(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { 
      query, 
      filePattern = '*.md', 
      caseSensitive = false 
    } = args as { query: string; filePattern?: string; caseSensitive?: boolean };
    
    const results = await this.fileOps.searchFiles(query, filePattern, caseSensitive);
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No results found for "${query}"`,
          },
        ],
      };
    }

    const resultText = results.map((result: SearchResult) => 
      `${result.file}:${result.line}: ${result.content}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Search results for "${query}":\n${resultText}`,
        },
      ],
    };
  }

  /**
   * Handles the get_file_info tool
   */
  private async handleGetFileInfo(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { path: filePath } = args as { path: string };
    const info = await this.fileOps.getFileInfo(filePath);
    
    const infoText = [
      `Name: ${info.name}`,
      `Path: ${info.path}`,
      `Type: ${info.isDirectory ? 'Directory' : 'File'}`,
      `Size: ${info.size} bytes`,
      `Modified: ${info.modified.toISOString()}`,
      info.extension ? `Extension: ${info.extension}` : null,
    ].filter(Boolean).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: infoText,
        },
      ],
    };
  }

  /**
   * Starts the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    await transport.start();
  }

  /**
   * Gets the server instance
   */
  getServer(): Server {
    return this.server;
  }
}