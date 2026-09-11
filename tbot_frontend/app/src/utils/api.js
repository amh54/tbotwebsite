export const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
).replace(/\/+$/, "");

export async function ensureCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/tbotapp/csrf/`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to obtain CSRF token: ${response.status}`);
  }

  const data = await response.json();

  if (!data.csrfToken) {
    throw new Error("CSRF token was not provided by the server.");
  }

  return data.csrfToken;
}
