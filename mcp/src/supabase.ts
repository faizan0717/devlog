import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv()
loadEnv({ path: 'mcp/.env' })

const supabaseUrl = process.env.DEVLOG_SUPABASE_URL
const serviceRoleKey = process.env.DEVLOG_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing DEVLOG_SUPABASE_URL')
}

if (!serviceRoleKey) {
  throw new Error('Missing DEVLOG_SUPABASE_SERVICE_ROLE_KEY')
}

// Server-only client. Never expose DEVLOG_SUPABASE_SERVICE_ROLE_KEY to the Vite app/browser.
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
