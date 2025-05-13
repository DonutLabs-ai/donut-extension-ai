/**
 * MCP Server API Routes
 * Handles MCP-related endpoints including natural language command processing
 */
const express = require('express');
const router = express.Router();
const mcpService = require('../services/mcp');
const { processQuery } = require('../services/ai/mcp');

/**
 * @route   POST /api/mcp/process
 * @desc    Process natural language query and execute appropriate MCP command
 * @access  Private
 */
router.post('/process', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }
    
    // Get MCP server URL from environment variables
    const serverUrl = process.env.MCP_SERVER_URL;
    if (!serverUrl) {
      return res.status(500).json({ message: 'MCP server URL not configured' });
    }
    
    const result = await processQuery(query, serverUrl);
    res.json(result);
  } catch (error) {
    console.error('Error processing MCP query:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing MCP query',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mcp/tools
 * @desc    List available tools from the MCP server
 * @access  Private
 */
router.get('/tools', async (req, res) => {
  try {
    // Get MCP server URL from environment variables
    const serverUrl = process.env.MCP_SERVER_URL;
    if (!serverUrl) {
      return res.status(500).json({ message: 'MCP server URL not configured' });
    }
    
    const tools = await mcpService.listTools(serverUrl);
    res.json({ tools });
  } catch (error) {
    console.error('Error listing MCP tools:', error);
    res.status(500).json({ 
      message: 'Error listing MCP tools',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/mcp/tool
 * @desc    Call a specific tool on the MCP server directly
 * @access  Private
 */
router.post('/tool', async (req, res) => {
  try {
    const { name, arguments } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tool name is required' });
    }
    
    // Get MCP server URL from environment variables
    const serverUrl = process.env.MCP_SERVER_URL;
    if (!serverUrl) {
      return res.status(500).json({ message: 'MCP server URL not configured' });
    }
    
    const result = await mcpService.callTool(serverUrl, name, arguments || {});
    res.json({ result });
  } catch (error) {
    console.error('Error calling MCP tool:', error);
    res.status(500).json({ 
      message: 'Error calling MCP tool',
      error: error.message
    });
  }
});

module.exports = router; 