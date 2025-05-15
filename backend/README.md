# Donut Extension Backend

Backend server for the Donut browser extension with AI features, built with TypeScript and Express.

## Features

- AI-powered crypto entity recognition
- Command suggestions and completions
- Clippy-style contextual helpers
- Model Context Protocol (MCP) integration

## Development Setup

### Prerequisites

- Node.js 16+ 
- npm 7+

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

### Environment Setup

Create a `.env` file in the project root with the following variables:

```
# Server config
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=chrome-extension://your-extension-id,http://localhost:3000

# OpenAI API
OPENAI_API_KEY=your-api-key
OPENAI_API_BASE=https://api.openai.com/v1

# MCP
MCP_SERVER_URL=https://localhost:8000
```

### Development

Start the development server with automatic reloading:

```bash
npm run dev
```

### Building

Build the TypeScript project:

```bash
npm run build
```

Or use the build script:

```bash
./build.sh
```

### Production

To start the server in production mode:

```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── api/            # API routes
│   ├── services/       # Service implementations
│   │   ├── ai/         # AI services
│   │   │   ├── llm/    # Language model integration
│   │   │   └── prompts/ # Prompt templates
│   │   └── mcp/        # MCP client implementation
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Main entry point
├── dist/               # Compiled JavaScript (build output)
├── tests/              # Test files
└── config/             # Configuration files
```

## API Endpoints

### AI API

- `POST /api/ai/command/complete` - Get AI-powered command suggestions
- `POST /api/ai/entity/recognize` - Recognize crypto entities in text
- `POST /api/ai/clippy/suggest` - Get contextual suggestions

### MCP API

- `POST /api/mcp/process` - Process natural language query via MCP
- `GET /api/mcp/tools` - List available MCP tools
- `POST /api/mcp/tool` - Call a specific MCP tool directly 