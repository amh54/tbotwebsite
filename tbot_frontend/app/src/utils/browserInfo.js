export function getOperatingSystem() {
  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  if (/Windows/i.test(userAgent) || /Win/i.test(platform)) {
    return "Windows";
  }

  if (/Android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPhone|iPod/i.test(userAgent)) {
    return "iOS";
  }

  if (
    /iPad/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  ) {
    return "iPadOS";
  }

  if (/Macintosh|Mac OS X/i.test(userAgent) || /Mac/i.test(platform)) {
    return "macOS";
  }

  if (/Linux/i.test(userAgent) || /Linux/i.test(platform)) {
    return "Linux";
  }

  return "Unknown";
}

export function getBrowser() {
  const userAgent = window.navigator.userAgent || "";

  if (/Edg\//i.test(userAgent)) {
    return "Microsoft Edge";
  }

  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) {
    return "Opera";
  }

  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
    return "Google Chrome";
  }

  if (/Firefox\//i.test(userAgent)) {
    return "Mozilla Firefox";
  }

  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    return "Safari";
  }

  if (/MSIE|Trident/i.test(userAgent)) {
    return "Internet Explorer";
  }

  return "Unknown";
}