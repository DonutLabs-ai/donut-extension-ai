// Declaration file for modules without type definitions

declare module '@modelcontextprotocol/sdk/client/index.js' {
  export class Client {
    constructor(options: { name: string; version: string });
    connect(transport: any): Promise<void>;
    listTools(): Promise<any[]>;
    callTool(toolRequest: { name: string; arguments: Record<string, any> }): Promise<any>;
    listResources(): Promise<any[]>;
    readResource(params: { uri: string }): Promise<any>;
    close(): void;
  }
}

declare module '@modelcontextprotocol/sdk/client/sse.js' {
  export class SSEClientTransport {
    constructor(url: URL);
  }
} 