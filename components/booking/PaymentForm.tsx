"use client";

import { FormEvent, useState } from "react";
import type { Booking, ParkingArea, ParkingSlot } from "@/lib/database.types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

type PendingBooking = {
  areaId: string;
  slotId: string;
  vehiclePlate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  fullName: string;
  emailAddress: string;
};

type PaymentFormProps = {
  pending: PendingBooking;
  area: ParkingArea | undefined;
  slot: ParkingSlot | undefined;
  onPaymentComplete: (booking: Booking) => void;
  onBack: () => void;
  onCreateBooking: () => Promise<Booking>;
};

export function PaymentForm({
  pending,
  area,
  slot,
  onPaymentComplete,
  onBack,
  onCreateBooking,
}: PaymentFormProps) {
  const [cardholderName, setCardholderName] = useState(pending.fullName);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    const rawDigits = cardNumber.replace(/\s/g, "");
    if (rawDigits.length < 13 || rawDigits.length > 16) {
      setErrorMessage("Please enter a valid card number (13-16 digits).");
      setIsProcessing(false);
      return;
    }

    const expiryParts = expiry.split("/");
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setErrorMessage("Please enter expiry as MM/YY.");
      setIsProcessing(false);
      return;
    }

    if (cvv.length < 3 || cvv.length > 4) {
      setErrorMessage("CVV must be 3 or 4 digits.");
      setIsProcessing(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1800));

    try {
      const booking = await onCreateBooking();
      onPaymentComplete(booking);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Booking creation failed after payment.",
      );
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Step 2 of 2
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Payment</h2>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Booking summary
          </p>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Location</span>
              <span className="font-bold text-slate-900">{area?.name ?? "Parking"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Slot</span>
              <span className="font-bold text-slate-900">
                {slot?.slot_number ?? "—"}{slot?.level ? ` (${slot.level})` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Vehicle</span>
              <span className="font-bold text-slate-900">{pending.vehiclePlate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">From</span>
              <span className="font-bold text-slate-900">{formatDateTime(pending.startTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">To</span>
              <span className="font-bold text-slate-900">{formatDateTime(pending.endTime)}</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="font-black text-slate-700">Total</span>
              <span className="text-xl font-black text-blue-700">${pending.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handlePay} className="mt-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-slate-400">
                <rect x="1" y="4" width="22" height="16" rx="3" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <p className="text-sm font-bold text-slate-700">Card details</p>
              <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                DEMO
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Cardholder Name</span>
                <input
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                  placeholder="John Smith"
                  disabled={isProcessing}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Card Number</span>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  required
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  maxLength={19}
                  disabled={isProcessing}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Expiry Date</span>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    required
                    placeholder="MM/YY"
                    inputMode="numeric"
                    maxLength={5}
                    disabled={isProcessing}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">CVV</span>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                    placeholder="123"
                    inputMode="numeric"
                    maxLength={4}
                    type="password"
                    disabled={isProcessing}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isProcessing ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Processing payment...
              </>
            ) : (
              `Pay $${pending.totalPrice.toFixed(2)}`
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            This is a simulated payment for demonstration purposes. No real charges will be made.
          </p>
        </form>
      </section>
    </div>
  );
}
