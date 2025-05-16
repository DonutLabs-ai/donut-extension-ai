import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCompletions } from '../../src/services/ai/completion';
import * as llmModule from '../../src/services/ai/llm/index';

// Mock the callLLM function
vi.mock('../../src/services/ai/llm/index', () => ({
  callLLM: vi.fn()
}));

describe('Command Completion Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockUserContext = {
    address: 'Acme123XYZ...',
    balance: [
      { symbol: 'SOL', uiBalance: '2.5', price: '150.25' },
      { symbol: 'USDC', uiBalance: '120.50', price: '1.00' },
      { symbol: 'SAMO', uiBalance: '1000', price: '0.015' },
      { symbol: 'BONK', uiBalance: '50000', price: '0.00002' }
    ],
    trending: [
      { symbol: 'SOL', price: '150.25' },
      { symbol: 'JUP', price: '0.85' },
      { symbol: 'BONK', price: '0.00002' }
    ]
  };

  const mockCommandHistory = [
    '/price sol',
    '/swap 1 sol to usdc',
    '/balance',
    '/send 0.1 sol to Acme456XYZ...'
  ];

  // Test for basic completion
  it('should complete basic commands properly', async () => {
    vi.mocked(llmModule.callLLM).mockResolvedValue('/price sol');
    
    const completion = await generateCompletions('/price', mockCommandHistory, mockUserContext);
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    // Since we're mocking the LLM to return '/price sol' and input is '/price',
    // the completion should be ' sol'
    expect(completion).toBe(' sol');
  });

  // Test partial token input for swap
  it('should handle partial token input for swap command', async () => {
    vi.mocked(llmModule.callLLM).mockResolvedValue('/swap 0.5 sol to usdc');
    
    const completion = await generateCompletions('/swap s', mockCommandHistory, mockUserContext);
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    // The input is '/swap s', and the mock returns '/swap 0.5 sol to usdc'
    // So the completion should be everything after '/swap s'
    expect(completion).toBe('ol 0.5 to usdc');
  });

  // Test partial token input for price
  it('should handle partial token input for price command', async () => {
    vi.mocked(llmModule.callLLM).mockResolvedValue('/price samo');
    
    const completion = await generateCompletions('/price sa', mockCommandHistory, mockUserContext);
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    expect(completion).toBe('mo');
  });

  // Test incomplete send command
  it('should complete send command with missing parameters', async () => {
    vi.mocked(llmModule.callLLM).mockResolvedValue('/send 0.1 sol to Acme456XYZ...');
    
    const completion = await generateCompletions('/send', mockCommandHistory, mockUserContext);
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    expect(completion).toBe(' 0.1 sol to Acme456XYZ...');
  });

  // Test case sensitivity preservation
  it('should preserve case sensitivity in completions', async () => {
    vi.mocked(llmModule.callLLM).mockResolvedValue('/Swap 1 SOL to USDC');
    
    const completion = await generateCompletions('/Swap', mockCommandHistory, mockUserContext);
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    expect(completion).toBe(' 1 SOL to USDC');
  });

  // Test with alternative tokens that start with the same letter
  it('should suggest appropriate tokens based on partial input', async () => {
    vi.mocked(llmModule.callLLM).mockResolvedValue('/swap 100 samo to sol');
    
    const completion = await generateCompletions('/swap sa', mockCommandHistory, mockUserContext);
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    expect(completion).toBe('mo 100 to sol');
  });

  // Test edge case where the model doesn't properly start with user input
  it('should handle invalid completions from the model', async () => {
    // Simulate a case where the model doesn't properly continue from the input
    vi.mocked(llmModule.callLLM).mockResolvedValue('/price solana');
    
    const completion = await generateCompletions('/swap s', mockCommandHistory, mockUserContext);
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    // Since the model response doesn't start with '/swap s', we should get the full response
    expect(completion).toBe('/price solana');
  });

  // Test returnFullCommand option
  it('should return the full command when returnFullCommand is true', async () => {
    vi.mocked(llmModule.callLLM).mockResolvedValue('/swap 0.5 sol to usdc');
    
    const completion = await generateCompletions('/swap s', mockCommandHistory, mockUserContext, {
      returnFullCommand: true
    });
    
    expect(llmModule.callLLM).toHaveBeenCalled();
    expect(completion).toBe('/swap 0.5 sol to usdc');
  });

  // Test with real command patterns from the field
  it('should handle real-world command patterns', async () => {
    // Test with common abbreviations and different formats users might try
    const testCases = [
      { input: '/s', expected: 'wap 0.5 sol to usdc', mockResponse: '/swap 0.5 sol to usdc' },
      { input: '/p s', expected: 'ol', mockResponse: '/p sol' },
      { input: '/swap sol u', expected: 'sdc', mockResponse: '/swap sol usdc' },
      { input: '/swap 0.1 s', expected: 'ol to usdc', mockResponse: '/swap 0.1 sol to usdc' }
    ];

    for (const testCase of testCases) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test edge cases with unusual inputs
  it('should handle edge cases with unusual user inputs', async () => {
    const edgeCases = [
      // Empty input
      { 
        input: '', 
        mockResponse: '/swap 0.5 sol to usdc', 
        expected: '/swap 0.5 sol to usdc' 
      },
      // Just a slash
      { 
        input: '/', 
        mockResponse: '/price sol', 
        expected: 'price sol' 
      },
      // Input with trailing spaces
      { 
        input: '/swap   ', 
        mockResponse: '/swap   0.5 sol to usdc', 
        expected: '0.5 sol to usdc' 
      },
      // Capitalized command with partial token
      { 
        input: '/SWAP S', 
        mockResponse: '/SWAP SOL 1 to USDC', 
        expected: 'OL 1 to USDC' 
      }
    ];

    for (const testCase of edgeCases) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test with similar token names
  it('should properly complete similar token names based on partial input', async () => {
    const similarTokens = [
      { 
        input: '/swap s', 
        mockResponse: '/swap sol 0.5 to usdc', 
        expected: 'ol 0.5 to usdc' 
      },
      { 
        input: '/swap sa', 
        mockResponse: '/swap samo 100 to usdc', 
        expected: 'mo 100 to usdc' 
      },
      { 
        input: '/price b', 
        mockResponse: '/price bonk', 
        expected: 'onk' 
      },
      { 
        input: '/price bt', 
        mockResponse: '/price btc', 
        expected: 'c' 
      }
    ];

    for (const testCase of similarTokens) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test with abbreviated commands
  it('should handle abbreviated commands', async () => {
    const abbreviatedCommands = [
      { 
        input: '/b', 
        mockResponse: '/balance', 
        expected: 'alance' 
      },
      { 
        input: '/h', 
        mockResponse: '/history 7d', 
        expected: 'istory 7d' 
      },
      { 
        input: '/p', 
        mockResponse: '/price sol', 
        expected: 'rice sol' 
      },
      { 
        input: '/s 0.5', 
        mockResponse: '/swap 0.5 sol to usdc', 
        expected: 'wap 0.5 sol to usdc' 
      }
    ];

    for (const testCase of abbreviatedCommands) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test with only partial command and no details
  it('should complete commands with minimum user input', async () => {
    const minimalInputs = [
      { 
        input: '/swap', 
        mockResponse: '/swap 0.5 sol to usdc', 
        expected: ' 0.5 sol to usdc' 
      },
      { 
        input: '/s', 
        mockResponse: '/swap 1 sol to usdc', 
        expected: 'wap 1 sol to usdc' 
      },
      { 
        input: '/swa', 
        mockResponse: '/swap 0.2 sol to usdc', 
        expected: 'p 0.2 sol to usdc' 
      }
    ];

    for (const testCase of minimalInputs) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });
}); 