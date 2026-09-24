export function createDemoMockResponse(
  url: string,
  method: string,
  body?: any,
): Response | null {
  const isLogin = url.includes("/api/auth/login") && method === "POST";
  if (isLogin) {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const { username, password } = data || {};

    if (password !== "1234") {
      return new Response(JSON.stringify({ message: "رمز عبور اشتباه است." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let user;
    if (username === "امیررضا") {
      user = { id: 1, username: "امیررضا", name: "امیررضا", role: "admin" };
    } else if (username === "امیرمحمد") {
      user = { id: 2, username: "امیرمحمد", name: "امیرمحمد", role: "user" };
    } else if (username === "حسام") {
      user = { id: 3, username: "حسام", name: "حسام", role: "user" };
    } else {
      return new Response(JSON.stringify({ message: "کاربر یافت نشد." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ token: "demo-jwt-token-123456", user }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Common demo fallback for other endpoints
  const path = url.split("?")[0];
  let data: any = {};

  if (path.includes("/api/dashboard/summary")) {
    data = {
      totalOrders: 120,
      totalSales: 450000000,
      activeCustomers: 45,
      pendingOrders: 12,
      recentOrders: [
        {
          id: 101,
          customerName: "شرکت بازرگانی آلفا",
          totalAmount: 15000000,
          status: "تایید شده",
          createdAt: new Date().toISOString(),
        },
        {
          id: 102,
          customerName: "فروشگاه بزرگ ایرانیان",
          totalAmount: 32000000,
          status: "در انتظار",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 103,
          customerName: "هایپرمارکت ستاره",
          totalAmount: 8500000,
          status: "تکمیل شده",
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ],
    };
  } else if (path.includes("/api/dashboard/chart")) {
    data = [
      { date: "1403-01", sales: 120000000 },
      { date: "1403-02", sales: 150000000 },
      { date: "1403-03", sales: 110000000 },
      { date: "1403-04", sales: 180000000 },
      { date: "1403-05", sales: 145000000 },
      { date: "1403-06", sales: 210000000 },
    ];
  } else if (path.includes("/api/orders")) {
    if (method === "GET") {
      data = [
        {
          id: 101,
          customerId: 1,
          customerName: "شرکت بازرگانی آلفا",
          userId: 1,
          userName: "امیررضا",
          status: "تایید شده",
          totalAmount: 15000000,
          notes: "تحویل فوری",
          createdAt: new Date().toISOString(),
        },
        {
          id: 102,
          customerId: 2,
          customerName: "فروشگاه بزرگ ایرانیان",
          userId: 2,
          userName: "امیرمحمد",
          status: "در انتظار",
          totalAmount: 32000000,
          notes: "",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 103,
          customerId: 3,
          customerName: "هایپرمارکت ستاره",
          userId: 3,
          userName: "حسام",
          status: "تکمیل شده",
          totalAmount: 8500000,
          notes: "هماهنگی با انبار انجام شد",
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 104,
          customerId: 4,
          customerName: "سوپرمارکت برادران",
          userId: 1,
          userName: "امیررضا",
          status: "لغو شده",
          totalAmount: 4200000,
          notes: "عدم موجودی کالا",
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
      ];
    } else if (method === "POST") {
      data = { id: 105, status: "در انتظار" };
    }
  } else if (path.includes("/api/products")) {
    if (method === "GET") {
      data = [
        {
          id: 1,
          code: "PRD-001",
          name: "روغن موتور پیشتاز",
          category: "روغن",
          price: 850000,
          stock: 150,
          unit: "عدد",
          active: true,
        },
        {
          id: 2,
          code: "PRD-002",
          name: "فیلتر هوا پراید",
          category: "فیلتر",
          price: 120000,
          stock: 300,
          unit: "عدد",
          active: true,
        },
        {
          id: 3,
          code: "PRD-003",
          name: "لنت ترمز پژو ۴۰۵",
          category: "لنت",
          price: 450000,
          stock: 85,
          unit: "دست",
          active: true,
        },
        {
          id: 4,
          code: "PRD-004",
          name: "شمع موتور بوش",
          category: "شمع",
          price: 320000,
          stock: 420,
          unit: "عدد",
          active: true,
        },
        {
          id: 5,
          code: "PRD-005",
          name: "ضدیخ کاسپین ۱ لیتری",
          category: "سیالات",
          price: 180000,
          stock: 0,
          unit: "بطری",
          active: false,
        },
      ];
    } else if (method === "POST") {
      data = {
        id: 6,
        ...JSON.parse(
          typeof body === "string" ? body : JSON.stringify(body || {}),
        ),
      };
    }
  } else if (path.includes("/api/customers")) {
    if (method === "GET") {
      data = [
        {
          id: 1,
          code: "CST-001",
          name: "شرکت بازرگانی آلفا",
          phone: "021-88888888",
          mobile: "09121111111",
          address: "تهران، خیابان ولیعصر",
          region: "مرکز",
          balance: 15000000,
          active: true,
        },
        {
          id: 2,
          code: "CST-002",
          name: "فروشگاه بزرگ ایرانیان",
          phone: "021-77777777",
          mobile: "09122222222",
          address: "تهران، تهرانپارس",
          region: "شرق",
          balance: -5000000,
          active: true,
        },
        {
          id: 3,
          code: "CST-003",
          name: "هایپرمارکت ستاره",
          phone: "021-66666666",
          mobile: "09123333333",
          address: "تهران، صادقیه",
          region: "غرب",
          balance: 0,
          active: true,
        },
        {
          id: 4,
          code: "CST-004",
          name: "سوپرمارکت برادران",
          phone: "021-55555555",
          mobile: "09124444444",
          address: "تهران، بازار",
          region: "جنوب",
          balance: 1200000,
          active: false,
        },
      ];
    } else if (method === "POST") {
      data = {
        id: 5,
        ...JSON.parse(
          typeof body === "string" ? body : JSON.stringify(body || {}),
        ),
      };
    }
  } else if (path.includes("/api/users")) {
    if (method === "GET") {
      data = [
        {
          id: 1,
          username: "امیررضا",
          name: "امیررضا",
          role: "admin",
          active: true,
        },
        {
          id: 2,
          username: "امیرمحمد",
          name: "امیرمحمد",
          role: "user",
          active: true,
        },
        { id: 3, username: "حسام", name: "حسام", role: "user", active: true },
        {
          id: 4,
          username: "کارمند_سابق",
          name: "کارمند سابق",
          role: "user",
          active: false,
        },
      ];
    } else if (method === "POST") {
      data = {
        id: 5,
        ...JSON.parse(
          typeof body === "string" ? body : JSON.stringify(body || {}),
        ),
      };
    }
  } else {
    // Return 404 for unsupported paths instead of 200 silent success
    return new Response(
      JSON.stringify({ message: "مسیر در نسخه نمایشی پشتیبانی نمی‌شود." }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
