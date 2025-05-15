import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../src/index.js';

describe('Health Check API', () => {
  it('should return 200 and correct response structure', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    
    // Verify timestamp is a valid date string
    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(isNaN(timestamp.getTime())).toBe(false);
  });
}); 