import { API_BASE_URL } from "./api";

const getCookie = (name) => {
  const cookies = document.cookie
    ? document.cookie.split(";")
    : [];

  for (const cookie of cookies) {
    const trimmed = cookie.trim();

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(
        trimmed.substring(name.length + 1),
      );
    }
  }

  return null;
};

const ensureCsrfToken = async () => {
  let csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(
    `${API_BASE_URL}/tbotapp/csrf/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to initialize CSRF protection.",
    );
  }

  csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error(
      "CSRF token was not provided.",
    );
  }

  return csrfToken;
};

const normalizeSourceType = (sourceType) => {
  const value = String(sourceType || "")
    .trim()
    .toLowerCase();

  if (
    value === "userdeck" ||
    value === "user-deck"
  ) {
    return "user_deck";
  }

  if (
    value === "legacydeck" ||
    value === "legacy-deck"
  ) {
    return "legacy";
  }

  if (
    value === "user_deck" ||
    value === "legacy" ||
    value === "decklist"
  ) {
    return value;
  }

  return "decklist";
};

const resolveDeckArguments = (
  sourceType,
  deckId,
) => {
  if (
    deckId === undefined ||
    deckId === null ||
    deckId === ""
  ) {
    return {
      sourceType: "decklist",
      deckId: sourceType,
    };
  }

  return {
    sourceType: normalizeSourceType(sourceType),
    deckId,
  };
};

export const getSavedDecks = async () => {
  const response = await fetch(
    `${API_BASE_URL}/tbotapp/saved-decks/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error ||
        "Unable to load saved decks.",
    );
  }

  return Array.isArray(data)
    ? data
    : data?.saved_decks || [];
};

export const saveDeck = async (
  sourceType,
  deckId,
) => {
  const resolved =
    resolveDeckArguments(
      sourceType,
      deckId,
    );

  if (
    resolved.deckId === undefined ||
    resolved.deckId === null ||
    resolved.deckId === ""
  ) {
    throw new Error("Deck ID is missing.");
  }

  const csrfToken =
    await ensureCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/tbotapp/saved-decks/${encodeURIComponent(
      resolved.sourceType,
    )}/${encodeURIComponent(
      resolved.deckId,
    )}/`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-CSRFToken": csrfToken,
      },
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error ||
        "Unable to save deck.",
    );
  }

  return data;
};

export const removeSavedDeck = async (
  sourceType,
  deckId,
) => {
  const resolved =
    resolveDeckArguments(
      sourceType,
      deckId,
    );

  if (
    resolved.deckId === undefined ||
    resolved.deckId === null ||
    resolved.deckId === ""
  ) {
    throw new Error("Deck ID is missing.");
  }

  const csrfToken =
    await ensureCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/tbotapp/saved-decks/${encodeURIComponent(
      resolved.sourceType,
    )}/${encodeURIComponent(
      resolved.deckId,
    )}/remove/`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-CSRFToken": csrfToken,
      },
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error ||
        "Unable to remove saved deck.",
    );
  }

  return data;
};