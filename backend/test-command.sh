#!/bin/bash

# Test script for command completion API

echo "Testing command completion API..."
curl -X POST http://localhost:8000/api/ai/command/complete \
  -H "Content-Type: application/json" \
  -d '{
    "input": "swap eth to", 
    "history": ["/balance", "/price sol"], 
    "context": {"currentWallet": "abc123"}
  }'

echo -e "\n\nTesting with different input..."
curl -X POST http://localhost:8000/api/ai/command/complete \
  -H "Content-Type: application/json" \
  -d '{
    "input": "check price of", 
    "history": [], 
    "context": {}
  }' 