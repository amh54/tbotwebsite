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