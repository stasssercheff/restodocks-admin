export {}

declare global {
  interface CloudflareEnv {
    ADMIN_CONFIG?: {
      get(key: string): Promise<string | null>
      put(key: string, value: string): Promise<void>
    }
  }
}
