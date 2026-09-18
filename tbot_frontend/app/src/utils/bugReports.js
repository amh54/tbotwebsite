export const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

export const getReportId = (report) =>
  report?.id ??
  report?.report_id ??
  report?.reportId ??
  report?.bug_id ??
  report?.bugId;

export const getReportTitle = (report) =>
  report?.title ||
  report?.subject ||
  report?.bug_title ||
  report?.bugTitle ||
  "Untitled Bug Report";

export const getReportDescription = (report) =>
  report?.description ||
  report?.details ||
  report?.message ||
  report?.bug_description ||
  report?.bugDescription ||
  "";

export const getReportCategory = (report) =>
  report?.category ||
  report?.type ||
  report?.bug_type ||
  report?.bugType ||
  "other";

export const getReportStatus = (report) =>
  report?.status ||
  report?.state ||
  "open";

export const getReporterName = (report) =>
  report?.discord_username ||
  report?.username ||
  report?.display_name ||
  report?.displayName ||
  report?.discordUsername ||
  report?.user?.username ||
  report?.user?.display_name ||
  report?.user?.displayName ||
  "Unknown User";

export const getReporterAvatar = (report) =>
  report?.avatar ||
  report?.avatar_url ||
  report?.avatarUrl ||
  report?.discord_avatar ||
  report?.discordAvatar ||
  report?.user?.avatar ||
  report?.user?.avatar_url ||
  "";

export const getScreenshotUrl = (report) => {
  const possibleScreenshot =
    report?.screenshot ??
    report?.screenshot_url ??
    report?.screenshotUrl ??
    report?.image ??
    report?.image_url ??
    report?.imageUrl ??
    report?.uploaded_image ??
    report?.uploadedImage ??
    null;

  if (!possibleScreenshot) {
    return "";
  }

  if (typeof possibleScreenshot === "string") {
    return possibleScreenshot.trim();
  }

  if (
    typeof possibleScreenshot === "object"
  ) {
    return (
      possibleScreenshot?.url ||
      possibleScreenshot?.secure_url ||
      possibleScreenshot?.secureUrl ||
      possibleScreenshot?.screenshot_url ||
      possibleScreenshot?.screenshotUrl ||
      possibleScreenshot?.image_url ||
      possibleScreenshot?.imageUrl ||
      ""
    );
  }

  return "";
};

export const getCreatedDate = (report) =>
  report?.created_at ||
  report?.createdAt ||
  report?.submitted_at ||
  report?.submittedAt ||
  report?.date ||
  null;

export const normalizeStatus = (status) => {
  const value = normalizeText(status);

  if (
    value === "in progress" ||
    value === "in_progress"
  ) {
    return "in_progress";
  }

  if (value === "resolved") {
    return "resolved";
  }

  if (value === "closed") {
    return "closed";
  }

  return "open";
};

export const formatStatus = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "in_progress") {
    return "In Progress";
  }

  if (normalized === "resolved") {
    return "Resolved";
  }

  if (normalized === "closed") {
    return "Closed";
  }

  return "Open";
};

export const formatCategory = (category) => {
  const value = normalizeText(category);

  if (!value) {
    return "Other";
  }

  return value
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
};

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