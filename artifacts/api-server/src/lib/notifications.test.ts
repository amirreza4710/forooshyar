import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Response } from 'express';
import { addClient, removeClient, getHistory, broadcast } from './notifications';

describe('notifications module', () => {
  const mockClients: Response[] = [];

  const createMockClient = () => {
    const mockRes = {
      write: vi.fn(),
    } as unknown as Response;
    mockClients.push(mockRes);
    return mockRes;
  };

  afterEach(() => {
    // Clean up all clients
    for (const client of mockClients) {
      removeClient(client);
    }
    mockClients.length = 0;
    vi.clearAllMocks();
  });

  describe('addClient and removeClient', () => {
    it('should add a client and broadcast to it', () => {
      const client = createMockClient();
      addClient(client);

      broadcast({ type: 'order_created', message: 'test', actor: 'system' });
      expect(client.write).toHaveBeenCalledTimes(1);
    });

    it('should remove a client and not broadcast to it', () => {
      const client = createMockClient();
      addClient(client);
      removeClient(client);

      broadcast({ type: 'order_created', message: 'test', actor: 'system' });
      expect(client.write).not.toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('should write notification to multiple clients', () => {
      const client1 = createMockClient();
      const client2 = createMockClient();

      addClient(client1);
      addClient(client2);

      broadcast({ type: 'order_created', message: 'test', actor: 'system' });

      expect(client1.write).toHaveBeenCalledTimes(1);
      expect(client2.write).toHaveBeenCalledTimes(1);
    });

    it('should remove a client from the set if client.write throws an error', () => {
      const mockRes1 = createMockClient();

      const mockRes2 = {
        write: vi.fn().mockImplementation(() => {
          throw new Error('Network error');
        }),
      } as unknown as Response;
      mockClients.push(mockRes2);

      const mockRes3 = createMockClient();

      addClient(mockRes1);
      addClient(mockRes2);
      addClient(mockRes3);

      broadcast({ type: 'order_created', message: 'test 1', actor: 'system' });

      expect(mockRes1.write).toHaveBeenCalledTimes(1);
      expect(mockRes2.write).toHaveBeenCalledTimes(1);
      expect(mockRes3.write).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // mockRes2 should be removed, so the second broadcast should not call write on it
      broadcast({ type: 'order_updated', message: 'test 2', actor: 'system' });

      expect(mockRes1.write).toHaveBeenCalledTimes(1);
      expect(mockRes2.write).not.toHaveBeenCalled();
      expect(mockRes3.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('history', () => {
    it('should add notifications to history and maintain max length of 100', () => {
      // Clear history (implicitly by broadcasting until max, though this module doesn't expose clearHistory)
      // We will just verify it pushes and caps at 100 by broadcasting 105 times.

      const initialHistoryLength = getHistory().length;

      // Calculate how many to broadcast to exceed 100
      const broadcastsNeeded = 105;

      for (let i = 0; i < broadcastsNeeded; i++) {
        broadcast({ type: 'product_created', message: `msg ${i}`, actor: 'system' });
      }

      const history = getHistory();
      expect(history.length).toBeLessThanOrEqual(100);

      // Ensure the newest is first
      expect(history[0].message).toBe('msg 104');
      // Verify generated properties
      expect(history[0].id).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
    });
  });
});
