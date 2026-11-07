import bcrypt from "bcryptjs";
import { signToken } from "../../lib/auth";

export interface SettingsRow {
  id: number;
  businessName: string;
  phone: string;
  address: string;
  currency: string;
  productCodePrefix: string;
  customerCodePrefix: string;
  orderCodePrefix: string;
  updatedAt: Date;
}

export interface UserRow {
  id: number;
  username: string;
  password: string;
  name: string;
  role: string;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface RefreshTokenRow {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface AuditLogRow {
  id: number;
  userId: number | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: Date;
}

export interface ProductRow {
  id: number;
  code: string;
  name: string;
  category: string;
  pack?: string | null;
  price: number;
  stock: number;
  image?: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface CustomerRow {
  id: number;
  code: string;
  name: string;
  phone: string;
  address?: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface OrderRow {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  userId: number;
  repName: string;
  total: number;
  status: string;
  items: any;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface StoreState {
  settings: SettingsRow[];
  users: UserRow[];
  refreshTokens: RefreshTokenRow[];
  auditLogs: AuditLogRow[];
  products: ProductRow[];
  customers: CustomerRow[];
  orders: OrderRow[];
  autoInc: {
    settings: number;
    users: number;
    refreshTokens: number;
    auditLogs: number;
    products: number;
    customers: number;
    orders: number;
  };
}

const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync("Admin123!", 8);
const DEFAULT_REP_PASSWORD_HASH = bcrypt.hashSync("Rep12345!", 8);
const DEFAULT_MGR_PASSWORD_HASH = bcrypt.hashSync("Manager123!", 8);

function initialStoreState(): StoreState {
  return {
    settings: [
      {
        id: 1,
        businessName: "نادران‌گستر",
        phone: "021-12345678",
        address: "تهران",
        currency: "تومان",
        productCodePrefix: "NG-",
        customerCodePrefix: "C-",
        orderCodePrefix: "ORD-",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    users: [
      {
        id: 1,
        username: "admin",
        password: DEFAULT_ADMIN_PASSWORD_HASH,
        name: "مدیر تستی",
        role: "سرپرست",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null,
      },
      {
        id: 2,
        username: "salesrep",
        password: DEFAULT_REP_PASSWORD_HASH,
        name: "نماینده تستی",
        role: "نماینده فروش",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null,
      },
      {
        id: 3,
        username: "salesmgr",
        password: DEFAULT_MGR_PASSWORD_HASH,
        name: "مدیر فروش",
        role: "مدیر فروش / نماینده",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null,
      },
    ],
    refreshTokens: [],
    auditLogs: [],
    products: [],
    customers: [],
    orders: [],
    autoInc: {
      settings: 1,
      users: 3,
      refreshTokens: 0,
      auditLogs: 0,
      products: 0,
      customers: 0,
      orders: 0,
    },
  };
}

let store: StoreState = initialStoreState();

export function resetStore(): void {
  store = initialStoreState();
}

export function getStore(): StoreState {
  return store;
}

export function getAdminToken(): string {
  const admin = store.users.find((u) => u.id === 1)!;
  return signToken({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
  });
}

export function getRepToken(): string {
  const rep = store.users.find((u) => u.id === 2)!;
  return signToken({
    id: rep.id,
    username: rep.username,
    name: rep.name,
    role: rep.role,
  });
}

export function getManagerToken(): string {
  const mgr = store.users.find((u) => u.id === 3)!;
  return signToken({
    id: mgr.id,
    username: mgr.username,
    name: mgr.name,
    role: mgr.role,
  });
}

export function signCustomToken(payload: { id: number; username: string; name: string; role: string }): string {
  return signToken(payload);
}

// Convert Drizzle SQL query chunks to plain text
function sqlToText(chunk: any): string {
  if (chunk === null || chunk === undefined) return "";
  if (typeof chunk === "string" || typeof chunk === "number" || typeof chunk === "boolean") {
    return String(chunk);
  }
  if (chunk?.name && typeof chunk.name === "string") {
    return chunk.name;
  }
  if (chunk?.value && Array.isArray(chunk.value)) {
    return chunk.value.join("");
  }
  if (chunk?.queryChunks && Array.isArray(chunk.queryChunks)) {
    return chunk.queryChunks.map(sqlToText).join("");
  }
  return String(chunk);
}

function resolveTableKey(table: any): keyof Omit<StoreState, "autoInc"> | null {
  if (!table) return null;
  const name =
    table._?.name ||
    table.tableName ||
    table.name ||
    (typeof table === "string" ? table : null) ||
    table[Symbol.for("drizzle:Name")];

  if (name === "settings" || table === "settingsTable") return "settings";
  if (name === "users" || table === "usersTable") return "users";
  if (name === "refresh_tokens" || table === "refreshTokensTable") return "refreshTokens";
  if (name === "audit_logs" || table === "auditLogsTable") return "auditLogs";
  if (name === "products" || table === "productsTable") return "products";
  if (name === "customers" || table === "customersTable") return "customers";
  if (name === "orders" || table === "ordersTable") return "orders";

  return null;
}

export function createDbMock() {
  const executeSql = async (sqlObj: any) => {
    const text = sqlToText(sqlObj);

    // 1. SELECT id, stock FROM products WHERE id IN (...) AND deleted_at IS NULL ORDER BY id FOR UPDATE
    if (text.includes("SELECT id, stock FROM products")) {
      const match = text.match(/WHERE\s+id\s+IN\s*\(([^)]+)\)/i);
      if (match) {
        const rawIds = match[1].split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
        const matching = store.products.filter(
          (p) => rawIds.includes(p.id) && p.deletedAt === null
        );
        return { rows: matching.map((p) => ({ id: p.id, stock: p.stock })) };
      }
      return { rows: store.products.filter((p) => p.deletedAt === null).map((p) => ({ id: p.id, stock: p.stock })) };
    }

    // 2. SELECT name FROM customers WHERE id = ... AND deleted_at IS NULL
    if (text.includes("SELECT name FROM customers")) {
      const match = text.match(/WHERE\s+id\s*=\s*(\d+)/i);
      if (match) {
        const customerId = parseInt(match[1], 10);
        const customer = store.customers.find((c) => c.id === customerId && c.deletedAt === null);
        return { rows: customer ? [{ name: customer.name }] : [] };
      }
      return { rows: [] };
    }

    // 3. UPDATE products SET stock = CASE ... WHEN id = X THEN stock - Y ...
    if (text.includes("UPDATE products SET stock")) {
      const regex = /WHEN\s+id\s*=\s*(\d+)\s+THEN\s+stock\s*([-+])\s*(\d+)/gi;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const pId = parseInt(m[1], 10);
        const op = m[2];
        const diff = parseInt(m[3], 10);
        const product = store.products.find((p) => p.id === pId);
        if (product) {
          product.stock = op === "-" ? product.stock - diff : product.stock + diff;
        }
      }
      return { rows: [] };
    }

    return { rows: [] };
  };

  const select = () => {
    let targetTable: any = null;
    let wherePredicate: any = null;
    let orderDesc = false;
    let limitVal: number | null = null;
    let offsetVal: number | null = null;

    const builder: any = {
      from(t: any) {
        targetTable = t;
        return builder;
      },
      where(p: any) {
        wherePredicate = p;
        return builder;
      },
      orderBy(_clause: any) {
        orderDesc = true;
        return builder;
      },
      limit(n: number) {
        limitVal = n;
        return builder;
      },
      offset(n: number) {
        offsetVal = n;
        return builder;
      },
      then(resolve: any, reject: any) {
        try {
          const key = resolveTableKey(targetTable);
          if (!key) {
            resolve([]);
            return;
          }
          let items: any[] = [...(store[key] as any[])];

          // Special filters based on known routes
          if (key === "settings") {
            // Settings singleton
          } else if (key === "users") {
            const predText = sqlToText(wherePredicate);
            if (predText.includes("username")) {
              const uMatch = predText.match(/username\s*=\s*([^\s)]+)/);
              if (uMatch) {
                const uname = uMatch[1].replace(/['"]/g, "");
                items = items.filter((u) => u.username === uname);
              }
            }
            const idMatch = predText.match(/(?:^|[^_])\bid\s*=\s*(\d+)/);
            if (idMatch) {
              const uid = parseInt(idMatch[1], 10);
              items = items.filter((u) => u.id === uid);
            }
            if (/deleted_?at\s+is\s+null/i.test(predText) || predText.includes("isNull")) {
              items = items.filter((u) => u.deletedAt === null);
            }
          } else if (key === "refreshTokens") {
            const predText = sqlToText(wherePredicate);
            if (predText.includes("tokenHash") || predText.includes("token_hash")) {
              const hashMatch = predText.match(/token_hash\s*=\s*([^\s)]+)/i) || predText.match(/=\s*([a-f0-9]{64})/i);
              if (hashMatch) {
                const hash = hashMatch[1].replace(/['"]/g, "");
                items = items.filter((r) => r.tokenHash === hash);
              }
            }
          } else if (key === "auditLogs") {
            // Ordered by created_at DESC
            items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          } else if (key === "products" || key === "customers" || key === "orders") {
            const predText = sqlToText(wherePredicate);
            if (/deleted_?at\s+is\s+null/i.test(predText) || predText.includes("isNull")) {
              items = items.filter((item) => item.deletedAt === null);
            }
            const idMatch = predText.match(/(?:^|[^_])\bid\s*=\s*(\d+)/);
            if (idMatch) {
              const targetId = parseInt(idMatch[1], 10);
              items = items.filter((i) => i.id === targetId);
            }
            items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }

          if (offsetVal !== null && offsetVal > 0) {
            items = items.slice(offsetVal);
          }
          if (limitVal !== null && limitVal >= 0) {
            items = items.slice(0, limitVal);
          }

          resolve(items);
        } catch (err) {
          if (reject) reject(err);
          else throw err;
        }
      },
    };
    return builder;
  };

  const insert = (targetTable: any) => {
    let valuesToInsert: any = null;

    const builder: any = {
      values(v: any) {
        valuesToInsert = v;
        return builder;
      },
      returning() {
        return builder;
      },
      then(resolve: any, reject: any) {
        try {
          const key = resolveTableKey(targetTable);
          if (!key) {
            resolve([]);
            return;
          }

          const records = Array.isArray(valuesToInsert) ? valuesToInsert : [valuesToInsert];
          const inserted: any[] = [];

          for (const item of records) {
            store.autoInc[key]++;
            const newId = store.autoInc[key];
            const fullRecord: any = {
              id: newId,
              createdAt: new Date(),
              ...item,
            };

            if (key === "settings") {
              fullRecord.updatedAt = new Date();
            } else if (key === "users" || key === "products" || key === "customers" || key === "orders") {
              if (fullRecord.deletedAt === undefined) fullRecord.deletedAt = null;
            } else if (key === "refreshTokens") {
              if (fullRecord.revokedAt === undefined) fullRecord.revokedAt = null;
            }

            (store[key] as any[]).push(fullRecord);
            inserted.push(fullRecord);
          }

          resolve(inserted);
        } catch (err) {
          if (reject) reject(err);
          else throw err;
        }
      },
    };
    return builder;
  };

  const update = (targetTable: any) => {
    let updateFields: any = null;
    let wherePredicate: any = null;

    const builder: any = {
      set(fields: any) {
        updateFields = fields;
        return builder;
      },
      where(pred: any) {
        wherePredicate = pred;
        return builder;
      },
      returning() {
        return builder;
      },
      then(resolve: any, reject: any) {
        try {
          const key = resolveTableKey(targetTable);
          if (!key) {
            resolve([]);
            return;
          }

          const predText = sqlToText(wherePredicate);
          const targetItems = store[key] as any[];
          const updated: any[] = [];

          for (const item of targetItems) {
            let matches = true;

            if (key === "settings") {
              matches = true;
            } else {
              const idMatch = predText.match(/(?:^|[^_])\bid\s*=\s*(\d+)/);
              if (idMatch) {
                matches = matches && item.id === parseInt(idMatch[1], 10);
              }
              if (predText.includes("userId") || predText.includes("user_id")) {
                const uMatch = predText.match(/user_id\s*=\s*(\d+)/i);
                if (uMatch) {
                  matches = matches && item.userId === parseInt(uMatch[1], 10);
                }
              }
              if (predText.includes("tokenHash") || predText.includes("token_hash")) {
                const hashMatch = predText.match(/token_hash\s*=\s*([^\s)]+)/i) || predText.match(/=\s*([a-f0-9]{64})/i);
                if (hashMatch) {
                  const hash = hashMatch[1].replace(/['"]/g, "");
                  matches = matches && item.tokenHash === hash;
                }
              }
              if (/revoked_?at\s+is\s+null/i.test(predText) || predText.includes("isNull")) {
                matches = matches && item.revokedAt === null;
              }
              if (/deleted_?at\s+is\s+null/i.test(predText) || predText.includes("isNull")) {
                matches = matches && item.deletedAt === null;
              }
            }

            if (matches) {
              Object.assign(item, updateFields);
              updated.push(item);
            }
          }

          resolve(updated);
        } catch (err) {
          if (reject) reject(err);
          else throw err;
        }
      },
    };
    return builder;
  };

  const deleteFn = (targetTable: any) => {
    let wherePredicate: any = null;

    const builder: any = {
      where(pred: any) {
        wherePredicate = pred;
        return builder;
      },
      then(resolve: any, reject: any) {
        try {
          const key = resolveTableKey(targetTable);
          if (!key) {
            resolve([]);
            return;
          }
          const predText = sqlToText(wherePredicate);
          const list = store[key] as any[];
          const idMatch = predText.match(/(?:^|[^_])\bid\s*=\s*(\d+)/);

          if (idMatch) {
            const targetId = parseInt(idMatch[1], 10);
            const idx = list.findIndex((x) => x.id === targetId);
            if (idx !== -1) {
              list.splice(idx, 1);
            }
          }
          resolve([]);
        } catch (err) {
          if (reject) reject(err);
          else throw err;
        }
      },
    };
    return builder;
  };

  const mockDbInstance: any = {
    select,
    insert,
    update,
    delete: deleteFn,
    execute: executeSql,
    transaction: async (cb: (tx: any) => Promise<any>) => {
      const tx = {
        select,
        insert,
        update,
        delete: deleteFn,
        execute: executeSql,
      };
      return await cb(tx);
    },
  };

  return {
    db: mockDbInstance,
    settingsTable: {
      id: "id",
      businessName: "business_name",
      phone: "phone",
      address: "address",
      currency: "currency",
      productCodePrefix: "product_code_prefix",
      customerCodePrefix: "customer_code_prefix",
      orderCodePrefix: "order_code_prefix",
      updatedAt: "updated_at",
      tableName: "settings",
      _: { name: "settings" },
    },
    usersTable: {
      id: "id",
      username: "username",
      password: "password",
      name: "name",
      role: "role",
      createdAt: "created_at",
      deletedAt: "deleted_at",
      tableName: "users",
      _: { name: "users" },
    },
    refreshTokensTable: {
      id: "id",
      userId: "user_id",
      tokenHash: "token_hash",
      expiresAt: "expires_at",
      revokedAt: "revoked_at",
      createdAt: "created_at",
      tableName: "refresh_tokens",
      _: { name: "refresh_tokens" },
    },
    auditLogsTable: {
      id: "id",
      userId: "user_id",
      actorName: "actor_name",
      action: "action",
      entity: "entity",
      entityId: "entity_id",
      details: "details",
      ipAddress: "ip_address",
      createdAt: "created_at",
      tableName: "audit_logs",
      _: { name: "audit_logs" },
    },
    productsTable: {
      id: "id",
      code: "code",
      name: "name",
      category: "category",
      pack: "pack",
      price: "price",
      stock: "stock",
      image: "image",
      createdAt: "created_at",
      deletedAt: "deleted_at",
      tableName: "products",
      _: { name: "products" },
    },
    customersTable: {
      id: "id",
      code: "code",
      name: "name",
      phone: "phone",
      address: "address",
      createdAt: "created_at",
      deletedAt: "deleted_at",
      tableName: "customers",
      _: { name: "customers" },
    },
    ordersTable: {
      id: "id",
      code: "code",
      customerId: "customer_id",
      customerName: "customer_name",
      userId: "user_id",
      repName: "rep_name",
      total: "total",
      status: "status",
      items: "items",
      createdAt: "created_at",
      deletedAt: "deleted_at",
      tableName: "orders",
      _: { name: "orders" },
    },
  };
}
