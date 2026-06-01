"use client";

import { useState } from "react";
import type {
  BookingStatus,
  ContactMessage,
  ParkingArea,
  ParkingAreaStatus,
  ParkingSlot,
  ParkingSlotStatus,
  Prediction,
} from "@/lib/database.types";
import type { AdminBookingOverviewItem } from "@/services/bookingService";

type AdminDashboardClientProps = {
  initialAreas: ParkingArea[];
  initialSlots: ParkingSlot[];
  initialBookings: AdminBookingOverviewItem[];
  initialPredictions: Prediction[];
  initialContactMessages: ContactMessage[];
  summary: {
    totalUsers: number;
    activeBookings: number;
    cancelledBookings: number;
  };
};

const areaStatuses: ParkingAreaStatus[] = ["open", "busy", "full", "maintenance"];
const slotStatuses: ParkingSlotStatus[] = ["available", "occupied", "reserved", "maintenance"];

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getBookingStatusClasses(status: BookingStatus) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "pending") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "cancelled") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function formatCurrency(value: number) {
  return `$${Number(value).toFixed(2)}`;
}

function getPredictionLevel(prediction: Prediction) {
  const metadata = prediction.metadata;

  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const level = metadata.availabilityLevel;
    if (typeof level === "string") {
      return level;
    }
  }

  return "baseline";
}

export function AdminDashboardClient({
  initialAreas,
  initialSlots,
  initialBookings,
  initialPredictions,
  initialContactMessages,
  summary,
}: AdminDashboardClientProps) {
  const [areas, setAreas] = useState(initialAreas);
  const [slots, setSlots] = useState(initialSlots);
  const [bookings] = useState(initialBookings);
  const [predictions] = useState(initialPredictions);
  const [contactMessages] = useState(initialContactMessages);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateAreaStatus(areaId: string, status: ParkingAreaStatus) {
    setPendingAction(`area-${areaId}`);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/parking/areas/${areaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as ApiResponse<ParkingArea>;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to update parking area.");
      }

      setAreas((currentAreas) =>
        currentAreas.map((area) => (area.id === areaId ? payload.data! : area)),
      );
      setMessage("Parking area updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update parking area.");
    } finally {
      setPendingAction(null);
    }
  }

  async function updateSlotStatus(slotId: string, status: ParkingSlotStatus) {
    setPendingAction(`slot-${slotId}`);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/parking/slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as ApiResponse<ParkingSlot>;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to update parking slot.");
      }

      setSlots((currentSlots) =>
        currentSlots.map((slot) => (slot.id === slotId ? payload.data! : slot)),
      );
      setMessage("Parking slot updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update parking slot.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-8">
      {message ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["Users", summary.totalUsers.toString()],
          ["Parking areas", areas.length.toString()],
          ["Parking slots", slots.length.toString()],
          ["Active bookings", summary.activeBookings.toString()],
          ["Cancelled bookings", summary.cancelledBookings.toString()],
          ["Recent predictions", predictions.length.toString()],
          ["Contact messages", contactMessages.length.toString()],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{label}</p>
            <p className="mt-4 text-4xl font-black text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            Parking management
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">Parking areas</h2>
        </div>
        <div className="mt-6 space-y-3">
          {areas.length ? (
            areas.map((area) => (
              <div
                key={area.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-black text-slate-950">{area.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{area.address ?? "No address"}</p>
                </div>
                <select
                  value={area.status}
                  disabled={pendingAction === `area-${area.id}`}
                  onChange={(event) =>
                    updateAreaStatus(area.id, event.target.value as ParkingAreaStatus)
                  }
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold capitalize text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                >
                  {areaStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              No parking areas found.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            Slot controls
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">Parking slots</h2>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {slots.length ? (
            slots.slice(0, 24).map((slot) => {
              const area = areas.find((item) => item.id === slot.parking_area_id);

              return (
                <div
                  key={slot.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-slate-950">Slot {slot.slot_number}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {area?.name ?? "Parking area"} {slot.level ? `- ${slot.level}` : ""}
                    </p>
                  </div>
                  <select
                    value={slot.status}
                    disabled={pendingAction === `slot-${slot.id}`}
                    onChange={(event) =>
                      updateSlotStatus(slot.id, event.target.value as ParkingSlotStatus)
                    }
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold capitalize text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  >
                    {slotStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              No parking slots found.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            Booking overview
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">Recent bookings</h2>
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          {bookings.length ? (
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Parking area</th>
                  <th className="px-4 py-3">Slot</th>
                  <th className="px-4 py-3">Start / end</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{booking.id}</td>
                    <td className="px-4 py-3">
                      <span className="block font-bold text-slate-950">
                        {booking.profile?.full_name ?? "User"}
                      </span>
                      <span className="block font-mono text-xs text-slate-500">{booking.user_id}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {booking.parkingArea?.name ?? booking.parking_area_id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {booking.parkingSlot?.slot_number ?? booking.parking_slot_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(booking.start_time)}<br />
                      {formatDate(booking.end_time)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getBookingStatusClasses(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">
                      {formatCurrency(booking.total_price)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(booking.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              No bookings found.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            Prediction review
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">Recent predictions</h2>
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          {predictions.length ? (
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Area ID</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Slots</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Model</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {prediction.parking_area_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(prediction.prediction_window_start)}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">
                      {prediction.predicted_available_slots}
                    </td>
                    <td className="px-4 py-3 font-bold capitalize text-slate-700">
                      {getPredictionLevel(prediction)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {Math.round(prediction.confidence_score * 100)}%
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {prediction.model_version ?? "baseline-rule-v1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              No predictions found.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            Contact messages
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">Recent contact messages</h2>
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          {contactMessages.length ? (
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {contactMessages.map((messageItem) => (
                  <tr key={messageItem.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-bold text-slate-950">{messageItem.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{messageItem.email}</td>
                    <td className="px-4 py-3 text-slate-700">{messageItem.subject}</td>
                    <td className="px-4 py-3 font-bold capitalize text-slate-700">
                      {messageItem.status}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(messageItem.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              No contact messages found.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
