# Obsidian MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Obsidian vault integration. This server enables AI assistants to securely read, search, and interact with your Obsidian vault through standardized protocols.

## Features

- **Secure File Access**: Read-only access with strict path validation and vault boundary enforcement
- **File Operations**: Read files, list directories, get file metadata
- **Content Search**: Search for text within your notes with pattern matching
- **MCP Resources**: Expose vault notes as MCP resources for easy discovery
- **MCP Tools**: Provide tools for vault interaction (read, search, list)
- **Type Safety**: Full TypeScript implementation with strict typing

## Security

This server implements several security measures:

- **Path Validation**: All file paths are validated using `path.resolve()` and `startsWith()` checks to prevent directory traversal attacks
- **Vault Boundaries**: Access is restricted to files within the specified vault directory
- **Read-Only Access**: No write operations are supported by default
- **Input Sanitization**: All user inputs are sanitized to remove dangerous characters
- **Error Handling**: Comprehensive error handling prevents information leakage

## Installation

```bash
npm install obsidian-mcp-server
```

## Usage

### Command Line

```bash
# Using absolute path
obsidian-mcp-server /path/to/your/obsidian/vault

# Using environment variable
export OBSIDIAN_VAULT_PATH="/path/to/your/obsidian/vault"
obsidian-mcp-server

# Show help
obsidian-mcp-server --help
```

### As a Library

```typescript
import { ObsidianMCPServer } from 'obsidian-mcp-server';

const server = new ObsidianMCPServer({
  vaultPath: '/path/to/your/obsidian/vault',
  name: 'my-obsidian-server',
  version: '1.0.0',
});

await server.start();
```

### Configuration for MCP Clients

Example configuration for Claude Desktop:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["obsidian-mcp-server", "/path/to/your/vault"]
    }
  }
}
```

## MCP Resources

The server exposes Obsidian notes as MCP resources with URIs in the format:
- `obsidian:///path/to/note.md`

## MCP Tools

### `read_file`
Read the contents of a specific file in the vault.

### `list_files`
List files and directories in the vault.

### `search_files`
Search for text content within files.

### `get_file_info`
Get metadata about a file or directory.

## License

MIT License - see [LICENSE](LICENSE) file for details.
