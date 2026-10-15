export function normalizeAuthIdentifier(value: string): string | null {
  const identifier = value.trim();
  if (/^\S+@\S+\.\S+$/.test(identifier)) return identifier.toLowerCase();

  let digits = identifier.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

  return digits.length === 10 && digits.startsWith("9") ? `+63${digits}` : null;
}

export function authIdentifierCredentials(identifier: string) {
  return identifier.includes("@") ? { email: identifier } : { phone: identifier };
}
