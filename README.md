# Donut Extension Backend

AI-powered backend service for the Donut browser extension MVP.

## Features

- Command auto-completion with AI-powered suggestions
- Crypto entity recognition in text
- Clippy AI Assistant framework for contextual suggestions
- Natural language processing for Solana commands using MCP
- RESTful API for extension integration

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the environment example file and configure your variables:
   ```
   cp config/env.example.js config/env.js
   ```
4. Edit `config/env.js` with your API keys and settings

### Development

Run the server in development mode with hot-reloading:

```
npm run dev
```

### API Endpoints

- `POST /api/ai/command/complete` - Get AI-powered command suggestions
- `POST /api/ai/entity/recognize` - Recognize crypto entities in text
- `POST /api/ai/clippy/suggest` - Get Clippy suggestions based on context
- `POST /api/mcp/process` - Process natural language and execute MCP commands
- `GET /api/mcp/tools` - List available MCP tools
- `POST /api/mcp/tool` - Call a specific MCP tool directly

## Architecture

- `src/index.js` - Express server setup and main entry point
- `src/api/` - API route definitions
- `src/services/` - Business logic implementation
- `src/services/ai/` - AI-related services (completion, entity recognition, Clippy)
- `src/services/mcp/` - MCP client services for Solana commands

## MCP Integration

The backend integrates with the Model Context Protocol (MCP) to provide natural language processing for Solana commands. It connects to a Solana agent MCP server using the SSE transport from the MCP TypeScript SDK.

When a user enters a natural language query in the command bar, the backend:

1. Analyzes the query using AI
2. Finds the appropriate MCP tool to call based on the query
3. Executes the command via the MCP server
4. Returns the result to the user

The MCP server URL is configurable via environment variables, allowing for different servers in development and production environments.

## Future Enhancements (P1)

- LangChain/LlamaIndex integration for advanced completions
- Entity recognition with NER models 
- Clippy assistant with better context awareness
- Transaction monitoring for swap/send commands
- MongoDB integration for user preferences
- Advanced MCP integration with Streamable HTTP transport