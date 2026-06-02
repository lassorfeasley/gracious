export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getEnvOptional(key: string): string | undefined {
  return process.env[key];
}

export const appUrl = () =>
  getEnvOptional('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000';
