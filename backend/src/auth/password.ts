import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
const scrypt = (password: string, salt: string, length: number) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(
      password,
      salt,
      length,
      { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [algorithm, salt, expected] = hash.split(":");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  const comparison = Buffer.from(expected, "hex");
  return comparison.length === key.length && timingSafeEqual(key, comparison);
}
