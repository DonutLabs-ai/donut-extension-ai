# Donut Extension Backend

AI-powered backend service for the Donut browser extension MVP.

## Features

- Command auto-completion with AI-powered suggestions
- Crypto entity recognition in text
- Clippy AI Assistant framework for contextual suggestions
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
   cp .env.example .env
   ```
4. Edit `.env` with your API keys and settings

### Development

Run the server in development mode with hot-reloading:

```
npm run dev
```

### API Endpoints

- `POST /api/ai/command/complete` - Get AI-powered command suggestions
- `POST /api/ai/entity/recognize` - Recognize crypto entities in text
- `POST /api/ai/clippy/suggest` - Get Clippy suggestions based on context

## Architecture

- `src/index.js` - Express server setup and main entry point
- `src/api/` - API route definitions
- `src/services/` - Business logic implementation
- `src/services/ai/` - AI-related services (completion, entity recognition, Clippy)

## Future Enhancements (P1)

- LangChain/LlamaIndex integration for advanced completions
- Entity recognition with NER models 
- Clippy assistant with better context awareness
- Transaction monitoring for swap/send commands
- MongoDB integration for user preferences