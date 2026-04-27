const isEnglishLocale = (language) =>
  String(language || "").toLowerCase().startsWith("en");

const cleanValue = (value) => {
  if (value == null) return "";
  return String(value).trim();
};

const pickLocalizedValue = (defaultValue, englishValue, language) => {
  const fallback = cleanValue(defaultValue);
  const english = cleanValue(englishValue);
  if (isEnglishLocale(language)) {
    return english || fallback;
  }
  return fallback || english;
};

export function resolveLocalizedAnnouncement(item, language) {
  return {
    title: pickLocalizedValue(item?.title, item?.titleEn, language),
    content: pickLocalizedValue(item?.content, item?.contentEn, language),
  };
}

export function resolveLocalizedGameName(game, language) {
  if (typeof game === "string") {
    return game;
  }
  return pickLocalizedValue(game?.name, game?.nameEn, language);
}
