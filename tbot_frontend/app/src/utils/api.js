export const getApiBaseUrl = () => {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return "";
};

export const API_BASE_URL = getApiBaseUrl();

export function getCsrfToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export async function ensureCsrfToken() {
  const existingToken = getCsrfToken();

  if (existingToken) {
    return existingToken;
  }

  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.detail ||
        `Unable to get CSRF token (${response.status})`,
    );
  }

  const csrfToken =
    data?.csrfToken ||
    data?.csrf_token ||
    data?.token ||
    getCsrfToken();

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Please refresh the page and try again.",
    );
  }

  return csrfToken;
}