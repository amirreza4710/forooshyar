import { Router, type Request } from "express";
import crypto from "crypto";
import { db, deliveriesTable, ordersTable, productsTable, usersTable } from "@workspace/db";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { requireAuth, type JwtPayload } from "../lib/auth";
import {
  AssignDeliveryBody,
  CompleteDeliveryBody,
  CompleteDeliveryParams,
  GetLoadingSheetQueryParams,
  ListDeliveriesQueryParams,
} from "@workspace/api-zod";
import { logAudit } from "../lib/audit";
import { broadcast } from "../lib/notifications";
import { adjustOrderStock } from "../lib/inventory";
import { isAdminRole, isSupervisorOrAdminRole, syncCustomerBalance } from "../lib/ledger";
import { invalidateDashboardCache } from "./dashboard";

const router = Router();

interface ReturnedItemShape {
  productId: number;
  productName: string;
  qty: number;
  price: number;
  restock?: boolean;
}

function serializeDelivery(d: typeof deliveriesTable.$inferSelect) {
  const rawReturned = Array.isArray(d.returnedItems)
    ? (d.returnedItems as ReturnedItemShape[])
    : [];
  return {
    ...d,
    returnedItems: rawReturned.map((item) => ({
      ...item,
      restock: item.restock ?? true,
    })),
    deliveredAt: d.deliveredAt ? d.deliveredAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/deliveries", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const parsed = ListDeliveriesQueryParams.safeParse(req.query);
  const conditions = [isNull(deliveriesTable.deletedAt)];

  if (user.role === "موزع / راننده") {
    conditions.push(eq(deliveriesTable.driverId, user.id));
  } else if (parsed.success && parsed.data.driverId) {
    conditions.push(eq(deliveriesTable.driverId, parsed.data.driverId));
  }

  if (parsed.success && parsed.data.status) {
    conditions.push(eq(deliveriesTable.status, parsed.data.status));
  }

  const rows = await db
    .select()
    .from(deliveriesTable)
    .where(and(...conditions))
    .orderBy(desc(deliveriesTable.createdAt));

  res.json(rows.map(serializeDelivery));
});

router.get("/deliveries/loading-sheet", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const parsed = GetLoadingSheetQueryParams.safeParse(req.query);

  const conditions = [
    isNull(deliveriesTable.deletedAt),
    inArray(deliveriesTable.status, ["ASSIGNED", "OUT_FOR_DELIVERY"]),
  ];

  if (user.role === "موزع / راننده") {
    conditions.push(eq(deliveriesTable.driverId, user.id));
  } else if (parsed.success && parsed.data.driverId) {
    conditions.push(eq(deliveriesTable.driverId, parsed.data.driverId));
  }

  const activeDeliveries = await db
    .select({ orderId: deliveriesTable.orderId })
    .from(deliveriesTable)
    .where(and(...conditions));

  const orderIds = Array.from(new Set(activeDeliveries.map((d) => d.orderId)));
  if (orderIds.length === 0) {
    res.json([]);
    return;
  }

  const [orders, products] = await Promise.all([
    db
      .select({ items: ordersTable.items })
      .from(ordersTable)
      .where(and(inArray(ordersTable.id, orderIds), isNull(ordersTable.deletedAt))),
    db
      .select({ id: productsTable.id, name: productsTable.name, unitsPerPack: productsTable.unitsPerPack })
      .from(productsTable)
      .where(isNull(productsTable.deletedAt)),
  ]);

  const productPackMap = new Map<number, { name: string; unitsPerPack: number }>();
  for (const p of products) {
    productPackMap.set(p.id, {
      name: p.name,
      unitsPerPack: Math.max(1, p.unitsPerPack || 1),
    });
  }

  const totalsMap = new Map<number, { productName: string; totalQty: number }>();
  for (const order of orders) {
    const items = Array.isArray(order.items)
      ? (order.items as Array<{ productId: number; productName: string; qty: number }>)
      : [];
    for (const item of items) {
      if (!item || typeof item.productId !== "number" || typeof item.qty !== "number") continue;
      const current = totalsMap.get(item.productId);
      if (current) {
        current.totalQty += item.qty;
      } else {
        totalsMap.set(item.productId, {
          productName: productPackMap.get(item.productId)?.name || item.productName,
          totalQty: item.qty,
        });
      }
    }
  }

  const sheet = Array.from(totalsMap.entries()).map(([productId, info]) => {
    const unitsPerPack = productPackMap.get(productId)?.unitsPerPack ?? 1;
    return {
      productId,
      productName: info.productName,
      totalQty: info.totalQty,
      packsCount: Math.floor(info.totalQty / unitsPerPack),
      remainderUnits: info.totalQty % unitsPerPack,
    };
  });

  res.json(sheet);
});

router.post("/deliveries", requireAuth, async (req, res): Promise<void> => {
  const parsed = AssignDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { orderId, driverId } = parsed.data;
  const user = (req as Request & { user: JwtPayload }).user;

  const delivery = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), isNull(ordersTable.deletedAt)));

    if (!order) {
      throw Object.assign(new Error("سفارش مورد نظر یافت نشد"), { status: 404 });
    }
    if (order.status === "لغو شده") {
      throw Object.assign(new Error("امکان تخصیص سفارش لغوشده به ناوگان پخش وجود ندارد"), {
        status: 400,
      });
    }

    const existingActive = await tx
      .select({ id: deliveriesTable.id, status: deliveriesTable.status })
      .from(deliveriesTable)
      .where(and(eq(deliveriesTable.orderId, orderId), isNull(deliveriesTable.deletedAt)));

    if (existingActive.some((d) => d.status !== "FAILED")) {
      throw Object.assign(new Error("برای این سفارش قبلاً حواله ارسال فعال ثبت شده است"), {
        status: 409,
      });
    }

    const [driver] = await tx
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, driverId), isNull(usersTable.deletedAt)));

    if (!driver) {
      throw Object.assign(new Error("راننده/موزع مورد نظر یافت نشد"), { status: 404 });
    }

    if (order.status === "در انتظار") {
      await tx
        .update(ordersTable)
        .set({ status: "تایید شده" })
        .where(eq(ordersTable.id, order.id));
    }

    const [created] = await tx
      .insert(deliveriesTable)
      .values({
        code: `pending-${crypto.randomUUID()}`,
        orderId: order.id,
        orderCode: order.code,
        customerId: order.customerId,
        customerName: order.customerName,
        driverId: driver.id,
        driverName: driver.name,
        status: "ASSIGNED",
        returnedItems: [],
        returnedAmount: 0,
      })
      .returning();

    const [final] = await tx
      .update(deliveriesTable)
      .set({ code: `DLV-${String(created!.id).padStart(4, "0")}` })
      .where(eq(deliveriesTable.id, created!.id))
      .returning();

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "DELIVERY_ASSIGN",
      entity: "delivery",
      entityId: String(final!.id),
      details: { code: final!.code, orderId, driverId, driverName: driver.name },
      ipAddress: req.ip || null,
    });

    return final!;
  });

  invalidateDashboardCache();

  broadcast({
    type: "delivery_assigned",
    message: `حواله ${delivery.code} برای سفارش ${delivery.orderCode} به ${delivery.driverName} تخصیص یافت`,
    actor: user.name,
    meta: { deliveryId: delivery.id, orderId: delivery.orderId, driverId: delivery.driverId },
  });

  res.status(201).json(serializeDelivery(delivery));
});

router.patch("/deliveries/:id", requireAuth, async (req, res): Promise<void> => {
  const params = CompleteDeliveryParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = CompleteDeliveryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const { status, returnedItems, signatureNote } = body.data;

  const updated = await db.transaction(async (tx) => {
    // قفل سطری حواله توزیع (Row-Level Locking) جهت جلوگیری از نهایی‌سازی همزمان
    const lockedDeliveries = await tx.execute(
      sql`SELECT id, code, order_id, order_code, customer_id, customer_name, driver_id, driver_name, status, returned_items, returned_amount, signature_note, delivered_at, created_at FROM deliveries WHERE id = ${params.data.id} AND deleted_at IS NULL FOR UPDATE`,
    );
    const rawDelivery = lockedDeliveries.rows[0] as
      | {
          id: number;
          code: string;
          order_id: number;
          order_code: string;
          customer_id: number;
          customer_name: string;
          driver_id: number;
          driver_name: string;
          status: string;
          returned_items: unknown;
          returned_amount: number;
          signature_note: string | null;
          delivered_at: Date | null;
          created_at: Date;
        }
      | undefined;

    if (!rawDelivery) return null;

    const existing = {
      id: rawDelivery.id,
      code: rawDelivery.code,
      orderId: rawDelivery.order_id,
      orderCode: rawDelivery.order_code,
      customerId: rawDelivery.customer_id,
      customerName: rawDelivery.customer_name,
      driverId: rawDelivery.driver_id,
      driverName: rawDelivery.driver_name,
      status: rawDelivery.status,
      returnedItems: rawDelivery.returned_items,
      returnedAmount: Number(rawDelivery.returned_amount || 0),
      signatureNote: rawDelivery.signature_note,
      deliveredAt: rawDelivery.delivered_at,
      createdAt: rawDelivery.created_at,
    };

    // گارد دسترسی: فقط مدیران، سرپرستان و راننده اختصاص‌یافته به این حواله مجاز به به‌روزرسانی هستند
    const canUpdate =
      isSupervisorOrAdminRole(user.role) || existing.driverId === user.id;
    if (!canUpdate) {
      throw Object.assign(
        new Error("شما مجاز به تغییر وضعیت این حواله ارسال نیستید"),
        { status: 403 },
      );
    }

    if (existing.status === "DELIVERED" || existing.status === "PARTIAL_RETURN") {
      throw Object.assign(new Error("این مرسوله قبلاً نهایی شده است"), { status: 409 });
    }

    // قفل سطری سفارش مرتبط
    const lockedOrders = await tx.execute(
      sql`SELECT id, customer_id, status, total, subtotal, discount, items FROM orders WHERE id = ${existing.orderId} AND deleted_at IS NULL FOR UPDATE`,
    );
    const rawOrder = lockedOrders.rows[0] as
      | {
          id: number;
          customer_id: number;
          status: string;
          total: number;
          subtotal: number;
          discount: number;
          items: unknown;
        }
      | undefined;

    if (!rawOrder) {
      throw Object.assign(new Error("سفارش مرتبط با این مرسوله یافت نشد"), { status: 404 });
    }

    const order = {
      id: rawOrder.id,
      customerId: rawOrder.customer_id,
      status: rawOrder.status,
      total: Number(rawOrder.total || 0),
      subtotal: Number(rawOrder.subtotal || 0),
      discount: Number(rawOrder.discount || 0),
      items: rawOrder.items,
    };

    // نرمال‌سازی اقلام سفارش جهت تعیین قیمت معتبر سروری، تفکیک اقلام فروشی و اشانتیون
    const orderItems = Array.isArray(order.items)
      ? (order.items as Array<{ productId: number; productName: string; qty: number; price: number; isBonus?: boolean }>)
      : [];

    const orderProductMap = new Map<number, {
      productName: string;
      paidQty: number;
      paidUnitPrice: number;
      bonusQty: number;
      totalOrderedQty: number;
    }>();

    for (const oi of orderItems) {
      if (!oi || typeof oi.productId !== "number") continue;
      const current = orderProductMap.get(oi.productId) || {
        productName: oi.productName || "کالا",
        paidQty: 0,
        paidUnitPrice: 0,
        bonusQty: 0,
        totalOrderedQty: 0,
      };
      if (oi.isBonus || oi.price === 0) {
        current.bonusQty += Number(oi.qty || 0);
      } else {
        current.paidQty += Number(oi.qty || 0);
        current.paidUnitPrice = Number(oi.price || 0);
      }
      current.totalOrderedQty = current.paidQty + current.bonusQty;
      orderProductMap.set(oi.productId, current);
    }

    const rawReturns = returnedItems ?? [];
    for (const item of rawReturns) {
      if (item.qty <= 0 || item.price < 0) {
        throw Object.assign(new Error("تعداد یا قیمت اقلام مرجوعی نامعتبر است"), { status: 400 });
      }
    }

    if (status === "PARTIAL_RETURN" && rawReturns.length === 0) {
      throw Object.assign(new Error("برای ثبت مرجوعی جزئی، حداقل یک قلم کالا لازم است"), {
        status: 400,
      });
    }

    // تجمیع تعداد مرجوعی به ازای هر کالا جهت جلوگیری از دور زدن سقف با ردیف‌های تکراری
    const returnedQtyByProduct = new Map<number, number>();
    for (const ret of rawReturns) {
      returnedQtyByProduct.set(
        ret.productId,
        (returnedQtyByProduct.get(ret.productId) || 0) + ret.qty,
      );
    }

    // بررسی سقف تعداد سفارش و محاسبه مبلغ بستانکاری بر اساس تفکیک فروشی و اشانتیون
    let totalCalculatedReturnAmount = 0;
    for (const [productId, totalReturnedQty] of returnedQtyByProduct.entries()) {
      const orderProd = orderProductMap.get(productId);
      if (!orderProd) {
        throw Object.assign(
          new Error(`کالای مرجوعی با شناسه ${productId} در اقلام سفارش اصلی وجود ندارد`),
          { status: 400 },
        );
      }
      if (totalReturnedQty > orderProd.totalOrderedQty) {
        throw Object.assign(
          new Error(
            `تعداد مرجوعی کالای «${orderProd.productName}» (${totalReturnedQty}) نمی‌تواند بیشتر از تعداد سفارش داده‌شده (${orderProd.totalOrderedQty}) باشد`,
          ),
          { status: 400 },
        );
      }

      // محاسبه بستانکاری مالی: حداکثر تا سقف اقلام فروشی با قیمت واحد اصلی، اقلام اشانتیون قیمت صفر دارند
      const creditedPaidUnits = Math.min(totalReturnedQty, orderProd.paidQty);
      totalCalculatedReturnAmount += creditedPaidUnits * orderProd.paidUnitPrice;
    }

    // تنظیم قیمت و نام اقلام بر اساس داده‌های قطعی سفارش اصلی (رد قیمت دستکاری‌شده کاربر)
    const normalizedReturns: ReturnedItemShape[] = rawReturns.map((item) => {
      const orderProd = orderProductMap.get(item.productId);
      return {
        productId: item.productId,
        productName: orderProd?.productName || item.productName,
        qty: item.qty,
        price: orderProd?.paidUnitPrice ?? 0,
        restock: item.restock ?? true,
      };
    });

    const returnedAmount = totalCalculatedReturnAmount;

    if (returnedAmount > order.total) {
      throw Object.assign(
        new Error("مبلغ مرجوعی نمی‌تواند بیشتر از مبلغ کل سفارش باشد"),
        { status: 400 },
      );
    }

    if (status === "PARTIAL_RETURN") {
      const restockItems = normalizedReturns.filter((item) => item.restock !== false);
      if (restockItems.length > 0) {
        await adjustOrderStock(tx, restockItems, "restore");
      }

      const nextTotal = Math.max(0, order.total - returnedAmount);
      await tx
        .update(ordersTable)
        .set({ total: nextTotal, status: "تکمیل شده" })
        .where(eq(ordersTable.id, order.id));

      await syncCustomerBalance(tx, existing.customerId);
    } else if (status === "DELIVERED") {
      await tx
        .update(ordersTable)
        .set({ status: "تکمیل شده" })
        .where(eq(ordersTable.id, order.id));
    }

    const deliveredAt =
      status === "DELIVERED" || status === "PARTIAL_RETURN" ? new Date() : existing.deliveredAt;

    const [saved] = await tx
      .update(deliveriesTable)
      .set({
        status,
        returnedItems: normalizedReturns as unknown as object,
        returnedAmount: status === "PARTIAL_RETURN" ? returnedAmount : existing.returnedAmount,
        signatureNote: signatureNote !== undefined ? signatureNote : existing.signatureNote,
        deliveredAt,
      })
      .where(eq(deliveriesTable.id, existing.id))
      .returning();

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "DELIVERY_UPDATE",
      entity: "delivery",
      entityId: String(saved!.id),
      details: {
        code: saved!.code,
        status,
        returnedAmount,
        restockedCount: normalizedReturns.filter((i) => i.restock !== false).length,
      },
      ipAddress: req.ip || null,
    });

    return saved!;
  });

  if (!updated) {
    res.status(404).json({ error: "حواله ارسال یافت نشد" });
    return;
  }

  invalidateDashboardCache();

  broadcast({
    type: "delivery_updated",
    message: `وضعیت مرسوله ${updated.code} به «${status}» تغییر یافت`,
    actor: user.name,
    meta: { deliveryId: updated.id, status: updated.status, returnedAmount: updated.returnedAmount },
  });

  res.json(serializeDelivery(updated));
});

export default router;
