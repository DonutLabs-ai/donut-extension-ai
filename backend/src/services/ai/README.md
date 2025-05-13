# AI Service API Documentation

## Architecture Overview

The AI service is structured in a modular way to allow multiple features to leverage the same LLM integration:

```
services/ai/
├── llm/            # LLM client service
│   └── index.js    # Centralized LLM caller
├── prompts/        # Prompt templates
│   └── index.js    # Libraries of prompts for different use cases
├── completion.js   # Command completion implementation
└── README.md       # This documentation
```

## Services Overview

The AI services module provides several key AI-powered capabilities:

1. **Command Completion** (`completion.js`): Provides AI-powered command suggestions based on user input.
2. **Entity Recognition** (`entity.js`): Identifies crypto entities like tokens, addresses, and amounts in text.
3. **Clippy Assistant** (`clippy.js`): Generates contextual guidance and suggestions for users.
4. **MCP Integration** (`mcp.js`): Processes natural language and finds the appropriate MCP command to execute.

## Command Completion Service

The Command Completion Service provides AI-powered command completion based on user input and contextual data.

### `generateCompletions(input, history, context)`

Generates a complete command based on user input and contextual information.

#### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `input` | `string` | User's current input text | Yes |
| `history` | `Array` | Previous commands issued by user | No |
| `context` | `Object` | Additional context from frontend | No |
| `context.recentTransactions` | `Array` | Recent successful transactions | No |
| `context.walletBalances` | `Object` | Token balances in user's wallet | No |
| `context.trendingTokens` | `Array` | Currently trending tokens | No |
| `context.currentPage` | `string` | Page user is currently on | No |
| `context.favoriteTokens` | `Array` | User's saved favorite tokens | No |

#### Returns

`Promise<string>`: A complete command string based on the user's input and context.

#### Example Usage

```javascript
const { generateCompletions } = require('../services/ai/completion');

// Example controller
async function handleCompletions(req, res) {
  try {
    const { input } = req.body;
    const history = req.body.history || [];
    const context = req.body.context || {};
    
    const command = await generateCompletions(
      input,
      history,
      context
    );
    
    res.json({ command });
  } catch (error) {
    console.error('Completion error:', error);
    res.status(500).json({ error: 'Failed to generate command' });
  }
}
```

#### API Example

**Request:**

```bash
curl -X POST http://localhost:3000/api/ai/command/complete \
  -H "Content-Type: application/json" \
  -d '{
    "input": "/swap",
    "history": ["price ETH", "chart BTC"],
    "context": {
      "walletBalances": {
        "ETH": "1.5",
        "USDC": "2500"
      },
      "currentPage": "wallet"
    }
  }'
```

**Response:**

```json
{
  "command": "swap 0.1 ETH USDC"
}
```

## LLM Service API

The core LLM service can be used directly by any feature that needs to interact with language models.

### `callLLM(params)`

Calls the language model with customizable prompts and options.

#### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `params.systemPrompt` | `string` | Instructions for the AI model | Yes |
| `params.userPrompt` | `string` | User query or input | Yes |
| `params.options` | `Object` | Additional options | No |
| `params.options.model` | `string` | Model to use (default: "gpt-4.1-nano") | No |
| `params.options.temperature` | `number` | Randomness (0-1, default: 0.3) | No |
| `params.options.maxTokens` | `number` | Max tokens in response (default: 250) | No |
| `params.options.parseJson` | `boolean` | Auto-parse response as JSON (default: false) | No |
| `params.options.responseProcessor` | `function` | Custom response processor | No |

#### Returns

`Promise<any>`: The processed response from the LLM.

#### Example Usage

```javascript
const { callLLM } = require('../services/ai/llm');
const { entityExtraction } = require('../services/ai/prompts');

async function extractEntities(text) {
  try {
    const entities = await callLLM({
      systemPrompt: entityExtraction.system,
      userPrompt: entityExtraction.user(text),
      options: {
        parseJson: true,
        temperature: 0.1  // Lower temperature for more deterministic extraction
      }
    });
    
    return entities;
  } catch (error) {
    console.error('Entity extraction error:', error);
    return { tokens: [], addresses: [], amounts: [], actions: [] };
  }
}
```

## Context Examples

### Recent Transactions

```javascript
"recentTransactions": [
  { "type": "swap", "from": "ETH", "to": "USDC", "amount": "0.5", "timestamp": 1671234567 },
  { "type": "send", "token": "USDC", "amount": "100", "to": "0x123...", "timestamp": 1671234000 }
]
```

### Wallet Balances

```javascript
"walletBalances": {
  "ETH": "1.5",
  "USDC": "2500",
  "WBTC": "0.05"
}
```

### Trending Tokens

```javascript
"trendingTokens": [
  { "symbol": "ETH", "name": "Ethereum", "priceChange24h": 2.5 },
  { "symbol": "SOL", "name": "Solana", "priceChange24h": 5.7 },
  { "symbol": "PEPE", "name": "Pepe", "priceChange24h": -3.1 }
]
```

## Implementation Notes

- The service uses OpenAI's GPT-4.1-nano model for quick and efficient completions
- Configuration requires environment variables:
  - `OPENAI_API_KEY`: Your OpenAI API key
  - `OPENAI_API_BASE`: API base URL (defaults to 'https://api.openai.com/v1' if not specified)
- Add these to your `.env` file:
  ```
  OPENAI_API_KEY=your_openai_api_key_here
  OPENAI_API_BASE=https://api.openai.com/v1
  ```
- Includes fallback mechanism for when the API is unavailable
- Optimized for response speed with a low temperature setting and limited token output 

## MCP Integration Service

The MCP integration service (`mcp.js`) connects natural language processing with the Model Context Protocol (MCP) to execute Solana-related commands.

### Features

- Analyzes natural language queries to determine user intent
- Matches queries to available MCP tools
- Selects and executes the appropriate tool with the correct arguments
- Returns tool execution results to the user

### Usage

```javascript
const { processQuery } = require('./services/ai/mcp');

// Process a natural language query
const result = await processQuery(
  "What's the current price of Solana?", 
  "https://solana-agent-mcp-server.charlesferrell.workers.dev/sse"
);

// Result object contains:
// {
//   success: true,
//   tool: "FETCH_PRICE",
//   arguments: { tokenAddress: "So11111111111111111111111111111111111111112" },
//   confidence: 0.95,
//   result: { content: [{ type: "text", text: "..." }] }
// }
``` 