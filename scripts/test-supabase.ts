import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ppfebdhulnkncvyfgyul.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HupKDt-lyDYwm8hNYRbnEg_CuxPA8L3';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

async function main() {
  console.log('Testing Supabase project with working key:');

  // Use working key
  const activeKey = SUPABASE_SECRET_KEY || SUPABASE_ANON_KEY;
  const client = createClient(SUPABASE_URL, activeKey);
  
  // Try querying all 8 tables
  const tables = [
    'organizations',
    'sales_agents',
    'price_lists',
    'product_categories',
    'products',
    'customers',
    'customer_suspended_items',
    'orders'
  ];

  for (const t of tables) {
    const { data, error } = await client.from(t).select('*').limit(5);
    if (error) {
      console.log(`Table '${t}': ERROR -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table '${t}': OK, rows visible: ${data ? data.length : 0}`);
    }
  }
}

main().catch(console.error);
