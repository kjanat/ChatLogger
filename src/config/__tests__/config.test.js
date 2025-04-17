// Mock dependencies before requiring any other modules
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
}));

// Store original process.env
const originalEnv = { ...process.env };

describe('Config Module', () => {
    // We'll store our config here
    let config;

    // We need to access dotenv after mocking
    let dotenv;

    beforeEach(() => {
        // Reset mocks and environment variables before each test
        jest.resetModules();
        jest.clearAllMocks();

        // Reset process.env
        process.env = { ...originalEnv };

        // Set default environment variables to prevent errors
        process.env.JWT_SECRET = 'test_jwt_secret';
        process.env.MONGODB_URI = 'mongodb://default:27017/chatlogger_default';

        // Ensure we're in test mode
        process.env.NODE_ENV = 'test';

        // Get reference to mocked dotenv
        dotenv = require('dotenv');
    });

    afterAll(() => {
        // Restore original process.env
        process.env = originalEnv;
    });

    // Added tests for bootstrap functionality now merged into config.js
    test('should call dotenv.config on import', () => {
        // Import the config module (will be fresh due to jest.resetModules())
        config = require('../config');
        expect(dotenv.config).toHaveBeenCalled();
    });

    test('should set default NODE_ENV to development if not defined', () => {
        delete process.env.NODE_ENV; // Ensure NODE_ENV is undefined

        // Import the config module (will be fresh due to jest.resetModules())
        config = require('../config');

        expect(config.nodeEnv).toBe('development');
    });

    test('should load default values when no env vars are set', () => {
        // Import the config module (will be fresh due to jest.resetModules())
        config = require('../config');

        expect(config.protocol).toBe('http');
        // Check if host is either the environment variable value or the default
        expect(['localhost', '0.0.0.0'].includes(config.host)).toBe(true);
        expect(config.port).toBe(3000);
        expect(config.nodeEnv).toBe('test');
        expect(config.jwtSecret).toBe('test_jwt_secret');
        expect(config.rateLimitWindowMs).toBe(15 * 60 * 1000);
        expect(config.rateLimitMax).toBe(100);
        expect(config.apiBasePath).toBe('api');
        expect(config.apiVersion).toBe('v1');
        expect(config.apiDocumentationPath).toBe('/api/docs');
        expect(config.apiDocumentationUrl).toBe('/api/docs.json');
    });

    test('should load MongoDB URI from environment-specific variable', () => {
        process.env.MONGODB_URI_TEST = 'mongodb://test-specific:27017/chatlogger_test_specific';

        // Import the config module (will be fresh due to jest.resetModules())
        config = require('../config');

        expect(config.mongodbUri).toBe('mongodb://test-specific:27017/chatlogger_test_specific');
    });

    test('should fall back to default MongoDB URI when environment-specific URI is not available', () => {
        // Remove any potential environment-specific URI
        delete process.env.MONGODB_URI_TEST;
        process.env.MONGODB_URI = 'mongodb://default:27017/chatlogger_default';

        // Import the config module (will be fresh due to jest.resetModules())
        config = require('../config');

        expect(config.mongodbUri).toBe('mongodb://default:27017/chatlogger_default');
    });

    test('should use local test MongoDB URI when both specific and default URIs are not available', () => {
        // Remove both URIs
        delete process.env.MONGODB_URI_TEST;
        delete process.env.MONGODB_URI;

        // Import the config module (will be fresh due to jest.resetModules())
        config = require('../config');

        expect(config.mongodbUri).toBe('mongodb://127.0.0.1:27017/chatlogger_test');
    });

    test('should load values from environment variables', () => {
        process.env.PROTOCOL = 'https';
        process.env.HOST = 'example.com';
        process.env.PORT = '8080';
        process.env.NODE_ENV = 'production';
        process.env.MONGODB_URI_PRD = 'mongodb://prod-db';
        process.env.JWT_SECRET = 'env-secret';
        process.env.RATE_LIMIT_WINDOW_MS = '60000';
        process.env.RATE_LIMIT_MAX = '50';
        process.env.API_BASE_PATH = 'service';
        process.env.API_VERSION = 'v2';
        process.env.DOCS_PATH = 'api-docs';

        // Import the config module (will be fresh due to jest.resetModules())
        config = require('../config');

        expect(config.protocol).toBe('https');
        expect(config.host).toBe('example.com');
        expect(config.port).toBe(8080);
        expect(config.nodeEnv).toBe('production');
        expect(config.mongodbUri).toBe('mongodb://prod-db');
        expect(config.jwtSecret).toBe('env-secret');
        expect(config.rateLimitWindowMs).toBe(60000);
        expect(config.rateLimitMax).toBe(50);
        expect(config.apiBasePath).toBe('service');
        expect(config.apiVersion).toBe('v2');
        expect(config.apiDocumentationPath).toBe('/service/api-docs');
        expect(config.apiDocumentationUrl).toBe('/service/api-docs.json');
    });

    test('should throw an error if JWT_SECRET is not set', () => {
        delete process.env.JWT_SECRET;

        expect(() => {
            require('../config');
        }).toThrow('JWT_SECRET is not set. Please configure it in your environment.');
    });

    test('should throw an error if no MongoDB URI is available in non-test environment', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.MONGODB_URI;
        delete process.env.MONGODB_URI_PRODUCTION;
        delete process.env.MONGODB_URI_PRD;

        expect(() => {
            require('../config');
        }).toThrow(/MongoDB URI is not set/); // Match part of the error message to be more flexible with changes
    });
});
