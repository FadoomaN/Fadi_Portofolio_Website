function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    url: requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    publishableKey: requiredEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  };
}

export function getAdminLoginEnv() {
  return {
    username: requiredEnv('ADMIN_LOGIN_USERNAME'),
    email: requiredEnv('ADMIN_AUTH_EMAIL'),
  };
}
