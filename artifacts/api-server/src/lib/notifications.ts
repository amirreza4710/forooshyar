import type { Response } from "express";

export interface AppNotification {
  id: string;
  type:
    | "order_created" | "order_updated" | "order_deleted"
    | "product_created" | "product_updated" | "product_deleted"
    | "customer_created" | "customer_updated" | "customer_deleted";
  message: string;
  actor: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

const clients = new Set<Response>();
const history: AppNotification[] = [];
const MAX_HISTORY = 100;

export function addClient(res: Response): void {
  clients.add(res);
}

export function removeClient(res: Response): void {
  clients.delete(res);
}

export function getHistory(): AppNotification[] {
  return [...history];
}

export function broadcast(n: Omit<AppNotification, "id" | "timestamp">): void {
  const notif: AppNotification = {
    ...n,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  history.unshift(notif);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

  const payload = `data: ${JSON.stringify(notif)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}
