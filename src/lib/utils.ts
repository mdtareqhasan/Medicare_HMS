import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeAppointmentStatus(status?: string) {
  const normalized = (status || "").toString().trim().toLowerCase();
  if (normalized === "scheduled") return "upcoming";
  if (normalized === "rescheduled") return "rescheduled";
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  return normalized;
}

