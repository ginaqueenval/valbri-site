const NAME_FIELDS = ["username", "nickName", "nickname", "name"];

export function getPlayerDisplayName(profile) {
  if (!profile || typeof profile !== "object") {
    return "";
  }

  for (const field of NAME_FIELDS) {
    const value = profile[field];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
