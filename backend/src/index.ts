import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 计算项目根目录路径 (src的上一级)
const rootDir = path.resolve(__dirname, '..');

// 配置dotenv，使用绝对路径
dotenv.config({ path: path.join(rootDir, '.env') });

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import aiRoutes from './api/ai.js';
import mcpRoutes from './api/mcp.js';

// Import services
import * as mcpService from './services/mcp/index.js';

// Import types
import { ErrorResponse } from './types/index.js';

// Initialize express app
const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
}));
app.use(express.json()); // Parse JSON request body
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/mcp', mcpRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  const response: ErrorResponse = {
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  };
  
  res.status(500).json(response);
});

// Graceful shutdown handling
const gracefulShutdown = (): void => {
  console.log('Shutting down gracefully...');
  
  // Close MCP connections
  try {
    mcpService.closeAllConnections();
  } catch (error) {
    console.error('Error closing MCP connections:', error);
  }
  
  // Exit the process
  process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

export default app; 