const getApiBaseUrl = () => {
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

export const CARD_CACHE_KEY = "tbot_card_info_cache";

let cardCountMemoryCache = null;
let cardInfoMemoryCache = null;

export const getCardCountMemoryCache = () => cardCountMemoryCache;

export const setCardCountMemoryCache = (value) => {
  cardCountMemoryCache = value;
};

export const getCardInfoMemoryCache = () => cardInfoMemoryCache;

export const setCardInfoMemoryCache = (value) => {
  cardInfoMemoryCache = value;
};