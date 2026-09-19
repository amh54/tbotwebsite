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

const patchSuggestion = async (suggestionId, body) => {
  let token = await ensureCsrfToken();

  let response = await fetch(getSuggestionUrl(suggestionId), {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 403) {
    token = await ensureCsrfToken(true);

    response = await fetch(getSuggestionUrl(suggestionId), {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": token,
      },
      body: JSON.stringify(body),
    });
  }

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      `Unable to update suggestion. Status ${response.status}`,
    );

    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const updateSuggestionStatus = async (suggestionId, status) => {
  return patchSuggestion(suggestionId, {
    status,
  });
};

export const saveSuggestionDetails = async (suggestionId, details) => {
  let token = await ensureCsrfToken();

  let response = await fetch(getSuggestionUrl(suggestionId), {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    },
    body: JSON.stringify(details),
  });

  if (response.status === 403) {
    token = await ensureCsrfToken(true);

    response = await fetch(getSuggestionUrl(suggestionId), {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": token,
      },
      body: JSON.stringify(details),
    });
  }

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      `Unable to save suggestion details. Status ${response.status}`,
    );

    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const deleteSuggestion = async (suggestionId) => {
  let token = await ensureCsrfToken();

  let response = await fetch(getSuggestionUrl(suggestionId), {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-CSRFToken": token,
    },
  });

  if (response.status === 403) {
    token = await ensureCsrfToken(true);

    response = await fetch(getSuggestionUrl(suggestionId), {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-CSRFToken": token,
      },
    });
  }

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      `Unable to delete suggestion. Status ${response.status}`,
    );

    throw new Error(message);
  }

  return true;
};
