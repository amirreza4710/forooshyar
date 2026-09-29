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
      totalSales: 15000000,
      activeCustomers: 45,
      pendingOrders: 5,
      recentOrders: [
        {
          id: 1,
          customerName: "مشتری نمایشی ۱",
          totalAmount: 500000,
          status: "تایید شده",
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          customerName: "مشتری نمایشی ۲",
          totalAmount: 1200000,
          status: "در انتظار",
          createdAt: new Date().toISOString(),
        },
      ],
    };
  } else if (path.includes("/api/dashboard/chart")) {
    data = [
      { date: "1403-01", sales: 1200000 },
      { date: "1403-02", sales: 1500000 },
      { date: "1403-03", sales: 1100000 },
    ];
  } else if (path.includes("/api/orders")) {
    if (method === "GET") {
      data = [];
    } else if (method === "POST") {
      data = { id: 999, status: "در انتظار" };
    }
  } else if (path.includes("/api/products")) {
    data = [];
  } else if (path.includes("/api/customers")) {
    data = [];
  } else if (path.includes("/api/users")) {
    data = [];
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
