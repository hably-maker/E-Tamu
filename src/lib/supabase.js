import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variabel lingkungan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi di file .env'
  )
}

let tabId = sessionStorage.getItem('e-tamu-tab-id')
if (!tabId) {
  tabId = `tab-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`
  sessionStorage.setItem('e-tamu-tab-id', tabId)
}

const STORAGE_PREFIX = `${tabId}:`
const STORAGE_KEY = `e-tamu-auth-${tabId}`

const customStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(STORAGE_PREFIX + key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value)
    } catch {}
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch {}
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: STORAGE_KEY,
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-tab-id': tabId }
  }
})
