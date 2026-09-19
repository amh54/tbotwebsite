export const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s\_-]+/g, " ");

export const getSuggestionId = (suggestion) =>
  suggestion?.id ?? suggestion?.suggestion_id ?? suggestion?.suggestionId;

export const getSuggestionTitle = (suggestion) =>
  suggestion?.title || suggestion?.subject || "Untitled Suggestion";

export const getSuggestionDescription = (suggestion) =>
  suggestion?.description || suggestion?.details || suggestion?.message || "";

export const getSuggestionCategory = (suggestion) =>
  suggestion?.category || "other";

export const getSuggestionStatus = (suggestion) =>
  suggestion?.status || "pending";

export const getSubmitterName = (suggestion) =>
  suggestion?.discord_username ||
  suggestion?.username ||
  suggestion?.display_name ||
  suggestion?.displayName ||
  suggestion?.discordUsername ||
  suggestion?.user?.username ||
  suggestion?.user?.display_name ||
  suggestion?.user?.displayName ||
  "Unknown User";

export const getSubmitterAvatar = (suggestion) =>
  suggestion?.avatar ||
  suggestion?.avatar_url ||
  suggestion?.avatarUrl ||
  suggestion?.discord_avatar ||
  suggestion?.discordAvatar ||
  suggestion?.user?.avatar ||
  suggestion?.user?.avatar_url ||
  "";

export const getCreatedDate = (suggestion) =>
  suggestion?.created_at ||
  suggestion?.createdAt ||
  suggestion?.submitted_at ||
  suggestion?.submittedAt ||
  null;

export const getUpdatedDate = (suggestion) =>
  suggestion?.updated_at || suggestion?.updatedAt || null;

export const formatDate = (value) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const normalizeStatus = (status) => {
  const value = normalizeText(status);

  if (value === "reviewing") {
    return "reviewing";
  }

  if (value === "planned") {
    return "planned";
  }

  if (value === "completed") {
    return "completed";
  }

  if (value === "declined") {
    return "declined";
  }

  return "pending";
};

export const formatStatus = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") {
    return "Reviewing";
  }

  if (normalized === "planned") {
    return "Planned";
  }

  if (normalized === "completed") {
    return "Completed";
  }

  if (normalized === "declined") {
    return "Declined";
  }

  return "Pending";
};

export const formatCategory = (category) => {
  const value = normalizeText(category);

  if (!value) {
    return "Other";
  }

  const labels = {
    improvement: "Improvement",
    feature: "New Feature",
    "ui / design": "UI / Design",
    ui: "UI / Design",
    performance: "Performance",
    other: "Other",
  };

  return (
    labels[value] ||
    value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

export const getStatusDescription = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") {
    return "This suggestion is currently being reviewed.";
  }

  if (normalized === "planned") {
    return "This suggestion is planned for a future Tbot update.";
  }

  if (normalized === "completed") {
    return "This suggestion has been implemented or completed.";
  }

  if (normalized === "declined") {
    return "This suggestion will not be implemented at this time.";
  }

  return "This suggestion is waiting to be reviewed.";
};
