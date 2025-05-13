/**
 * Example environment configuration
 * Copy this file to env.js and add your actual values
 */
module.exports = {
  // Server configuration
  port: 3000,
  nodeEnv: 'development',
  corsOrigin: '*',
  
  // OpenAI API Configuration
  openai: {
    apiKey: 'your_openai_api_key_here',
    apiBase: 'https://api.openai.com/v1'
  },
  
  // MCP Server Configuration
  mcp: {
    serverUrl: 'https://solana-agent-mcp-server.charlesferrell.workers.dev/sse'
  }
}; 