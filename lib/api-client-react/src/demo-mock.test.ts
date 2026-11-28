import { describe, it, expect } from "vitest";
import { createDemoMockResponse } from "./demo-mock";

async function readJson(res: Response | null) {
  expect(res).not.toBeNull();
  return res!.json();
}

describe("createDemoMockResponse", () => {
  it("returns array and summary contracts for visits endpoints", async () => {
    const visits = await readJson(createDemoMockResponse("/api/visits", "GET"));
    expect(Array.isArray(visits)).toBe(true);
    expect(visits.length).toBeGreaterThanOrEqual(2);
    expect(visits[0]).toHaveProperty("code");
    expect(visits[0]).toHaveProperty("status");

    const summary = await readJson(createDemoMockResponse("/api/visits/stats/summary", "GET"));
    expect(typeof summary.conversionRate).toBe("number");
    expect(summary.totalVisits).toBeGreaterThanOrEqual(1);
  });

  it("returns array and summary contracts for targets endpoints", async () => {
    const targets = await readJson(createDemoMockResponse("/api/targets", "GET"));
    expect(Array.isArray(targets)).toBe(true);
    expect(targets[0]).toHaveProperty("targetAmount");
    expect(targets[0]).toHaveProperty("achievementRate");

    const summary = await readJson(createDemoMockResponse("/api/targets/stats/summary", "GET"));
    expect(typeof summary.overallAchievementRate).toBe("number");
  });

  it("matches OpenAPI DashboardSummary, Order, Customer, and Settings schemas", async () => {
    const dash = await readJson(createDemoMockResponse("/api/dashboard/summary", "GET"));
    expect(typeof dash.orderCount).toBe("number");
    expect(typeof dash.customerCount).toBe("number");
    expect(typeof dash.productCount).toBe("number");
    expect(Array.isArray(dash.recentOrders)).toBe(true);
    expect(dash.recentOrders[0].items[0]).toHaveProperty("qty");
    expect(dash.recentOrders[0].items[0]).toHaveProperty("price");

    const chart = await readJson(createDemoMockResponse("/api/dashboard/sales-chart", "GET"));
    expect(Array.isArray(chart)).toBe(true);
    expect(chart[0]).toHaveProperty("label");
    expect(typeof chart[0].value).toBe("number");

    const customers = await readJson(createDemoMockResponse("/api/customers", "GET"));
    expect(Array.isArray(customers)).toBe(true);
    expect(typeof customers[0].creditLimit).toBe("number");

    const settings = await readJson(createDemoMockResponse("/api/settings", "GET"));
    expect(settings.businessName).toBe("فروشیار پلاس");
    expect(settings.currency).toBe("ریال");
    expect(typeof dash.grossProfit).toBe("number");
    expect(typeof dash.lowStockCount).toBe("number");
  });

  it("supports Wave 2 collections, deliveries, commissions, and alerts contracts", async () => {
    const collections = await readJson(createDemoMockResponse("/api/collections", "GET"));
    expect(Array.isArray(collections)).toBe(true);
    expect(collections[0]).toHaveProperty("method");

    const sheet = await readJson(createDemoMockResponse("/api/deliveries/loading-sheet", "GET"));
    expect(Array.isArray(sheet)).toBe(true);
    expect(typeof sheet[0].packsCount).toBe("number");

    const commissions = await readJson(createDemoMockResponse("/api/commissions/summary", "GET"));
    expect(Array.isArray(commissions)).toBe(true);
    expect(typeof commissions[0].earnedCommission).toBe("number");

    const alerts = await readJson(createDemoMockResponse("/api/alerts/summary", "GET"));
    expect(typeof alerts.totalAlerts).toBe("number");
    expect(Array.isArray(alerts.alerts)).toBe(true);
  });
});
