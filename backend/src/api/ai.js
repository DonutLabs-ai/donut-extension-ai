const express = require('express');
const router = express.Router();
const { generateCompletions } = require('../services/ai/completion');
const { recognizeEntities } = require('../services/ai/entity');
const { generateClippySuggestions } = require('../services/ai/clippy');

/**
 * @route   POST /api/ai/command/complete
 * @desc    Get AI-powered command suggestion
 * @access  Private
 */
router.post('/command/complete', async (req, res) => {
  try {
    const { input, history, context } = req.body;
    
    if (!input) {
      return res.status(400).json({ message: 'Input is required' });
    }
    
    const command = await generateCompletions(input, history, context);
    res.json({ command });
  } catch (error) {
    console.error('Error generating command completion:', error);
    res.status(500).json({ message: 'Error generating command', error: error.message });
  }
});

/**
 * @route   POST /api/ai/entity/recognize
 * @desc    Recognize crypto entities in text
 * @access  Private
 */
router.post('/entity/recognize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    const entities = await recognizeEntities(text);
    res.json({ entities });
  } catch (error) {
    console.error('Error recognizing entities:', error);
    res.status(500).json({ message: 'Error recognizing entities', error: error.message });
  }
});

/**
 * @route   POST /api/ai/clippy/suggest
 * @desc    Get Clippy suggestions based on context
 * @access  Private
 */
router.post('/clippy/suggest', async (req, res) => {
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
    res.status(500).json({ message: 'Error generating suggestions', error: error.message });
  }
});

module.exports = router;