import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCompletions } from '../../src/services/ai/completion';
import * as llmModule from '../../src/services/ai/llm/index';

// Mock the callLLM function
vi.mock('../../src/services/ai/llm/index', () => ({
  callLLM: vi.fn()
}));

describe('Command Completion Edge Cases', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockUserContext = {
    address: 'FUknNZBDoRTsQDDfXHyLupzBUUQsVXZ8JWdXPTHWPCsE',
    balance: [
      { symbol: 'SOL', uiBalance: '10.5', price: '150.25' },
      { symbol: 'USDC', uiBalance: '1200.75', price: '1.00' },
      { symbol: 'USDT', uiBalance: '500.50', price: '1.00' },
      { symbol: 'ETH', uiBalance: '0.75', price: '3500.50' },
      { symbol: 'SAMO', uiBalance: '50000', price: '0.015' },
      { symbol: 'BONK', uiBalance: '10000000', price: '0.00002' }
    ],
    trending: [
      { symbol: 'SOL', price: '150.25' },
      { symbol: 'JUP', price: '0.85' },
      { symbol: 'BONK', price: '0.00002' },
      { symbol: 'RAY', price: '1.25' }
    ]
  };

  const mockCommandHistory = [
    '/price sol',
    '/swap 1 sol to usdc',
    '/swap 0.5 eth to usdt',
    '/balance',
    '/send 0.1 sol to FUknNZBDoRTsQDDfXHyLupzBUUQsVXZ8JWdXPTHWPCsE'
  ];

  // Test for partial token name that could match multiple tokens
  it('should intelligently complete ambiguous token symbols', async () => {
    const ambiguousCases = [
      // Token starting with 'S' - should prefer SOL based on balances/trending
      { 
        input: '/swap s', 
        mockResponse: '/swap sol 0.5 to usdc', 
        expected: 'ol 0.5 to usdc' 
      },
      // Token starting with 'S' for price command
      { 
        input: '/price s', 
        mockResponse: '/price sol', 
        expected: 'ol' 
      },
      // Different tokens starting with 'B'
      { 
        input: '/swap b', 
        mockResponse: '/swap bonk 100000 to usdc', 
        expected: 'onk 100000 to usdc' 
      }
    ];

    for (const testCase of ambiguousCases) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test for unusual input formats
  it('should handle unusual input formats', async () => {
    const unusualInputs = [
      // Mixed case
      { 
        input: '/SwAp', 
        mockResponse: '/SwAp 1 SOL to USDC', 
        expected: ' 1 SOL to USDC' 
      },
      // Extra spaces
      { 
        input: '/swap  ', 
        mockResponse: '/swap  0.5 sol to usdc', 
        expected: '0.5 sol to usdc' 
      },
      // Partial command
      { 
        input: '/sw', 
        mockResponse: '/swap 1 sol to usdc', 
        expected: 'ap 1 sol to usdc' 
      },
      // Command with no slash
      { 
        input: 'swap', 
        mockResponse: '/swap 1 sol to usdc', 
        expected: '/swap 1 sol to usdc' 
      }
    ];

    for (const testCase of unusualInputs) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test for non-standard command variations
  it('should handle non-standard command variations', async () => {
    const nonStandardCommands = [
      // Command with alternative syntax
      { 
        input: '/swap sol', 
        mockResponse: '/swap sol 1 to usdc', 
        expected: ' 1 to usdc' 
      },
      // Command with amount but no token
      { 
        input: '/swap 5', 
        mockResponse: '/swap 5 sol to usdc', 
        expected: ' sol to usdc' 
      },
      // Command with to-token first
      { 
        input: '/swap to', 
        mockResponse: '/swap to usdc from sol 0.5', 
        expected: ' usdc from sol 0.5' 
      }
    ];

    for (const testCase of nonStandardCommands) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test for partial token name with numerical amount
  it('should handle partial tokens with numerical inputs', async () => {
    const partialWithAmount = [
      { 
        input: '/swap 0.5 s', 
        mockResponse: '/swap 0.5 sol to usdc', 
        expected: 'ol to usdc' 
      },
      { 
        input: '/swap 100 b', 
        mockResponse: '/swap 100 bonk to usdc', 
        expected: 'onk to usdc' 
      },
      { 
        input: '/swap 1.5 e', 
        mockResponse: '/swap 1.5 eth to usdt', 
        expected: 'th to usdt' 
      }
    ];

    for (const testCase of partialWithAmount) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test with source and destination tokens
  it('should handle partial completion with from/to tokens', async () => {
    const tokenPairs = [
      { 
        input: '/swap sol to u', 
        mockResponse: '/swap sol to usdc 0.5', 
        expected: 'sdc 0.5' 
      },
      { 
        input: '/swap s to e', 
        mockResponse: '/swap sol to eth 0.05', 
        expected: 'ol to eth 0.05' 
      },
      { 
        input: '/swap 1 s to u', 
        mockResponse: '/swap 1 sol to usdc', 
        expected: 'ol to usdc' 
      }
    ];

    for (const testCase of tokenPairs) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });

  // Test for complex scenarios combining multiple edge cases
  it('should handle complex combined edge cases', async () => {
    const complexCases = [
      { 
        input: '/s 0.1 s to u', 
        mockResponse: '/swap 0.1 sol to usdc', 
        expected: 'wap 0.1 sol to usdc' 
      },
      { 
        input: '/Swap  S', 
        mockResponse: '/Swap  SOL 1 to USDC', 
        expected: 'OL 1 to USDC' 
      },
      { 
        input: '/price b', 
        mockResponse: '/price bonk', 
        expected: 'onk' 
      },
      { 
        input: '/sen', 
        mockResponse: '/send 0.1 sol to FUknNZBDoRTsQDDfXHyLupzBUUQsVXZ8JWdXPTHWPCsE', 
        expected: 'd 0.1 sol to FUknNZBDoRTsQDDfXHyLupzBUUQsVXZ8JWdXPTHWPCsE' 
      }
    ];

    for (const testCase of complexCases) {
      vi.mocked(llmModule.callLLM).mockResolvedValue(testCase.mockResponse);
      
      const completion = await generateCompletions(testCase.input, mockCommandHistory, mockUserContext);
      
      expect(llmModule.callLLM).toHaveBeenCalled();
      expect(completion).toBe(testCase.expected);
    }
  });
}); 