import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://ppfebdhulnkncvyfgyul.supabase.co').trim().replace(/[\r\n]/g, '');
const rawKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_HupKDt-lyDYwm8hNYRbnEg_CuxPA8L3'
).trim().replace(/[\r\n]/g, '');

const supabaseUrl = rawUrl;
const supabaseKey = rawKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('placeholder')
);

let initializedClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    initializedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Errore inizializzazione Supabase client:', err);
    initializedClient = null;
  }
}

export const supabase: SupabaseClient | null = initializedClient;

export interface DatabaseStatus {
  isConfigured: boolean;
  provider: 'SUPABASE_LIVE' | 'LOCAL_DEMO_ENGINE';
  url: string;
  projectId: string;
}

export function getDatabaseStatus(): DatabaseStatus {
  const projectId = supabaseUrl ? supabaseUrl.replace('https://', '').split('.')[0] : '';
  return {
    isConfigured: isSupabaseConfigured,
    provider: isSupabaseConfigured ? 'SUPABASE_LIVE' : 'LOCAL_DEMO_ENGINE',
    url: isSupabaseConfigured ? supabaseUrl : 'Memoria Locale & SQLite Demo Engine',
    projectId: projectId || 'ppfebdhulnkncvyfgyul',
  };
}

/**
 * Checks connection health to the configured Supabase instance
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  latencyMs: number;
}> {
  if (!supabase) {
    return {
      connected: false,
      message: 'Supabase client non inizializzato',
      latencyMs: 0,
    };
  }

  const start = performance.now();
  try {
    // Ping Supabase auth or check public table
    const { error } = await supabase.from('customers').select('id').limit(1);
    const latency = Math.round(performance.now() - start);

    if (error) {
      // Table might not exist yet if migrations haven't run in the remote DB
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          connected: true,
          message: `Connesso a Supabase (${getDatabaseStatus().projectId})! Le tabelle relazionali devono essere create eseguendo lo script SQL fornito nel SQL Editor di Supabase.`,
          latencyMs: latency,
        };
      }
      return {
        connected: true,
        message: `Connesso all'endpoint Supabase (${latency}ms). Nota: ${error.message}`,
        latencyMs: latency,
      };
    }

    return {
      connected: true,
      message: `Connessione attiva e verificata con Supabase Live (${latency}ms). Tabelle sincronizzate.`,
      latencyMs: latency,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return {
      connected: false,
      message: `Errore connessione: ${err.message || 'Timeout endpoint'}`,
      latencyMs: latency,
    };
  }
}

