import type { BookingRequest, ProviderWorkspace, RequestStatus } from "@/lib/panel/types";
import { findConflict } from "@/lib/panel/logic";
import { longDate } from "@/lib/panel/format";

export type Result = { ws: ProviderWorkspace; error?: undefined } | { ws?: undefined; error: string };

function update(ws: ProviderWorkspace, id: string, allowed: RequestStatus[], change: (r: BookingRequest) => BookingRequest | string): Result {
  const req = ws.requests.find((r) => r.id === id);
  if (!req) return { error: "La solicitud ya no existe." };
  if (!allowed.includes(req.status)) return { error: "Esta solicitud ya cambió de estado." };
  const next = change(req);
  if (typeof next === "string") return { error: next };
  return { ws: { ...ws, requests: ws.requests.map((r) => (r.id === id ? next : r)) } };
}

function log(r: BookingRequest, status: RequestStatus, label: string, note?: string): BookingRequest {
  return { ...r, status, history: [...r.history, { at: new Date().toISOString(), label, note }] };
}

function conflictMessage(conflict: BookingRequest) {
  return `Choca con la reserva confirmada de ${conflict.clientName} (${longDate(conflict.date)}, ${conflict.start}–${conflict.end}).`;
}

/** Accepting tells the client the provider can do it; the date is only held once the client confirms. */
export function acceptRequest(ws: ProviderWorkspace, id: string): Result {
  return update(ws, id, ["pendiente", "modificacion"], (r) => {
    const conflict = findConflict(ws.requests, r);
    if (conflict) return conflictMessage(conflict);
    return log(r, "aceptada", "Aceptaste la solicitud", "Esperando la confirmación del cliente");
  });
}

export function rejectRequest(ws: ProviderWorkspace, id: string, reason: string): Result {
  return update(ws, id, ["pendiente", "modificacion", "aceptada"], (r) => ({
    ...log(r, "rechazada", "Rechazaste la solicitud", reason || undefined),
    rejectReason: reason || undefined,
  }));
}

export function proposePrice(ws: ProviderWorkspace, id: string, offer: { price: number; conditions: string; message: string }): Result {
  return update(ws, id, ["pendiente", "modificacion", "aceptada"], (r) => ({
    ...log(r, "modificacion", `Propusiste Bs ${offer.price.toLocaleString("es-BO")}`, offer.message || undefined),
    counterOffer: offer,
  }));
}

export function requestChanges(ws: ProviderWorkspace, id: string, text: string): Result {
  return update(ws, id, ["pendiente", "modificacion", "aceptada"], (r) => ({
    ...log(r, "modificacion", "Solicitaste cambios en las condiciones", text),
    changeRequest: text,
  }));
}

/** Demo stand-in for the client confirming from their side. */
export function registerClientConfirmation(ws: ProviderWorkspace, id: string): Result {
  return update(ws, id, ["aceptada"], (r) => {
    const conflict = findConflict(ws.requests, r);
    if (conflict) return conflictMessage(conflict);
    const price = r.counterOffer?.price ?? r.proposedPrice;
    return { ...log(r, "confirmada", "El cliente confirmó la reserva"), proposedPrice: price };
  });
}

export function cancelBooking(ws: ProviderWorkspace, id: string, reason: string): Result {
  return update(ws, id, ["aceptada", "confirmada"], (r) => log(r, "cancelada", "Reserva cancelada", reason || undefined));
}

/** A booking the provider enters by hand from the calendar (e.g. arranged by phone). It holds the date at once. */
export function addManualBooking(ws: ProviderWorkspace, booking: BookingRequest): Result {
  const conflict = findConflict(ws.requests, booking);
  if (conflict) return { error: conflictMessage(conflict) };
  return { ws: { ...ws, requests: [...ws.requests, booking] } };
}
