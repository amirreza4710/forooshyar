import { Router, type Request } from "express";
import { db, collectionsTable, ordersTable, targetsTable, usersTable } from "@workspace/db";
import { and, eq, isNull, ne } from "drizzle-orm";
import { requireAuth, type JwtPayload } from "../lib/auth";
import { canViewAllOrders } from "../lib/ledger";

const router = Router();

router.get("/commissions/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const userConditions = [isNull(usersTable.deletedAt)];

  if (!canViewAllOrders(user.role)) {
    userConditions.push(eq(usersTable.id, user.id));
  }

  const [users, orders, clearedCollections, targets] = await Promise.all([
    db.select().from(usersTable).where(and(...userConditions)),
    db
      .select({ userId: ordersTable.userId, total: ordersTable.total, items: ordersTable.items })
      .from(ordersTable)
      .where(and(isNull(ordersTable.deletedAt), ne(ordersTable.status, "لغو شده"))),
    db
      .select({ userId: collectionsTable.userId, amount: collectionsTable.amount })
      .from(collectionsTable)
      .where(and(isNull(collectionsTable.deletedAt), eq(collectionsTable.status, "CLEARED"))),
    db
      .select()
      .from(targetsTable)
      .where(isNull(targetsTable.deletedAt)),
  ]);

  const salesByUser = new Map<number, { amount: number; qty: number }>();
  for (const order of orders) {
    if (!order.userId) continue;
    const prev = salesByUser.get(order.userId) ?? { amount: 0, qty: 0 };
    const items = Array.isArray(order.items) ? (order.items as Array<{ qty?: number }>) : [];
    const orderQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    salesByUser.set(order.userId, {
      amount: prev.amount + (Number(order.total) || 0),
      qty: prev.qty + orderQty,
    });
  }

  const collectionsByUser = new Map<number, number>();
  for (const col of clearedCollections) {
    collectionsByUser.set(
      col.userId,
      (collectionsByUser.get(col.userId) ?? 0) + (Number(col.amount) || 0),
    );
  }

  const targetsByUser = new Map<number, { targetAmount: number; targetQuantity: number }>();
  for (const t of targets) {
    const prev = targetsByUser.get(t.userId) ?? { targetAmount: 0, targetQuantity: 0 };
    targetsByUser.set(t.userId, {
      targetAmount: prev.targetAmount + (Number(t.targetAmount) || 0),
      targetQuantity: prev.targetQuantity + (Number(t.targetQuantity) || 0),
    });
  }

  const results = users
    .filter(
      (u) =>
        u.role.includes("نماینده") ||
        u.role.includes("فروش") ||
        salesByUser.has(u.id) ||
        collectionsByUser.has(u.id) ||
        targetsByUser.has(u.id),
    )
    .map((u) => {
      const sales = salesByUser.get(u.id) ?? { amount: 0, qty: 0 };
      const clearedCollectionsTotal = collectionsByUser.get(u.id) ?? 0;
      const target = targetsByUser.get(u.id);

      let targetAchievementRate = 0;
      if (target && target.targetAmount > 0) {
        targetAchievementRate = Math.round((sales.amount / target.targetAmount) * 10000) / 100;
      } else if (target && target.targetQuantity > 0) {
        targetAchievementRate = Math.round((sales.qty / target.targetQuantity) * 10000) / 100;
      }

      // پلکان پورسانت: پایه ۲٪ روی وصولی تسویه‌شده؛ در صورت تحقق ≥۱۰۰٪ تارگت، ارتقا به ۳٪
      const commissionRate = targetAchievementRate >= 100 ? 3 : 2;
      const earnedCommission = Math.round(clearedCollectionsTotal * (commissionRate / 100));

      return {
        userId: u.id,
        repName: u.name,
        validSalesTotal: sales.amount,
        clearedCollectionsTotal,
        commissionRate,
        earnedCommission,
        targetAchievementRate,
      };
    })
    .sort((a, b) => b.earnedCommission - a.earnedCommission || b.validSalesTotal - a.validSalesTotal);

  res.json(results);
});

export default router;
