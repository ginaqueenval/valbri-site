const SALT = "valbri::cs::";

function xorShuffle(bytes, salt) {
  const saltBytes = new TextEncoder().encode(salt);
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
  }
  return result;
}

export function encodeToken(value) {
  if (!value) return "";
  try {
    const raw = new TextEncoder().encode(value);
    const shuffled = xorShuffle(raw, SALT + location.hostname);
    return btoa(String.fromCharCode(...shuffled));
  } catch {
    return value;
  }
}

export function decodeToken(encoded) {
  if (!encoded) return null;
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const unshuffled = xorShuffle(bytes, SALT + location.hostname);
    return new TextDecoder().decode(unshuffled);
  } catch {
    return encoded;
  }
}
