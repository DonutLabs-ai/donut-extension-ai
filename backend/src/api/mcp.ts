/**
 * MCP Server API Routes
 * Handles MCP-related endpoints including natural language command processing
 */
import express, { Request, Response } from 'express';
import * as mcpService from '../services/mcp/index.js';
import { processQuery } from '../services/ai/mcp.js';
import { McpQueryRequest, McpToolRequest, ApiResponse } from '../types/index.js';

const router = express.Router();

/**
 * @route   POST /api/mcp/process
 * @desc    Process natural language query and execute appropriate MCP command
 * @access  Private
 */
router.post('/process', async (req: Request<{}, {}, McpQueryRequest>, res: Response) => {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const response: ApiResponse<null> = {
      success: false,
      message: 'Error processing MCP query',
      error: errorMessage
    };
    
    res.status(500).json(response);
  }
});

/**
 * @route   GET /api/mcp/tools
 * @desc    List available tools from the MCP server
 * @access  Private
 */
router.get('/tools', async (req: Request, res: Response) => {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({ 
      message: 'Error listing MCP tools',
      error: errorMessage
    });
  }
});

/**
 * @route   POST /api/mcp/tool
 * @desc    Call a specific tool on the MCP server directly
 * @access  Private
 */
router.post('/tool', async (req: Request<{}, {}, McpToolRequest>, res: Response) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tool name is required' });
    }
    
    // Get MCP server URL from environment variables
    const serverUrl = process.env.MCP_SERVER_URL;
    if (!serverUrl) {
      return res.status(500).json({ message: 'MCP server URL not configured' });
    }
    
    const result = await mcpService.callTool(serverUrl, name, args || {});
    res.json({ result });
  } catch (error) {
    console.error('Error calling MCP tool:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({ 
      message: 'Error calling MCP tool',
      error: errorMessage
    });
  }
});

export default router; 