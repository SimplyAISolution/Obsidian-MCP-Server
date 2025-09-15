/**
 * Jest Test Setup
 */

// Global test configuration
jest.setTimeout(10000);

// Mock environment variables
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';