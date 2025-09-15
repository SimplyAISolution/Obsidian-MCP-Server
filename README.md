# Obsidian MCP Server

🔗 **Model Context Protocol (MCP) server for Obsidian integration**

Enables AI assistants to read, search, and interact with your Obsidian vault through secure, standardized protocols.

## Features

- 🔒 **Secure vault access** with path validation
- 📝 **Markdown file reading** with metadata extraction
- 🔍 **Search capabilities** across vault contents
- ⚡ **High performance** with efficient file handling
- 🛡️ **Security-first** design with input validation

## Quick Start

```bash
# Install dependencies
npm install

# Set up your vault path
cp .env.example .env
# Edit .env with your vault path

# Start the server
npm run dev
```

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- An existing Obsidian vault

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SimplyAISolution/Obsidian-MCP-Server.git
   cd Obsidian-MCP-Server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your vault path:
   ```env
   VAULT_PATH=/path/to/your/obsidian/vault
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck
```

## Configuration

The server can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_PATH` | Path to your Obsidian vault | Required |
| `SERVER_PORT` | Server port number | `3000` |
| `LOG_LEVEL` | Logging level (`debug`, `info`, `warn`, `error`) | `info` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `10485760` (10MB) |
| `ALLOWED_EXTENSIONS` | Comma-separated list of allowed file extensions | `.md,.txt,.json` |

## API Reference

### Resources

#### List Resources
```javascript
{
  "method": "resources/list",
  "params": {}
}
```

#### Read Resource
```javascript
{
  "method": "resources/read",
  "params": {
    "uri": "obsidian://path/to/file.md"
  }
}
```

## Security

- **Path Traversal Protection**: All file paths are validated to prevent directory traversal attacks
- **File Extension Filtering**: Only allowed file extensions can be accessed
- **File Size Limits**: Large files are rejected to prevent resource exhaustion
- **Input Validation**: All inputs are validated using Zod schemas

## Development

### Project Structure

```
src/
├── handlers/           # Request handlers
│   └── vault.ts       # Vault-specific handlers
├── utils/             # Utility functions
│   ├── logger.ts      # Logging utility
│   └── security.ts    # Security utilities
├── types/             # Type definitions
│   └── config.ts      # Configuration types
├── config.ts          # Configuration management
├── server.ts          # MCP server implementation
└── index.ts           # Main entry point

tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── fixtures/          # Test fixtures
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/SimplyAISolution/Obsidian-MCP-Server/issues)
3. Create a new issue with detailed information

## Roadmap

- [ ] Advanced search functionality
- [ ] File writing capabilities
- [ ] Plugin integration
- [ ] Batch operations
- [ ] Real-time file watching
- [ ] Enhanced metadata extraction
