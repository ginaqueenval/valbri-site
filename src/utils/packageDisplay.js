export const sortPackages = (list) =>
  [...list].sort(
    (a, b) =>
      (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.sortOrder ?? Number.MAX_SAFE_INTEGER),
  );

// Backward-compat: legacy noteTag values from the existing backend data are
// mapped to the new 7-badge taxonomy so older rows keep rendering during the
// migration window. New rows should use the canonical keys on the right.
const NOTE_TAG_ALIAS = {
  popular: "hot",
  bestSeller: "champion",
  bestValue: "deal",
  fastDelivery: "flash",
  highVolume: "bulk",
  vip: "crown",
  maxPack: "rocket",
};

export const CANONICAL_NOTE_TAGS = [
  "hot",
  "champion",
  "deal",
  "flash",
  "bulk",
  "crown",
  "rocket",
];

export const resolveNoteTag = (tag) => {
  if (!tag) return null;
  return NOTE_TAG_ALIAS[tag] || tag;
};

export const noteLabel = (tag, t) => {
  const canonical = resolveNoteTag(tag);
  if (!canonical) return null;
  const key = `notes.${canonical}`;
  const translated = t(key);
  return translated === key ? canonical : translated;
};
