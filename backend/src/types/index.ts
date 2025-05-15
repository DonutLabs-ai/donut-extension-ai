import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  message: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface McpToolRequest {
  name: string;
  arguments?: Record<string, any>;
}

export interface McpQueryRequest {
  query: string;
}

export interface McpClient {
  connect: (transport: any) => Promise<void>;
  listTools: () => Promise<any[]>;
  callTool: (toolRequest: McpToolRequest) => Promise<any>;
  listResources: () => Promise<any[]>;
  readResource: (params: { uri: string }) => Promise<any>;
  close: () => void;
}

export interface ErrorHandlerFunction {
  (err: Error, req: Request, res: Response, next: NextFunction): void;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 