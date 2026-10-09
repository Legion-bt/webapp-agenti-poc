import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_AGENTS,
  INITIAL_PRICE_LISTS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_SUSPENDED_ITEMS,
  INITIAL_ORDERS
} from '../src/lib/mock-data';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ppfebdhulnkncvyfgyul.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function seed() {
  console.log('--- Inizio popolamento Supabase Live ---');

  // 1. Organizzazione
  const org = {
    code: 'ORG-01',
    name: 'Vigneti & Oliveti di Valdoro S.p.A.',
    legal_name: 'Vigneti & Oliveti di Valdoro Società Agricola S.p.A.',
    vat_number: 'IT90000000101',
    address: 'Via dell’Artigianato, 42',
    city: 'Valdoro',
    province: 'XA',
    erp_connector_type: 'GENERIC_REST',
    erp_status: 'CONNECTED'
  };
  const { data: orgData, error: orgErr } = await supabase.from('organizations').upsert(org, { onConflict: 'code' }).select().single();
  if (orgErr) console.error('Org error:', orgErr.message);
  const orgId = orgData?.id;

  // 2. Agente
  const agent = {
    org_id: orgId,
    code: '3',
    full_name: 'Davide Ferraresi',
    email: 'agente@example.local',
    phone: '+39 300 0000301',
    area: 'Porto Selene & Rocca Ventosa',
    commission_rate: 5.5,
    monthly_target: 35000,
    yearly_target: 420000
  };
  const { data: agentData, error: agentErr } = await supabase.from('sales_agents').upsert(agent, { onConflict: 'org_id,code' }).select().single();
  if (agentErr) console.error('Agent error:', agentErr.message);
  const agentId = agentData?.id;

  // 3. Listino
  const pl = {
    org_id: orgId,
    code: '01_002',
    name: '01_002 Listino Base 2026'
  };
  const { data: plData, error: plErr } = await supabase.from('price_lists').upsert(pl, { onConflict: 'org_id,code' }).select().single();
  if (plErr) console.error('PriceList error:', plErr.message);
  const plId = plData?.id;

  // 4. Categorie
  const cats = [
    { code: 'OLIO', name: 'Olio Imbottigliato & Frantoio' },
    { code: 'RISERVA', name: 'Vini Rossi Riserva' },
    { code: 'SELEZIONE', name: 'Vini Selezione' },
    { code: 'CONDIMENTI', name: 'Condimenti Gourmet & Aceti' },
    { code: 'BAGINBOX', name: 'Sfuso e Bag in Box 5L' }
  ];
  const { data: catsData, error: catsErr } = await supabase.from('product_categories').upsert(cats, { onConflict: 'code' }).select();
  if (catsErr) console.error('Cats error:', catsErr.message);

  // 5. Prodotti
  const prods = [
    {
      org_id: orgId,
      code: 'OLEXT075',
      barcode: '800123450012',
      name: 'OLIO EXTRAVERGINE D\'OLIVA "DEL FRANTOIO" 0,75',
      description: 'Estratto a freddo da olive di cultivar del territorio.',
      brand: 'Frantoio Valdoro',
      unit: 'BT',
      pack_info: '1 ST x BT',
      base_price: 24.0,
      cost_price: 11.5,
      default_discount1: 50.0,
      default_discount2: 0,
      image_url: null,
      is_promo: true
    },
    {
      org_id: orgId,
      code: 'RRIS075',
      barcode: '800123450029',
      name: 'ROSSO RISERVA "VALDORO" 0,75',
      description: 'Annata 2021. 30 mesi di affinamento.',
      brand: 'Tenuta Valdoro',
      unit: 'BT',
      pack_info: '12 BT x CA12',
      base_price: 18.0,
      cost_price: 8.2,
      default_discount1: 20.0,
      default_discount2: 10.0,
      image_url: null,
      is_promo: false
    },
    {
      org_id: orgId,
      code: 'BBIB5',
      barcode: '800123450036',
      name: 'BIANCO FERMO "FONTECHIARA" BAG-IN-BOX LT. 5',
      description: 'Bianco fermo in Bag in Box / Dama.',
      brand: 'Cantina Fontechiara',
      unit: 'PZ',
      pack_info: '1 PZ x PZ',
      base_price: 8.4,
      cost_price: 4.1,
      default_discount1: 10.0,
      default_discount2: 5.0,
      image_url: null,
      is_promo: false
    },
    {
      org_id: orgId,
      code: 'RSUP075',
      barcode: '800123450043',
      name: 'ROSSO SUPERIORE "ROCCA VENTOSA" 0,75',
      description: 'Rosso da uve a bacca nera con profumi intensi.',
      brand: 'Tenuta Rocca Ventosa',
      unit: 'BT',
      pack_info: '6 BT x CA6',
      base_price: 16.5,
      cost_price: 7.9,
      default_discount1: 15.0,
      default_discount2: 5.0,
      image_url: null,
      is_promo: false
    }
  ];
  const { data: prodsData, error: prodsErr } = await supabase.from('products').upsert(prods, { onConflict: 'org_id,code' }).select();
  if (prodsErr) console.error('Prods error:', prodsErr.message);
  else console.log(`Prodotti inseriti: ${prodsData.length}`);

  // 6. Clienti
  const cust = {
    org_id: orgId,
    code: '000301',
    business_name: 'VERDEMARE FORNITURE SPA',
    vat_number: 'IT90000000301',
    tax_code: '90000000301',
    sdi_code: '0000000',
    email: 'davide.ferraresi@example.local',
    pec: 'verdemareforniture@pec.example',
    phone: '0000 000301',
    mobile: '300 0000311',
    address: 'VIA DEI TIGLI, 12',
    city: 'BORGO LUMINA',
    province: 'XA',
    postal_code: '99012',
    country: 'ITALIA',
    area: 'VALDORO NORD',
    sales_agent_id: agentId,
    price_list_id: plId,
    payment_term: 'Bonifico bancario 30 - 60 - 90 gg. d.f.',
    iban: 'IT00X0000000000000000000301',
    bank_name: 'BANCA DEL TERRITORIO VALDORESE',
    delivery_notes: 'Chiuso MARTEDI/DOMENICA. Consegna dalle 08:30 alle 12:00 presso magazzino retro.',
    credit_limit: 180000,
    current_exposure: 176420.50,
    overdue_amount: 92415.30,
    status: 'BLOCKED',
    category: 'HOTEL 3-4'
  };
  const { data: custData, error: custErr } = await supabase.from('customers').upsert(cust, { onConflict: 'org_id,code' }).select().single();
  if (custErr) console.error('Cust error:', custErr.message);
  const custId = custData?.id;

  // 7. Sospesi
  const susp = [
    {
      customer_id: custId,
      doc_number: '2024-FT-0000079',
      internal_ref: '771\\1',
      doc_date: '2024-11-18',
      doc_type: 'BON',
      match_title: 'Ns. Fattura RB30: R.B. 30 gg. d.f.',
      due_date: '2024-11-16',
      balance: 47.20,
      amount: 47.20,
      to_collect: 0
    },
    {
      customer_id: custId,
      doc_number: '2024-FT-0000070',
      internal_ref: '761\\1',
      doc_date: '2024-11-09',
      doc_type: 'RB',
      match_title: 'Ns. Fattura RB30: R.B. 30 gg. d.f.',
      due_date: '2024-12-09',
      balance: 31250.00,
      amount: 31250.00,
      to_collect: 26800.00
    },
    {
      customer_id: custId,
      doc_number: '2025-FT-0000006',
      internal_ref: '791\\1',
      doc_date: '2025-01-25',
      doc_type: 'RD',
      match_title: 'Ns. Fattura RD45F: RIMESSA DIRETTA 45 GG D.F.F.M.',
      due_date: '2025-03-31',
      balance: 28940.00,
      amount: 28940.00,
      to_collect: 0
    }
  ];
  const { data: suspData, error: suspErr } = await supabase.from('customer_suspended_items').insert(susp).select();
  if (suspErr) console.error('Susp error:', suspErr.message);
  else console.log(`Partite inserite: ${suspData.length}`);

  // 8. Ordini
  const ords = [
    {
      org_id: orgId,
      number: '2026-OV-0000036',
      customer_id: custId,
      sales_agent_id: agentId,
      status: 'BLOCKED',
      order_date: '2026-08-24',
      requested_delivery_date: '2026-09-01',
      payment_term: 'Bonifico bancario 30 - 60 - 90 gg. d.f.',
      causal: 'OV - ORDINI CLIENTI',
      notes: 'ho ritirato un assegno',
      subtotal: 5096.76,
      discount_total: 840.0,
      tax_total: 936.49,
      total: 5193.25,
      residual_total: 5096.76,
      back_order: true,
      block_reason: 'Fido superato & insoluti pregressi pari a €92.415,30',
      erp_sync_status: 'SYNCED',
      erp_doc_number: 'ERP-OV-26-8941'
    },
    {
      org_id: orgId,
      number: '2026-OV-0000035',
      customer_id: custId,
      sales_agent_id: agentId,
      status: 'SHIPPED',
      order_date: '2026-08-17',
      requested_delivery_date: '2026-08-22',
      payment_term: 'Bonifico bancario 30 - 60 - 90 gg. d.f.',
      causal: 'OV - ORDINI CLIENTI',
      notes: 'Consegnato con ddt 49102',
      subtotal: 189.97,
      discount_total: 20.0,
      tax_total: 37.4,
      total: 207.37,
      residual_total: 189.97,
      back_order: false,
      erp_sync_status: 'SYNCED',
      erp_doc_number: 'ERP-OV-26-8812'
    }
  ];
  const { data: ordsData, error: ordsErr } = await supabase.from('orders').upsert(ords, { onConflict: 'org_id,number' }).select();
  if (ordsErr) console.error('Orders error:', ordsErr.message);
  else console.log(`Ordini inseriti: ${ordsData.length}`);

  console.log('--- Popolamento Supabase completato con successo! ---');
}

seed().catch(console.error);
