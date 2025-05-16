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
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers, disable CSP for Vercel

// 添加请求超时处理
app.use((req: Request, res: Response, next: NextFunction) => {
  // 设置请求超时时间为30秒
  req.setTimeout(30000);
  // 确保响应有明确的Content-Type
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON request body
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/mcp', mcpRoutes);

// Root endpoint - redirect to health or show API info
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Donut Extension API Server',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      ai: '/api/ai/*',
      mcp: '/api/mcp/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  // 确保设置完整的响应头
  res.setHeader('Connection', 'close');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  
  // 立即响应，不依赖任何异步操作
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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

// Only start the server if not being imported (used in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

// Export for Vercel
export default app; 