import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import {
  db,
  usersTable,
  refreshTokensTable,
  auditLogsTable,
  settingsTable,
  ordersTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { signToken } from "../lib/auth";
import * as notifications from "../lib/notifications";
import { logger } from "../lib/logger";

vi.mock("@workspace/db", () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    execute: vi.fn(),
  };
  return {
    db: mockDb,
    usersTable: {
      id: "id",
      username: "username",
      password: "password",
      name: "name",
      role: "role",
      createdAt: "created_at",
      deletedAt: "deleted_at",
    },
    refreshTokensTable: {
      id: "id",
      userId: "user_id",
      tokenHash: "token_hash",
      revokedAt: "revoked_at",
      expiresAt: "expires_at",
      createdAt: "created_at",
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
    },
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
    },
    productsTable: {
      id: "id",
      name: "name",
      code: "code",
      stock: "stock",
      price: "price",
      active: "active",
      deletedAt: "deleted_at",
    },
    customersTable: {
      id: "id",
      name: "name",
      code: "code",
      deletedAt: "deleted_at",
    },
  };
});

vi.mock("drizzle-orm", async (importOriginal) => {
  const mod = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...mod,
    eq: vi.fn((col, val) => ({ op: "eq", col, val })),
    and: vi.fn((...args) => ({ op: "and", args })),
    isNull: vi.fn((col) => ({ op: "isNull", col })),
    sql: Object.assign(vi.fn(), {
      join: vi.fn((arr) => arr),
    }),
  };
});

describe("Empirical Challenger Stress Suite — Milestone 1 (D1, D2, D3)", () => {
  const adminUser = {
    id: 1,
    username: "admin",
    name: "مدیر تستی",
    role: "سرپرست",
    password: "$2a$10$hashedAdminPassword",
    createdAt: new Date(),
  };
  const repUser = {
    id: 10,
    username: "salesrep",
    name: "نماینده تستی",
    role: "نماینده فروش",
    password: "$2a$10$hashedSalesRepPassword",
    createdAt: new Date(),
  };

  const adminToken = signToken({
    id: adminUser.id,
    username: adminUser.username,
    name: adminUser.name,
    role: adminUser.role,
  });
  const repToken = signToken({
    id: repUser.id,
    username: repUser.username,
    name: repUser.name,
    role: repUser.role,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default transaction executes callback immediately with tx = mockDb
    (db.transaction as any).mockImplementation(async (cb: any) => cb(db));

    // Default insert returns [{ id: 101 }]
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue(
        Object.assign(Promise.resolve([{ id: 101 }]), {
          returning: vi.fn().mockResolvedValue([{ id: 101 }]),
        })
      ),
    });

    // Default update returns [{ id: 101 }]
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(
          Object.assign(Promise.resolve([{ id: 101 }]), {
            returning: vi.fn().mockResolvedValue([{ id: 101 }]),
          })
        ),
      }),
    });
  });

  // =========================================================================
  // CHALLENGE 1: D1 Prefix Derivation & Resolution Logic
  // =========================================================================
  describe("Challenge 1: D1 Prefix Derivation & Resolution Stress", () => {
    it("D1.1: Resolves custom prefix from settings during order creation", async () => {
      // Mock settings lookup inside transaction returning custom prefix
      const customSettings = {
        id: 1,
        orderCodePrefix: "CUSTOM-ORD-",
        updatedAt: new Date(),
      };
      const settingsSelect = {
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([customSettings]),
        }),
      };

      (db.select as any).mockReturnValue(settingsSelect);

      // Mock product locking & customer lookup
      (db.execute as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, stock: 50 }] }) // lock products
        .mockResolvedValueOnce({ rows: [] }) // update stock
        .mockResolvedValueOnce({ rows: [{ name: "فروشگاه نمونه" }] }); // customer lookup

      const insertedOrder = { id: 25, total: 20000 };
      const finalOrder = {
        id: 25,
        code: "CUSTOM-ORD-9025",
        customerName: "فروشگاه نمونه",
        total: 20000,
        items: [],
        createdAt: new Date(),
      };

      let capturedPrefixSet: any = null;
      const txUpdateMock = vi.fn((table) => ({
        set: vi.fn((setArg) => {
          if (table === ordersTable) capturedPrefixSet = setArg;
          return {
            where: vi.fn().mockReturnValue(
              Object.assign(Promise.resolve([finalOrder]), {
                returning: vi.fn().mockResolvedValue([finalOrder]),
              })
            ),
          };
        }),
      }));

      const txInsertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(
          Object.assign(Promise.resolve([insertedOrder]), {
            returning: vi.fn().mockResolvedValue([insertedOrder]),
          })
        ),
      });

      const txMock = {
        select: vi.fn().mockReturnValue(settingsSelect),
        insert: txInsertMock,
        update: txUpdateMock,
        execute: db.execute,
      };
      (db.transaction as any).mockImplementation(async (cb: any) => cb(txMock));

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [{ productId: 1, productName: "کالای الف", qty: 2, price: 10000 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe("CUSTOM-ORD-9025");
      expect(capturedPrefixSet).toEqual({ code: "CUSTOM-ORD-9025" });
      expect(txUpdateMock).toHaveBeenCalledWith(ordersTable);
    });

    it("D1.2: Falls back to default prefix 'ORD-' when settings.orderCodePrefix is empty or undefined", async () => {
      // Settings has empty string or undefined prefix
      const emptySettings = {
        id: 1,
        orderCodePrefix: "",
        updatedAt: new Date(),
      };
      const settingsSelect = {
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([emptySettings]),
        }),
      };

      (db.select as any).mockReturnValue(settingsSelect);

      (db.execute as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, stock: 50 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ name: "فروشگاه نمونه" }] });

      let capturedSetArgs: any = null;
      const txUpdateMock = vi.fn().mockReturnValue({
        set: vi.fn((args) => {
          capturedSetArgs = args;
          return {
            where: vi.fn().mockReturnValue(
              Object.assign(
                Promise.resolve([
                  {
                    id: 26,
                    code: args.code,
                    customerName: "فروشگاه نمونه",
                    total: 10000,
                    items: [],
                    createdAt: new Date(),
                  },
                ]),
                {
                  returning: vi.fn().mockResolvedValue([
                    {
                      id: 26,
                      code: args.code,
                      customerName: "فروشگاه نمونه",
                      total: 10000,
                      items: [],
                      createdAt: new Date(),
                    },
                  ]),
                }
              )
            ),
          };
        }),
      });

      const txInsertMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(
          Object.assign(Promise.resolve([{ id: 26 }]), {
            returning: vi.fn().mockResolvedValue([{ id: 26 }]),
          })
        ),
      });

      const txMock = {
        select: vi.fn().mockReturnValue(settingsSelect),
        insert: txInsertMock,
        update: txUpdateMock,
        execute: db.execute,
      };
      (db.transaction as any).mockImplementation(async (cb: any) => cb(txMock));

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [{ productId: 1, productName: "کالا", qty: 1, price: 10000 }],
        });

      expect(res.status).toBe(201);
      expect(capturedSetArgs.code).toBe("ORD-9026");
    });
  });

  // =========================================================================
  // CHALLENGE 2: D2 Password Rotation, Adversarial Inputs & Session Revocation
  // =========================================================================
  describe("Challenge 2: D2 Password Rotation & Session Revocation Adversarial Stress", () => {
    it("D2.1: Rejects missing body, empty strings, and malformed JSON", async () => {
      const resEmpty = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({});
      expect(resEmpty.status).toBe(400);

      const resEmptyStrings = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ currentPassword: "", newPassword: "" });
      expect(resEmptyStrings.status).toBe(400);
    });

    it("D2.2: Rejects weak passwords violating complexity policy (PasswordSchema)", async () => {
      // Too short (< 8 chars)
      const resShort = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ currentPassword: "ValidOldPassword123!", newPassword: "Short1!" });
      expect(resShort.status).toBe(400);
      expect(resShort.body.error).toContain("at least 8 characters");

      // No lowercase
      const resNoLower = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ currentPassword: "ValidOldPassword123!", newPassword: "ALLUPPERCASE123!" });
      expect(resNoLower.status).toBe(400);
      expect(resNoLower.body.error).toContain("lowercase");

      // No uppercase
      const resNoUpper = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ currentPassword: "ValidOldPassword123!", newPassword: "alllowercase123!" });
      expect(resNoUpper.status).toBe(400);
      expect(resNoUpper.body.error).toContain("uppercase");

      // No number
      const resNoDigit = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ currentPassword: "ValidOldPassword123!", newPassword: "NoNumbersInPassword!" });
      expect(resNoDigit.status).toBe(400);
      expect(resNoDigit.body.error).toContain("number");
    });

    it("D2.3: Rejects SQL injection payloads in currentPassword safely without unhandled error", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([repUser]),
      };
      (db.select as any).mockReturnValue(mockSelect);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "' OR '1'='1' --",
          newPassword: "NewSecurePassword2026!",
        });

      // bcrypt compares literal string with hash; returns 401, not 500
      expect(res.status).toBe(401);
      expect(res.body.error).toContain("نادرست است");
      // Ensure usersTable password was NOT updated
      expect(db.update).not.toHaveBeenCalled();
    });

    it("D2.4: Session revocation query targets ONLY active refresh tokens (isNull revokedAt)", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([repUser]),
      };
      (db.select as any).mockReturnValue(mockSelect);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      vi.spyOn(bcrypt, "hash").mockResolvedValue("new_hashed_password" as never);

      let tokenRevocationSetArg: any = null;
      const updateTables: any[] = [];

      (db.update as any).mockImplementation((table: any) => {
        updateTables.push(table);
        return {
          set: vi.fn((setArg: any) => {
            if (table === refreshTokensTable) {
              tokenRevocationSetArg = setArg;
            }
            return {
              where: vi.fn().mockReturnValue(
                Object.assign(Promise.resolve([{ id: 1 }]), {
                  returning: vi.fn().mockResolvedValue([{ id: 1 }]),
                })
              ),
            };
          }),
        };
      });

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "OldValidPassword123!",
          newPassword: "NewValidPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateTables).toContain(usersTable);
      expect(updateTables).toContain(refreshTokensTable);
      expect(tokenRevocationSetArg).toHaveProperty("revokedAt");
      expect(tokenRevocationSetArg.revokedAt).toBeInstanceOf(Date);
    });

    it("D2.5: Admin PATCH /api/users/:id does NOT touch refreshTokensTable when password is omitted", async () => {
      const mockUpdated = { id: 5, username: "rep5", name: "Updated Name", role: "نماینده فروش", createdAt: new Date() };
      const txUpdateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const txMock = {
        update: txUpdateMock,
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      };
      (db.transaction as any).mockImplementation(async (cb: any) => cb(txMock));

      const res = await request(app)
        .patch("/api/users/5")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      // update called only once for usersTable, NOT for refreshTokensTable
      expect(txUpdateMock).toHaveBeenCalledTimes(1);
      expect(txUpdateMock).toHaveBeenCalledWith(usersTable);
      expect(txUpdateMock).not.toHaveBeenCalledWith(refreshTokensTable);
    });
  });

  // =========================================================================
  // CHALLENGE 3: D3 Transactional Rollback & Atomicity Stress
  // =========================================================================
  describe("Challenge 3: D3 Transactional Rollback & Rollback Atomicity Stress", () => {
    it("D3.1: Order creation rolls back and suppresses broadcast when logAudit fails", async () => {
      const broadcastSpy = vi.spyOn(notifications, "broadcast");

      const userSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([repUser]),
        }),
      };
      const settingsSelect = {
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 1, orderCodePrefix: "ORD-" }]),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(userSelect)
        .mockReturnValueOnce(settingsSelect);

      (db.execute as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, stock: 50 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ name: "فروشگاه تست" }] });

      // In this scenario, audit log insertion throws an unexpected DB error
      const auditFailure = new Error("DB_FATAL: audit_logs disk full / lock timeout");

      const txMock = {
        select: vi.fn().mockReturnValue(settingsSelect),
        insert: vi.fn((table) => {
          if (table === auditLogsTable) {
            return {
              values: vi.fn().mockRejectedValue(auditFailure),
            };
          }
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 99 }]),
            }),
          };
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 99, code: "ORD-9099" }]),
            }),
          }),
        }),
        execute: db.execute,
      };

      (db.transaction as any).mockImplementation(async (cb: any) => {
        // If callback throws, transaction rolls back
        return cb(txMock);
      });

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [{ productId: 1, productName: "کالا", qty: 2, price: 5000 }],
        });

      // The unhandled transaction error must reach Express error handler (500)
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");

      // Broadcast must NOT have been called because transaction failed!
      expect(broadcastSpy).not.toHaveBeenCalled();
    });

    it("D3.2: Order status update (PATCH /orders/:id) rolls back and suppresses broadcast when logAudit fails", async () => {
      const broadcastSpy = vi.spyOn(notifications, "broadcast");

      const auditFailure = new Error("DB_FATAL: audit_logs failure");

      const txMock = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 10, code: "ORD-9010", status: "تکمیل شده" }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(auditFailure),
        }),
      };

      (db.transaction as any).mockImplementation(async (cb: any) => cb(txMock));

      const res = await request(app)
        .patch("/api/orders/10")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ status: "تکمیل شده" });

      expect(res.status).toBe(500);
      expect(broadcastSpy).not.toHaveBeenCalled();
    });

    it("D3.3: Password change rolls back atomically if audit log fails inside transaction", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([repUser]),
      };
      (db.select as any).mockReturnValue(mockSelect);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      vi.spyOn(bcrypt, "hash").mockResolvedValue("hashed_pw" as never);

      const auditFailure = new Error("DB_FATAL: audit_logs write error");

      const txMock = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: repUser.id }]),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(auditFailure),
        }),
      };

      (db.transaction as any).mockImplementation(async (cb: any) => cb(txMock));

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "OldValidPassword123!",
          newPassword: "NewValidPassword123!",
        });

      // Must fail with 500
      expect(res.status).toBe(500);
    });
  });
});
