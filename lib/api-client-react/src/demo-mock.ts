function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseBody(body: unknown): Record<string, any> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body as Record<string, any>;
}

const nowIso = () => new Date().toISOString();

const DEMO_USERS = [
  {
    id: 1,
    username: "امیررضا",
    name: "امیررضا",
    role: "مدیر عامل",
    phone: "09121112233",
    assignedZone: null,
  },
  {
    id: 2,
    username: "امیرمحمد",
    name: "امیرمحمد",
    role: "ویزیتور / نماینده فروش",
    phone: "09124445566",
    assignedZone: "منطقه شمال",
  },
  {
    id: 3,
    username: "حسام",
    name: "حسام",
    role: "مدیر فروش",
    phone: "09127778899",
    assignedZone: null,
  },
  {
    id: 4,
    username: "رضا",
    name: "رضا مرادی",
    role: "موزع / راننده",
    phone: "09129991122",
    assignedZone: "منطقه شمال",
  },
];

const DEMO_ORDERS = [
  {
    id: 1,
    code: "ORD-9001",
    customerId: 1,
    customerName: "فروشگاه نمونه ۱",
    userId: 2,
    repName: "امیرمحمد",
    visitId: 1,
    subtotal: 5_000_000,
    discount: 0,
    total: 5_000_000,
    paymentMethod: "CASH",
    notes: "تحویل فوری",
    status: "تایید شده",
    items: [
      {
        productId: 1,
        productName: "روغن سرخ‌کردنی ۱.۵ لیتری",
        qty: 10,
        price: 500_000,
        isBonus: false,
      },
    ],
  },
];

const DEMO_COLLECTIONS = [
  {
    id: 1,
    code: "COL-0001",
    customerId: 1,
    customerName: "فروشگاه نمونه ۱",
    orderId: 1,
    userId: 2,
    collectorName: "امیرمحمد",
    method: "CASH",
    amount: 2_000_000,
    chequeNumber: null,
    sayyadCode: null,
    dueDate: null,
    status: "CLEARED",
    notes: "پیش‌پرداخت نقدی",
  },
  {
    id: 2,
    code: "COL-0002",
    customerId: 2,
    customerName: "سوپرمارکت امید",
    orderId: null,
    userId: 2,
    collectorName: "امیرمحمد",
    method: "CHEQUE",
    amount: 3_000_000,
    chequeNumber: "849201",
    sayyadCode: "1648293019485721",
    dueDate: null,
    status: "PENDING",
    notes: "چک صیادی ۳۰ روزه",
  },
];

const DEMO_DELIVERIES = [
  {
    id: 1,
    code: "DLV-0001",
    orderId: 1,
    orderCode: "ORD-9001",
    customerId: 1,
    customerName: "فروشگاه نمونه ۱",
    driverId: 4,
    driverName: "رضا مرادی",
    status: "ASSIGNED",
    returnedItems: [],
    returnedAmount: 0,
    signatureNote: null,
    deliveredAt: null,
  },
];

const DEMO_VISITS = [
  {
    id: 1,
    code: "VIS-0001",
    customerId: 1,
    customerName: "فروشگاه نمونه ۱",
    userId: 2,
    repName: "امیرمحمد",
    latitude: "35.6892",
    longitude: "51.3890",
    status: "COMPLETED",
    result: "ORDERED",
    notes: "سفارش هفتگی ثبت شد",
    orderId: 1,
  },
  {
    id: 2,
    code: "VIS-0002",
    customerId: 2,
    customerName: "سوپرمارکت امید",
    userId: 2,
    repName: "امیرمحمد",
    latitude: null,
    longitude: null,
    status: "IN_PROGRESS",
    result: null,
    notes: "در حال مذاکره با مدیر فروشگاه",
    orderId: null,
  },
];

const DEMO_TARGETS = [
  {
    id: 1,
    code: "TAR-0001",
    userId: 2,
    repName: "امیرمحمد",
    title: "تارگت فروش ماه جاری",
    targetType: "HYBRID",
    targetAmount: 20_000_000,
    targetQuantity: 50,
    achievedAmount: 5_000_000,
    achievedQuantity: 10,
    status: "IN_PROGRESS",
    achievementRate: 25,
    quantityAchievementRate: 20,
    notes: "تمرکز بر فروشگاه‌های زنجیره‌ای",
  },
];

export function createDemoMockResponse(
  url: string,
  method: string,
  body?: unknown,
): Response | null {
  const path = url.split("?")[0];
  const upperMethod = method.toUpperCase();
  const payload = parseBody(body);
  const ts = nowIso();

  if (path.endsWith("/api/auth/login") && upperMethod === "POST") {
    const { username, password } = payload;
    const matched =
      username === "admin" && password === "admin"
        ? DEMO_USERS[0]
        : password === "1234"
          ? DEMO_USERS.find((u) => u.username === username)
          : undefined;

    if (!matched) {
      const exists =
        username === "admin" || DEMO_USERS.some((u) => u.username === username);
      return jsonResponse(
        {
          error: exists ? "رمز عبور اشتباه است." : "کاربر یافت نشد.",
          message: exists ? "رمز عبور اشتباه است." : "کاربر یافت نشد.",
        },
        401,
      );
    }

    return jsonResponse({
      token: "demo-jwt-token-123456",
      user: { ...matched, createdAt: ts },
    });
  }

  if (path.endsWith("/api/auth/change-password") && upperMethod === "POST") {
    return jsonResponse({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد",
    });
  }

  if (path.endsWith("/api/auth/me")) {
    return jsonResponse({ ...DEMO_USERS[0], createdAt: ts });
  }

  if (path.includes("/api/notifications")) {
    return jsonResponse([
      {
        id: 1,
        title: "سفارش جدید",
        message: "سفارش شماره ORD-9001 با موفقیت ثبت گردید.",
        read: false,
        createdAt: ts,
      },
    ]);
  }

  if (path.endsWith("/api/dashboard/summary")) {
    return jsonResponse({
      totalSales: 15_000_000,
      grossProfit: 3_250_000,
      orderCount: 12,
      pendingOrdersCount: 3,
      customerCount: 45,
      productCount: 18,
      lowStockCount: 1,
      bouncedChequesCount: 0,
      recentOrders: DEMO_ORDERS.map((o) => ({ ...o, createdAt: ts })),
    });
  }

  if (
    path.endsWith("/api/dashboard/sales-chart") ||
    path.endsWith("/api/dashboard/chart")
  ) {
    return jsonResponse([
      { label: "شنبه", value: 2_100_000 },
      { label: "یکشنبه", value: 3_400_000 },
      { label: "دوشنبه", value: 1_900_000 },
      { label: "سه‌شنبه", value: 4_200_000 },
      { label: "چهارشنبه", value: 3_400_000 },
    ]);
  }

  if (path.endsWith("/api/visits/stats/summary")) {
    return jsonResponse({
      totalVisits: 2,
      completedVisits: 1,
      orderedVisits: 1,
      conversionRate: 100,
    });
  }

  if (path.includes("/api/visits")) {
    if (upperMethod === "POST") {
      return jsonResponse(
        {
          id: 99,
          code: "VIS-0099",
          customerId: Number(payload.customerId || 1),
          customerName: "فروشگاه نمونه ۱",
          userId: 1,
          repName: DEMO_USERS[0].name,
          checkIn: ts,
          checkOut: null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          status: "IN_PROGRESS",
          result: null,
          notes: payload.notes ?? null,
          orderId: null,
          createdAt: ts,
        },
        201,
      );
    }
    if (upperMethod === "PATCH") {
      return jsonResponse({
        ...DEMO_VISITS[1],
        status: payload.status ?? "COMPLETED",
        result: payload.result ?? "NO_ORDER",
        notes: payload.notes ?? DEMO_VISITS[1].notes,
        checkIn: ts,
        checkOut: ts,
        createdAt: ts,
      });
    }
    if (/\/api\/visits\/\d+$/.test(path)) {
      return jsonResponse({ ...DEMO_VISITS[0], checkIn: ts, checkOut: ts, createdAt: ts });
    }
    return jsonResponse(
      DEMO_VISITS.map((v) => ({
        ...v,
        checkIn: ts,
        checkOut: v.status === "COMPLETED" ? ts : null,
        createdAt: ts,
      })),
    );
  }

  if (path.endsWith("/api/targets/stats/summary")) {
    return jsonResponse({
      totalTargets: 1,
      inProgressTargets: 1,
      achievedTargets: 0,
      totalTargetAmount: 20_000_000,
      totalAchievedAmount: 5_000_000,
      overallAchievementRate: 25,
    });
  }

  if (path.includes("/api/targets")) {
    const start = new Date(Date.now() - 86_400_000 * 7).toISOString();
    const end = new Date(Date.now() + 86_400_000 * 23).toISOString();
    if (upperMethod === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (upperMethod === "POST") {
      return jsonResponse(
        {
          id: 99,
          code: "TAR-0099",
          userId: Number(payload.userId || 2),
          repName: DEMO_USERS[1].name,
          title: payload.title || "تارگت جدید",
          targetType: payload.targetType || "AMOUNT",
          targetAmount: Number(payload.targetAmount || 0),
          targetQuantity: Number(payload.targetQuantity || 0),
          achievedAmount: 0,
          achievedQuantity: 0,
          startDate: payload.startDate || start,
          endDate: payload.endDate || end,
          status: "IN_PROGRESS",
          achievementRate: 0,
          quantityAchievementRate: 0,
          notes: payload.notes ?? null,
          createdAt: ts,
        },
        201,
      );
    }
    if (upperMethod === "PATCH") {
      return jsonResponse({
        ...DEMO_TARGETS[0],
        ...payload,
        startDate: start,
        endDate: end,
        createdAt: ts,
      });
    }
    if (/\/api\/targets\/\d+$/.test(path)) {
      return jsonResponse({
        ...DEMO_TARGETS[0],
        startDate: start,
        endDate: end,
        createdAt: ts,
      });
    }
    return jsonResponse(
      DEMO_TARGETS.map((t) => ({
        ...t,
        startDate: start,
        endDate: end,
        createdAt: ts,
      })),
    );
  }

  if (path.endsWith("/api/collections/stats/summary")) {
    return jsonResponse({
      totalCollected: 2_000_000,
      pendingChequesAmount: 3_000_000,
      pendingChequesCount: 1,
      bouncedChequesAmount: 0,
      bouncedChequesCount: 0,
    });
  }

  if (path.includes("/api/collections")) {
    if (upperMethod === "DELETE") return new Response(null, { status: 204 });
    if (upperMethod === "POST") {
      return jsonResponse(
        {
          id: 99,
          code: "COL-0099",
          customerId: Number(payload.customerId || 1),
          customerName: "فروشگاه نمونه ۱",
          orderId: payload.orderId ?? null,
          userId: 1,
          collectorName: DEMO_USERS[0].name,
          method: payload.method || "CASH",
          amount: Number(payload.amount || 0),
          chequeNumber: payload.chequeNumber ?? null,
          sayyadCode: payload.sayyadCode ?? null,
          dueDate: payload.dueDate ?? null,
          status: payload.method === "CHEQUE" ? "PENDING" : "CLEARED",
          notes: payload.notes ?? null,
          createdAt: ts,
        },
        201,
      );
    }
    if (upperMethod === "PATCH") {
      return jsonResponse({
        ...DEMO_COLLECTIONS[1],
        status: payload.status ?? DEMO_COLLECTIONS[1].status,
        notes: payload.notes ?? DEMO_COLLECTIONS[1].notes,
        dueDate: ts,
        createdAt: ts,
      });
    }
    return jsonResponse(
      DEMO_COLLECTIONS.map((c) => ({
        ...c,
        dueDate: c.method === "CHEQUE" ? ts : null,
        createdAt: ts,
      })),
    );
  }

  if (path.endsWith("/api/deliveries/loading-sheet")) {
    return jsonResponse([
      {
        productId: 1,
        productName: "روغن سرخ‌کردنی ۱.۵ لیتری",
        totalQty: 14,
        packsCount: 1,
        remainderUnits: 2,
      },
    ]);
  }

  if (path.includes("/api/deliveries")) {
    if (upperMethod === "POST") {
      return jsonResponse(
        {
          ...DEMO_DELIVERIES[0],
          id: 99,
          code: "DLV-0099",
          orderId: Number(payload.orderId || 1),
          driverId: Number(payload.driverId || 4),
          createdAt: ts,
        },
        201,
      );
    }
    if (upperMethod === "PATCH") {
      return jsonResponse({
        ...DEMO_DELIVERIES[0],
        status: payload.status ?? "DELIVERED",
        returnedItems: Array.isArray(payload.returnedItems) ? payload.returnedItems : [],
        signatureNote: payload.signatureNote ?? null,
        deliveredAt: ts,
        createdAt: ts,
      });
    }
    return jsonResponse(DEMO_DELIVERIES.map((d) => ({ ...d, createdAt: ts })));
  }

  if (path.endsWith("/api/commissions/summary")) {
    return jsonResponse([
      {
        userId: 2,
        repName: "امیرمحمد",
        validSalesTotal: 5_000_000,
        clearedCollectionsTotal: 2_000_000,
        commissionRate: 2,
        earnedCommission: 40_000,
        targetAchievementRate: 25,
      },
    ]);
  }

  if (path.endsWith("/api/alerts/summary")) {
    return jsonResponse({
      totalAlerts: 2,
      lowStockCount: 1,
      dormantCustomersCount: 1,
      inactiveRepsCount: 0,
      creditRiskCount: 0,
      alerts: [
        {
          id: "low-stock-2",
          category: "LOW_STOCK",
          severity: "MEDIUM",
          title: "کمبود موجودی: برنج طارم هاشمی ۱۰ کیلویی",
          description: "موجودی به حداقل مجاز رسیده است.",
          entityId: 2,
        },
        {
          id: "dormant-customer-2",
          category: "DORMANT_CUSTOMER",
          severity: "MEDIUM",
          title: "مشتری راکد: سوپرمارکت امید",
          description: "بیش از ۱۴ روز است سفارشی ثبت نکرده است.",
          entityId: 2,
        },
      ],
    });
  }

  if (path.includes("/api/orders")) {
    if (upperMethod === "POST") {
      return jsonResponse(
        {
          id: 999,
          code: "ORD-9999",
          customerId: Number(payload.customerId || 1),
          customerName: "فروشگاه نمونه ۱",
          userId: 1,
          repName: DEMO_USERS[0].name,
          visitId: payload.visitId ?? null,
          subtotal: 500_000,
          discount: Number(payload.discount || 0),
          total: Math.max(0, 500_000 - Number(payload.discount || 0)),
          paymentMethod: payload.paymentMethod || "CASH",
          notes: payload.notes ?? null,
          status: "در انتظار",
          items: Array.isArray(payload.items) ? payload.items : [],
          createdAt: ts,
        },
        201,
      );
    }
    if (upperMethod === "PATCH") {
      return jsonResponse({
        ...DEMO_ORDERS[0],
        status: payload.status ?? DEMO_ORDERS[0].status,
        createdAt: ts,
      });
    }
    return jsonResponse(DEMO_ORDERS.map((o) => ({ ...o, createdAt: ts })));
  }

  if (path.includes("/api/products")) {
    if (upperMethod === "DELETE") return new Response(null, { status: 204 });
    if (upperMethod === "POST" || upperMethod === "PATCH") {
      return jsonResponse(
        {
          id: 99,
          code: "NG-9099",
          name: payload.name || "محصول جدید",
          category: payload.category || "عمومی",
          pack: payload.pack || "کارتن ۱۲ عددی",
          unitsPerPack: Number(payload.unitsPerPack || 12),
          price: Number(payload.price || 100_000),
          costPrice: Number(payload.costPrice || 80_000),
          stock: Number(payload.stock || 0),
          minStock: Number(payload.minStock || 10),
          image: payload.image || "📦",
          createdAt: ts,
        },
        upperMethod === "POST" ? 201 : 200,
      );
    }
    return jsonResponse([
      {
        id: 1,
        code: "NG-9001",
        name: "روغن سرخ‌کردنی ۱.۵ لیتری",
        category: "خواربار",
        pack: "کارتن ۱۲ عددی",
        unitsPerPack: 12,
        price: 1_800_000,
        costPrice: 1_450_000,
        stock: 50,
        minStock: 10,
        image: "🛢️",
        createdAt: ts,
      },
      {
        id: 2,
        code: "NG-9002",
        name: "برنج طارم هاشمی ۱۰ کیلویی",
        category: "برنج و حبوبات",
        pack: "کیسه ۱۰ کیلویی",
        unitsPerPack: 1,
        price: 12_500_000,
        costPrice: 10_200_000,
        stock: 8,
        minStock: 10,
        image: "🌾",
        createdAt: ts,
      },
      {
        id: 3,
        code: "NG-9003",
        name: "چای ممتاز خارجی ۵۰۰ گرمی",
        category: "نوشیدنی",
        pack: "کارتن ۲۴ عددی",
        unitsPerPack: 24,
        price: 3_400_000,
        costPrice: 2_800_000,
        stock: 40,
        minStock: 10,
        image: "🍵",
        createdAt: ts,
      },
    ]);
  }

  if (path.includes("/api/customers")) {
    if (upperMethod === "DELETE") return new Response(null, { status: 204 });
    if (upperMethod === "POST" || upperMethod === "PATCH") {
      return jsonResponse(
        {
          id: 99,
          code: "C-099",
          name: payload.name || "مشتری جدید",
          phone: payload.phone || "09120000000",
          address: payload.address ?? null,
          zone: payload.zone ?? null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          creditLimit: Number(payload.creditLimit || 0),
          balance: Number(payload.balance || 0),
          createdAt: ts,
        },
        upperMethod === "POST" ? 201 : 200,
      );
    }
    return jsonResponse([
      {
        id: 1,
        code: "C-001",
        name: "فروشگاه نمونه ۱",
        phone: "09123456789",
        address: "تهران، خیابان ولیعصر",
        zone: "منطقه شمال",
        latitude: "35.7580",
        longitude: "51.4100",
        creditLimit: 50_000_000,
        balance: 3_000_000,
        createdAt: ts,
      },
      {
        id: 2,
        code: "C-002",
        name: "سوپرمارکت امید",
        phone: "09129876543",
        address: "مشهد، بلوار سجاد",
        zone: "منطقه شرق",
        latitude: "36.3100",
        longitude: "59.5600",
        creditLimit: 30_000_000,
        balance: 0,
        createdAt: ts,
      },
    ]);
  }

  if (path.includes("/api/users")) {
    if (upperMethod === "DELETE") return new Response(null, { status: 204 });
    return jsonResponse(DEMO_USERS.map((u) => ({ ...u, createdAt: ts })));
  }

  if (path.endsWith("/api/settings")) {
    return jsonResponse({
      id: 1,
      businessName: "فروشیار پلاس",
      phone: "021-12345678",
      address: "تهران",
      currency: "ریال",
      productCodePrefix: "NG-",
      customerCodePrefix: "C-",
      orderCodePrefix: "ORD-",
      updatedAt: ts,
      ...payload,
    });
  }

  if (path.includes("/api/audit-logs")) {
    return jsonResponse([
      {
        id: 1,
        userId: 1,
        actorName: "امیررضا",
        action: "LOGIN",
        entity: "auth",
        entityId: "1",
        details: "ورود موفق در حالت نمایشی",
        ipAddress: "127.0.0.1",
        createdAt: ts,
      },
    ]);
  }

  return jsonResponse({});
}
