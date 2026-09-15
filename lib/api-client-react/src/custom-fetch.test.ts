import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { customFetch, ApiError, ResponseParseError, setAuthTokenGetter } from './custom-fetch';

describe('customFetch', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    setAuthTokenGetter(null); // Reset global auth token getter
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('error handling', () => {
    it('throws ApiError for non-OK responses with title and detail', async () => {
      const mockResponse = new Response(JSON.stringify({ message: 'Bad Request Message', title: 'Error Title', detail: 'Error Detail' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      Object.defineProperty(mockResponse, 'url', { value: 'https://api.example.com/data' });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      try {
        await customFetch('https://api.example.com/data');
        expect.fail('Expected customFetch to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.statusText).toBe('Bad Request');
        expect(apiError.method).toBe('GET');
        expect(apiError.url).toBe('https://api.example.com/data');
        expect(apiError.data).toEqual({ message: 'Bad Request Message', title: 'Error Title', detail: 'Error Detail' });
        expect(apiError.message).toBe('HTTP 400 Bad Request: Error Title — Error Detail');
      }
    });

    it('throws ApiError with message if only message is present', async () => {
      const mockResponse = new Response(JSON.stringify({ message: 'Only Message' }), {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      Object.defineProperty(mockResponse, 'url', { value: 'https://api.example.com/data' });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      try {
        await customFetch('https://api.example.com/data');
        expect.fail('Expected customFetch to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe('HTTP 404 Not Found: Only Message');
      }
    });

    it('throws ApiError with string body', async () => {
      const mockResponse = new Response('Plain text error', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      Object.defineProperty(mockResponse, 'url', { value: 'https://api.example.com/data' });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      try {
        await customFetch('https://api.example.com/data');
        expect.fail('Expected customFetch to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe('HTTP 500 Internal Server Error: Plain text error');
        expect(apiError.data).toBe('Plain text error');
      }
    });

    it('throws ApiError for empty error body', async () => {
      const mockResponse = new Response(null, {
        status: 401,
        statusText: 'Unauthorized',
      });
      Object.defineProperty(mockResponse, 'url', { value: 'https://api.example.com/data' });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      try {
        await customFetch('https://api.example.com/data');
        expect.fail('Expected customFetch to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe('HTTP 401 Unauthorized');
        expect(apiError.data).toBeNull();
      }
    });
  });

  describe('success handling', () => {
    it('returns JSON data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await customFetch('https://api.example.com/data');
      expect(result).toEqual(mockData);

      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data', expect.objectContaining({
        method: 'GET'
      }));
    });

    it('handles responseType text correctly', async () => {
      const mockResponse = new Response('Hello World', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await customFetch('https://api.example.com/data', { responseType: 'text' });
      expect(result).toBe('Hello World');
    });

    it('throws ResponseParseError for invalid JSON when JSON expected', async () => {
      const mockResponse = new Response('invalid json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      Object.defineProperty(mockResponse, 'url', { value: 'https://api.example.com/data' });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      try {
        await customFetch('https://api.example.com/data');
        expect.fail('Expected to throw ResponseParseError');
      } catch (error) {
        expect(error).toBeInstanceOf(ResponseParseError);
        const parseError = error as ResponseParseError;
        expect(parseError.rawBody).toBe('invalid json');
      }
    });
  });

  describe('request formatting', () => {
    it('throws TypeError if GET request has a body', async () => {
      try {
        await customFetch('https://api.example.com/data', { method: 'GET', body: 'some body' });
        expect.fail('Expected to throw TypeError');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
        expect((error as TypeError).message).toContain('GET requests cannot have a body');
      }
    });

    it('automatically adds application/json content-type for json-like body', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await customFetch('https://api.example.com/data', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' })
      });

      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data', expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers)
      }));

      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('content-type')).toBe('application/json');
    });

    it('adds authorization header if auth token getter is set', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      setAuthTokenGetter(async () => 'my-test-token');

      await customFetch('https://api.example.com/data');

      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('authorization')).toBe('Bearer my-test-token');
    });
  });
});
