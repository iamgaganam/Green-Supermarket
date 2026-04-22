import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    if ("response" in error) {
      const response = (error as { response?: { data?: unknown } }).response;

      if (response && typeof response.data === "object" && response.data) {
        const data = response.data as { error?: unknown };

        if (typeof data.error === "string" && data.error) {
          return data.error;
        }
      }
    }

    if ("message" in error) {
      const message = (error as { message?: unknown }).message;

      if (typeof message === "string" && message) {
        return message;
      }
    }
  }

  return fallback;
}

export function getApiErrorStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status ===
      "number"
  ) {
    return (error as { response?: { status?: number } }).response?.status;
  }

  return undefined;
}
