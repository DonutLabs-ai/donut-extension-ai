#!/bin/bash

# 退出时发生错误
set -e

echo "正在设置Donut Extension Backend开发环境..."

# 检查.env文件是否存在
if [ ! -f .env ]; then
  echo "创建.env文件..."
  cat > .env << EOF
# 服务器配置
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=chrome-extension://your-extension-id,http://localhost:3000

# OpenAI API - 请更新为您的API密钥
OPENAI_API_KEY=your-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1

# MCP
MCP_SERVER_URL=https://localhost:8000
EOF

  echo ".env文件已创建，请编辑它并输入您的API密钥。"
else
  echo ".env文件已存在。"
fi

# 安装依赖
echo "安装依赖..."
npm install

echo "设置完成！"
echo "编辑.env文件，确保添加了您的OPENAI_API_KEY"
echo "然后运行 'npm run dev' 启动开发服务器。" 