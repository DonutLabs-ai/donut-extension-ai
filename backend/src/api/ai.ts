import express, { Request, Response } from 'express';
import { generateCompletions } from '../services/ai/completion.js';
import { recognizeEntities } from '../services/ai/entity.js';
import { generateClippySuggestions } from '../services/ai/clippy.js';
import { ApiResponse } from '../types/index.js';

const router = express.Router();

interface CommandHistoryItem {
  id: string;
  timestamp: number;
  command: string;
  commandType: string;
}

interface TrendingItem {
  symbol: string;
  price: string;
}

interface BalanceItem {
  symbol: string;
  balance: string;
  uiBalance: number;
  price: string;
}

interface CommandCompleteRequest {
  address: string;
  inputValue: string;
  history?: CommandHistoryItem[];
  trending?: TrendingItem[];
  balance?: BalanceItem[];
  returnFullCommand?: boolean;
}

interface EntityRecognizeRequest {
  text: string;
}

interface ClippySuggestRequest {
  pageUrl?: string;
  pageTitle?: string;
  selectedText?: string;
  recentCommands?: string[];
}

/**
 * @route   POST /api/ai/command/complete
 * @desc    Get AI-powered command suggestion
 * @access  Private
 */
router.post('/command/complete', async (req: Request<{}, {}, CommandCompleteRequest>, res: Response) => {
  try {
    const { inputValue, history, address, trending, balance, returnFullCommand } = req.body;
    
    if (!inputValue) {
      return res.status(400).json({ message: 'Input value is required' });
    }
    
    // Create a context object with the additional data
    const context = {
      address,
      trending,
      balance
    };
    
    // Convert history to the format expected by generateCompletions if needed
    const formattedHistory = history?.map(item => item.command) || [];
    
    const command = await generateCompletions(inputValue, formattedHistory, context, {
      returnFullCommand: returnFullCommand || false
    });
    res.json({ 
      command,
      success: true 
    });
  } catch (error) {
    console.error('Error generating command completion:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({ 
      success: false,
      message: 'Error generating command', 
      error: errorMessage 
    });
  }
});

/**
 * @route   POST /api/ai/entity/recognize
 * @desc    Recognize crypto entities in text
 * @access  Private
 */
router.post('/entity/recognize', async (req: Request<{}, {}, EntityRecognizeRequest>, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    const entities = await recognizeEntities(text);
    res.json({ entities });
  } catch (error) {
    console.error('Error recognizing entities:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({ 
      message: 'Error recognizing entities', 
      error: errorMessage 
    });
  }
});

/**
 * @route   POST /api/ai/clippy/suggest
 * @desc    Get Clippy suggestions based on context
 * @access  Private
 */
router.post('/clippy/suggest', async (req: Request<{}, {}, ClippySuggestRequest>, res: Response) => {
  try {
    const { pageUrl, pageTitle, selectedText, recentCommands } = req.body;
    
    const suggestions = await generateClippySuggestions({
      pageUrl,
      pageTitle,
      selectedText,
      recentCommands
    });
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating Clippy suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({ 
      message: 'Error generating suggestions', 
      error: errorMessage 
    });
  }
});

export default router; 