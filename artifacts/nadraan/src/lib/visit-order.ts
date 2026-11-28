import type { Visit } from "@workspace/api-client-react";
export function readVisitId(search: string): number | null {
  const raw = new URLSearchParams(search).get("visitId");
  if (!raw || !/^[1-9][0-9]*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}
export function linkedVisitId(id: number | null, visit: Visit | undefined, customerId: number | null): number | undefined {
  return id !== null && visit?.id === id && visit.customerId === customerId && visit.status === "IN_PROGRESS" && !visit.orderId ? id : undefined;
}
