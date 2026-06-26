/// <reference types="nativewind/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string | undefined;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string | undefined;
    EXPO_PUBLIC_API_URL: string | undefined;
  }
}
