export function authSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be configured with at least 32 characters");
  return secret;
}
