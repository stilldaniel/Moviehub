import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

type AuthClientLike = {
  getSession: () => Promise<{ data: { session: any }; error: any }>;
  getUser: () => Promise<{ data: { user: any }; error: any }>;
  signOut: () => Promise<{ error: any }>;
};

export const supabase = (() => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null as unknown as ReturnType<typeof createBrowserClient>;
    }

    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
})();

const isRefreshTokenError = (error: { code?: string; message?: string } | null | undefined) => {
  if (!error) return false;
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";

  return (
    code === "refresh_token_not_found" ||
    message.includes("refresh token not found") ||
    message.includes("invalid refresh token")
  );
};

export async function getSafeSession(authClient: AuthClientLike | null | undefined) {
  if (!authClient) {
    return { data: { session: null }, error: null };
  }

  try {
    const response = await authClient.getSession();
    if (response.error && isRefreshTokenError(response.error)) {
      await authClient.signOut().catch(() => undefined);
      return { data: { session: null }, error: null };
    }
    return response;
  } catch (error) {
    if (isRefreshTokenError(error as { code?: string; message?: string } | null | undefined)) {
      await authClient.signOut().catch(() => undefined);
      return { data: { session: null }, error: null };
    }
    throw error;
  }
}

export async function getSafeUser(authClient: AuthClientLike | null | undefined) {
  if (!authClient) {
    return { data: { user: null }, error: null };
  }

  try {
    const response = await authClient.getUser();
    if (response.error && isRefreshTokenError(response.error)) {
      await authClient.signOut().catch(() => undefined);
      return { data: { user: null }, error: null };
    }
    return response;
  } catch (error) {
    if (isRefreshTokenError(error as { code?: string; message?: string } | null | undefined)) {
      await authClient.signOut().catch(() => undefined);
      return { data: { user: null }, error: null };
    }
    throw error;
  }
}