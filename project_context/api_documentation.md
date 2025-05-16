# Donut Extension AI API Documentation

## 1. Command Completion API

This API provides command completion functionality based on user input and history.

**URL:** `https://donut-extension-ai-jackjuns-projects.vercel.app/api/ai/command/complete`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": "User's wallet address",
  "inputValue": "Current command input",
  "history": [
    {
      "id": "Command ID",
      "timestamp": 1747275394596,
      "command": "Historical command",
      "commandType": "Command type"
    }
  ],
  "trending": [
    {
      "symbol": "Token symbol",
      "price": "0" // Price as string
    }
  ],
  "balance": [
    {
      "symbol": "Token symbol",
      "balance": "Raw balance value",
      "uiBalance": 0,
      "price": "0" // Price as string
    }
  ],
  "returnFullCommand": false // Optional: whether to return the full command instead of just the completion part
}
```

**Example Request:**
```bash
curl -X POST https://donut-extension-ai-jackjuns-projects.vercel.app/api/ai/command/complete \
  -H "Content-Type: application/json" \
  -d '{
    "address": "FUknNZBDoRTsQDDfXHyLupzBUUQsVXZ8JWdXPTHWPCsE",
    "inputValue": "/Swap USDT ",
    "history": [
        {
            "id": "hF324QxZxf133QABm7IzD",
            "timestamp": 1747275394596,
            "command": "/Swap SOL 6 USDC ",
            "commandType": "swap"
        },
        {
            "id": "kshfXNKlVA1ET3plXm_Yg",
            "timestamp": 1747275374675,
            "command": "/Swap SOL 1 USDC ",
            "commandType": "swap"
        }
    ],
    "trending": [
        {
            "symbol": "SOL",
            "price": "0"
        }
    ],
    "balance": [
        {
            "symbol": "SOL",
            "balance": "0",
            "uiBalance": 0,
            "price": "0"
        }
    ],
    "returnFullCommand": false
}'
```

**Successful Response Example:**
```json
{
  "command": "10 USDC",
  "success": true
}
```

**Successful Response Example (with returnFullCommand=true):**
```json
{
  "command": "/swap USDT 10 USDC",
  "success": true
}
```

**Note:** The response only contains the completion part (what comes after the input), not the full command. For example, if the input is "/Swap USDT " and the full suggested command is "/Swap USDT 10 USDC", the API will return only "10 USDC".

If the `returnFullCommand` parameter is set to `true`, the API will return the complete command instead of just the completion part.

**Response:**
JSON object containing command completion suggestions.

## 2. MCP Tools List API

This API retrieves a list of available MCP tools.

**URL:** `https://donut-extension-ai-jackjuns-projects.vercel.app/api/mcp/tools`

**Method:** `GET`

**Headers:**
No special requirements

**Request Body:**
None

**Example Request:**
```bash
curl -X GET https://donut-extension-ai-jackjuns-projects.vercel.app/api/mcp/tools
```

**Response:**
Returns a JSON array of all available MCP tools, each containing name, description, and parameter information.

## 3. MCP Query Processing API

This API processes natural language queries and executes corresponding MCP commands.

**URL:** `https://donut-extension-ai-jackjuns-projects.vercel.app/api/mcp/process`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "User's natural language query"
}
```

**Example Request:**
```bash
curl -X POST https://donut-extension-ai-jackjuns-projects.vercel.app/api/mcp/process \
-H "Content-Type: application/json" \
-d '{"query": "what is the price of sol"}'
```

**Successful Response Example:**
```json
{
  "success": true,
  "tool": "FETCH_PRICE",
  "arguments": {
    "tokenAddress": "So11111111111111111111111111111111111111112"
  },
  "confidence": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"status\": \"success\",\n  \"price\": \"171.493219000\",\n  \"message\": \"Current price: $171.493219000 USDC\"\n}"
      }
    ]
  }
}
```

**Error Response Example:**
```json
{
  "success": false,
  "message": "Error processing your request: MCP error -32602: Invalid arguments for tool FETCH_PRICE: [...]"
}
```

When using Agent React processing, the response will also include a `steps` field documenting the reasoning steps. 