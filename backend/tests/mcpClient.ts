import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type {
  CallToolResult,
  ReadResourceResult,
  GetPromptResult,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP JSON-RPC message types
 */
export interface MCPJSONRPCRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPJSONRPCResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPJSONRPCNotification {
  jsonrpc: string;
  method: string;
  params?: any;
}

export type MCPJSONRPCMessage = MCPJSONRPCRequest | MCPJSONRPCResponse | MCPJSONRPCNotification;

/**
 * MCP tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * MCP tool result
 */
export interface MCPToolResult {
  content: {
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: {
      name: string;
      description: string;
    };
  }[];
}

/**
 * Resource result type
 */
export interface MCPResourceResult {
  contents: {
    uri: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }[];
}

/**
 * Prompt result type
 */
export interface MCPPromptResult {
  messages: {
    role: string;
    content: {
      type: string;
      text?: string;
    };
  }[];
}

/**
 * MCP Client Class
 * Used to communicate with MCP servers via the official SDK
 */
export class MCPClient {
  private serverUrl: string;
  private tools: MCPTool[] = [];
  private initialized = false;
  private connected = false;
  private notificationHandlers = new Map<string, Set<(params: any) => void>>();

  // SDK client and transport
  private sdkClient: Client | null = null;
  private transport: StreamableHTTPClientTransport | SSEClientTransport | null = null;

  /**
   * Create MCP client instance
   * @param serverUrl MCP server endpoint URL
   */
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to MCP server and initialize
   */
  async connect(): Promise<void> {
    try {
      // Create SDK client
      this.sdkClient = new Client({
        name: 'donut-extension-mcp-client',
        version: '1.0.0',
      });

      // Determine which transport to use - try StreamableHTTP first, fallback to SSE if needed
      const baseUrl = new URL(this.serverUrl);
      this.transport = new SSEClientTransport(baseUrl);

      // Connect to the MCP server
      await this.sdkClient.connect(this.transport);

      // Set state
      this.connected = true;
      this.initialized = true;

      console.log('MCP: Connection established successfully');

      // Refresh available tools
      await this.refreshTools();
    } catch (error) {
      this.connected = false;
      this.initialized = false;
      console.error('MCP: Connection failed', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Close MCP connection
   */
  disconnect(): void {
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }

    this.sdkClient = null;
    this.initialized = false;
    this.connected = false;
    console.log('MCP: Connection closed');
  }

  /**
   * Get available MCP tools
   */
  async getTools(): Promise<MCPTool[]> {
    return [...this.tools];
  }

  /**
   * Refresh tools list
   */
  async refreshTools(): Promise<MCPTool[]> {
    try {
      if (!this.sdkClient) {
        throw new Error('MCP: Client not initialized');
      }

      const toolsList = await this.sdkClient.listTools();

      // Use type assertion to convert SDK types to our interface
      const sdkTools = (toolsList.tools as any[]) || [];
      this.tools = sdkTools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
      }));

      return this.tools;
    } catch (error) {
      console.error('MCP: Failed to get tools list', error);
      return [];
    }
  }

  /**
   * Call MCP tool
   * @param toolName Tool name
   * @param args Tool parameters
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      const result = await this.sdkClient.callTool({
        name: toolName,
        arguments: args,
      });

      // Use type assertion to convert SDK result to our interface
      const content = (result as any).content || [];

      return {
        content: content.map((item: any) => ({
          type: item.type,
          text: item.text,
          data: item.data,
          mimeType: item.mimeType,
          resource: item.resource
            ? {
                name: item.resource.name,
                description: item.resource.description || '',
              }
            : undefined,
        })),
      };
    } catch (error) {
      console.error(`MCP: Tool call failed: ${toolName}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * List available resources
   */
  async listResources(): Promise<string[]> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      const result = await this.sdkClient.listResources();

      // Extract URIs from the resources array
      const resources = (result as any).resources || [];
      return resources.map((resource: any) => resource.uri);
    } catch (error) {
      console.error('MCP: Failed to list resources', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Read a resource
   * @param uri Resource URI
   */
  async readResource(uri: string): Promise<MCPResourceResult> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      const result = await this.sdkClient.readResource({ uri });

      // Use type assertion to convert SDK result to our interface
      const contents = (result as any).contents || [];

      return {
        contents: contents.map((item: any) => ({
          uri: item.uri,
          text: item.text,
          data: item.data,
          mimeType: item.mimeType,
        })),
      };
    } catch (error) {
      console.error(`MCP: Failed to read resource: ${uri}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Get a prompt
   * @param name Prompt name
   * @param args Prompt arguments
   */
  async getPrompt(name: string, args: Record<string, any>): Promise<MCPPromptResult> {
    if (!this.initialized || !this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    try {
      const result = await this.sdkClient.getPrompt({
        name: name,
        arguments: args,
      });

      // Use type assertion to convert SDK result to our interface
      const messages = (result as any).messages || [];

      return {
        messages: messages.map((message: any) => ({
          role: message.role,
          content: {
            type: message.content.type,
            text: message.content.text,
          },
        })),
      };
    } catch (error) {
      console.error(`MCP: Failed to get prompt: ${name}`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Add notification handler
   * @param method Notification method name
   * @param handler Handler function
   */
  addNotificationHandler(method: string, handler: (params: any) => void): void {
    if (!this.sdkClient) {
      throw new Error('MCP: Client not initialized');
    }

    // Store in our own collection for tracking
    let handlers = this.notificationHandlers.get(method);
    if (!handlers) {
      handlers = new Set();
      this.notificationHandlers.set(method, handlers);
    }
    handlers.add(handler);

    // Set up a notification handler with the client
    // The Client.notification method takes a method string and a callback function
    this.sdkClient.notification(method as any, handler as any);
  }

  /**
   * Remove notification handler
   * @param method Notification method name
   * @param handler Handler function to remove, if not provided removes all handlers for this method
   */
  removeNotificationHandler(method: string, handler?: (params: any) => void): void {
    // We'll handle this all internally since the SDK doesn't support
    // removing specific handlers
    const handlers = this.notificationHandlers.get(method);

    if (!handler) {
      // Remove all handlers for this method
      this.notificationHandlers.delete(method);
    } else if (handlers) {
      // Remove specific handler
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.notificationHandlers.delete(method);
      }
    }
  }

  /**
   * Check if MCP is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Test script for MCPClient
 * Run with: npx tsx backend/tests/mcpClient.ts
 */
async function testMCPClient() {
  console.log('Starting MCPClient test...');
  
  // Create client instance with the staging server URL
  const mcpClient = new MCPClient('https://donut-mcp-server-staging.charlesferrell.workers.dev/sse');
  
  try {
    // Connect to the server
    console.log('Connecting to MCP server...');
    await mcpClient.connect();
    
    // Check connection status
    console.log('Connection status:', mcpClient.isConnected() ? 'Connected' : 'Not connected');
    
    // Get available tools
    console.log('Fetching available tools...');
    const tools = await mcpClient.getTools();
    console.log(`Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    
    // List available resources if any
    try {
      console.log('Fetching available resources...');
      const resources = await mcpClient.listResources();
      console.log(`Found ${resources.length} resources:`, resources);
    } catch (error) {
      console.log('Failed to fetch resources:', error.message);
    }
    
    // If tools exist, try to call the first one with empty args
    if (tools.length > 0) {
      const firstTool = tools[0];
      console.log(`Attempting to call tool "${firstTool.name}"...`);
      try {
        const result = await mcpClient.callTool(firstTool.name, {});
        console.log('Tool call result:', result);
      } catch (error) {
        console.log(`Failed to call tool "${firstTool.name}":`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Disconnect the client
    if (mcpClient.isConnected()) {
      console.log('Disconnecting from MCP server...');
      mcpClient.disconnect();
    }
    console.log('Test completed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMCPClient().catch(console.error);
}
