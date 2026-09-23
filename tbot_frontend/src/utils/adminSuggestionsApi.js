import { API_BASE_URL, ensureCsrfToken, getApiErrorMessage } from "./api.js";

const getSuggestionUrl = (suggestionId) =>
  `${API_BASE_URL}/tbotapp/admin/suggestions/${suggestionId}/`;

export const fetchSuggestions = async () => {
  const response = await fetch(`${API_BASE_URL}/tbotapp/admin/suggestions/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      `Request failed with status ${response.status}`,
    );

    if (response.status === 401) {
      throw new Error(
        "You must be logged in with Discord to access the admin page.",
      );
    }

    if (response.status === 403) {
      throw new Error("Owner permissions are required to access suggestions.");
    }

    throw new Error(message);
  }

  const data = await response.json();

  return Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.suggestions)
        ? data.suggestions
        : [];
};

const makeRequest = async (suggestionId, method, body, errorFallback) => {
  /*
   * Get the current CSRF token before every mutating request.
   */
  let token = await ensureCsrfToken();

  const makeFetch = (csrfToken) => {
    const headers = {
      Accept: "application/json",
      "X-CSRFToken": csrfToken,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(getSuggestionUrl(suggestionId), {
      method,
      credentials: "include",
      headers,
      ...(body !== undefined
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    });
  };

  let response = await makeFetch(token);

  /*
   * A 403 can occur when the browser has an old CSRF token while
   * Django has a newer one. Force a fresh token and retry once.
   */
  if (response.status === 403) {
    token = await ensureCsrfToken(true);
    response = await makeFetch(token);
  }

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      `${errorFallback}. Status ${response.status}`,
    );

    throw new Error(message);
  }

  /*
   * DELETE may return an empty response.
   */
  if (method === "DELETE") {
    return true;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const updateSuggestionStatus = async (suggestionId, status) => {
  return makeRequest(
    suggestionId,
    "PATCH",
    {
      status,
    },
    "Unable to update suggestion",
  );
};

export const saveSuggestionDetails = async (suggestionId, details) => {
  return makeRequest(
    suggestionId,
    "PATCH",
    details,
    "Unable to save suggestion details",
  );
};

export const deleteSuggestion = async (suggestionId) => {
  return makeRequest(
    suggestionId,
    "DELETE",
    undefined,
    "Unable to delete suggestion",
  );
};
