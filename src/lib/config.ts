export interface AppConfig {
  spreadsheetId: string
  spreadsheetUrl: string
  syncApiUrl: string
  pollIntervalMs: number
  sheetNames: {
    users: string
    members: string
    missions: string
    progress: string
    titles: string
    dashboard: string
  }
}

export const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: '12qHhMQB7DsYZauA64slzs3ABaMcJYMPWivMYgWzqESM',
  spreadsheetUrl:
    'https://docs.google.com/spreadsheets/d/12qHhMQB7DsYZauA64slzs3ABaMcJYMPWivMYgWzqESM/edit',
  syncApiUrl: import.meta.env.VITE_SYNC_API_URL ?? '',
  pollIntervalMs: 30000,
  sheetNames: {
    users: 'ユーザー',
    members: 'メンバー',
    missions: 'ミッション',
    progress: '進捗',
    titles: '称号',
    dashboard: 'ダッシュボード',
  },
}

let cachedConfig: AppConfig | null = null

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    if (!res.ok) {
      cachedConfig = DEFAULT_CONFIG
      return cachedConfig
    }
    const raw = (await res.json()) as Partial<AppConfig>
    cachedConfig = {
      ...DEFAULT_CONFIG,
      ...raw,
      sheetNames: { ...DEFAULT_CONFIG.sheetNames, ...raw.sheetNames },
      syncApiUrl: raw.syncApiUrl || import.meta.env.VITE_SYNC_API_URL || '',
    }
    return cachedConfig
  } catch {
    cachedConfig = DEFAULT_CONFIG
    return cachedConfig
  }
}

export function isSheetsApiConfigured(config: AppConfig): boolean {
  return Boolean(config.syncApiUrl)
}
