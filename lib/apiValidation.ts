export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function parseLimit(value: string | null, fallback = 25, max = 100) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), max);
}

export function parseIsoDate(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be an ISO date string.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date string.`);
  }

  return date;
}

export async function parseJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function getPublicErrorMessage(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    (error.message.includes("must be") ||
      error.message.includes("required") ||
      error.message.includes("not available") ||
      error.message.includes("not found") ||
      error.message.includes("Invalid") ||
      error.message.includes("after the start"))
  ) {
    return error.message;
  }

  return fallback;
}

export function getApiErrorStatus(error: unknown) {
  if (error instanceof Error && error.message.includes("Authentication is required")) {
    return 401;
  }

  if (error instanceof Error && error.message.includes("Administrator access")) {
    return 403;
  }

  if (
    error instanceof Error &&
    (error.message.includes("not found") || error.message.includes("not available"))
  ) {
    return 404;
  }

  return 400;
}

export function isSafeRedirectPath(value: string | null): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}
