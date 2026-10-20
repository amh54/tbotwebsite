export const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const removeDiscordEmojis = (value) =>
  String(value ?? "").replace(/<a?:[^:>]+:\d+>/gi, "");

export const replaceDiscordEmojisWithNames = (value) =>
  String(value ?? "").replace(
    /<a?:([^:>]+):\d+>/gi,
    (_, emojiName) => ` ${emojiName} `,
  );

export const cleanTraitValue = (value) =>
  removeDiscordEmojis(value)
    .replaceAll("**", "")
    .replaceAll("__", "")
    .replaceAll("~~", "")
    .replaceAll("`", "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ \d+$/, "")
    .trim();

export const simplifyForMatch = (value) =>
  normalizeText(value).replace(/['\u2019]/g, "");

export const toTitleCase = (value) =>
  value.toLowerCase().replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());

export const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";