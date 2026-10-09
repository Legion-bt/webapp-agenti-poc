-- =====================================================================
-- SETUP COMPLETO SUPABASE: SCHEMA + DATI DEMO PER AGENTEGO ERP
-- Incolla questo script nel SQL Editor di Supabase e premi "RUN"
-- URL: https://supabase.com/dashboard/project/ppfebdhulnkncvyfgyul/sql/new
-- =====================================================================

-- 1. Estensioni
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZZAZIONI (Multi-tenant B2B)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    vat_number VARCHAR(50),
    tax_code VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(50),
    erp_connector_type VARCHAR(50) DEFAULT 'GENERIC_REST',
    erp_endpoint TEXT,
    erp_status VARCHAR(20) DEFAULT 'CONNECTED',
    erp_last_sync TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILI UTENTE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'AGENT',
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AGENTI COMMERCIALI
CREATE TABLE IF NOT EXISTS public.sales_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    area VARCHAR(100),
    commission_rate NUMERIC(5,2) DEFAULT 5.50,
    monthly_target NUMERIC(12,2) DEFAULT 35000.00,
    yearly_target NUMERIC(12,2) DEFAULT 420000.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 5. LISTINI PREZZO
CREATE TABLE IF NOT EXISTS public.price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    active BOOLEAN DEFAULT TRUE,
    UNIQUE(org_id, code)
);

-- 6. CLIENTI ANAGRAFICA
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    tax_code VARCHAR(50),
    sdi_code VARCHAR(20) DEFAULT '0000000',
    email VARCHAR(255),
    pec VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'ITALIA',
    area VARCHAR(100),
    sales_agent_id UUID REFERENCES public.sales_agents(id) ON DELETE SET NULL,
    price_list_id UUID REFERENCES public.price_lists(id) ON DELETE SET NULL,
    payment_term VARCHAR(255) DEFAULT 'Bonifico bancario 30 - 60 - 90 gg. d.f.',
    iban VARCHAR(50),
    bank_name VARCHAR(100),
    delivery_notes TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 50000.00,
    current_exposure NUMERIC(12,2) DEFAULT 0.00,
    overdue_amount NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    category VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 7. PARTITE APERTE E SOSPESI CLIENTI (Screenshot 3)
CREATE TABLE IF NOT EXISTS public.customer_suspended_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    doc_number VARCHAR(100) NOT NULL,
    internal_ref VARCHAR(50),
    doc_date DATE NOT NULL,
    doc_type VARCHAR(20) NOT NULL,
    match_title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    balance NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    to_collect NUMERIC(12,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CATEGORIE PRODOTTO
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL
);

-- 9. PRODOTTI A CATALOGO (Screenshot 4)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'BT',
    pack_info VARCHAR(100),
    base_price NUMERIC(12,2) NOT NULL,
    cost_price NUMERIC(12,2),
    default_discount1 NUMERIC(5,2) DEFAULT 0,
    default_discount2 NUMERIC(5,2) DEFAULT 0,
    default_discount3 NUMERIC(5,2) DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    is_promo BOOLEAN DEFAULT FALSE,
    vintage_year VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 10. MAGAZZINI E GIACENZE
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS public.stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_on_hand INT DEFAULT 0,
    quantity_committed INT DEFAULT 0,
    quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
    next_arrival_date DATE,
    next_arrival_qty INT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id)
);

-- 11. ORDINI E RIGHE ORDINE (Screenshot 5)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sales_agent_id UUID NOT NULL REFERENCES public.sales_agents(id),
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    order_date DATE DEFAULT CURRENT_DATE,
    requested_delivery_date DATE,
    payment_term VARCHAR(255),
    causal VARCHAR(100) DEFAULT 'OV - ORDINI CLIENTI',
    notes TEXT,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_total NUMERIC(12,2) DEFAULT 0,
    tax_total NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    residual_total NUMERIC(12,2) DEFAULT 0,
    back_order BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    erp_sync_status VARCHAR(50) DEFAULT 'SYNCED',
    erp_doc_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, number)
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INT NOT NULL,
    quantity_shipped INT DEFAULT 0,
    list_price NUMERIC(12,2) NOT NULL,
    discount1 NUMERIC(5,2) DEFAULT 0,
    discount2 NUMERIC(5,2) DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    notes TEXT
);

-- 12. PREVENTIVI
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sales_agent_id UUID NOT NULL REFERENCES public.sales_agents(id),
    status VARCHAR(50) DEFAULT 'SENT',
    quote_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    payment_term VARCHAR(255),
    notes TEXT,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_total NUMERIC(12,2) DEFAULT 0,
    tax_total NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, number)
);

-- 13. VISITE CRM & PROVVIGIONI
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    sales_agent_id UUID NOT NULL REFERENCES public.sales_agents(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'VISIT',
    outcome VARCHAR(50) DEFAULT 'POSITIVE',
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sales_agent_id UUID NOT NULL REFERENCES public.sales_agents(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number VARCHAR(100),
    customer_name VARCHAR(255),
    base_amount NUMERIC(12,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACCRUED',
    accrued_date DATE DEFAULT CURRENT_DATE,
    paid_date DATE
);

-- =====================================================================
-- POPOLAMENTO DATI (SEED REALE FEDELE AGLI SCREENSHOT)
-- =====================================================================

-- 1. Organizzazione
INSERT INTO public.organizations (id, code, name, legal_name, vat_number, address, city, province, erp_connector_type, erp_endpoint, erp_status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ORG-01',
    'Vigneti & Oliveti di Valdoro S.p.A.',
    'Vigneti & Oliveti di Valdoro Società Agricola S.p.A.',
    'IT90000000101',
    'Via dell''Artigianato, 42',
    'Valdoro',
    'XA',
    'GENERIC_REST',
    'https://erp-gateway.example/v2/valdoro',
    'CONNECTED'
) ON CONFLICT (code) DO NOTHING;

-- 2. Agenti
INSERT INTO public.sales_agents (id, org_id, code, full_name, email, phone, area, commission_rate, monthly_target, yearly_target)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '3',
    'Davide Ferraresi',
    'agente@example.local',
    '+39 300 0000301',
    'Porto Selene & Rocca Ventosa',
    5.5,
    35000.00,
    420000.00
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '7',
    'Stefano Valli',
    's.valli@example.local',
    '+39 300 0000302',
    'Fontechiara & Montecerro',
    5.0,
    30000.00,
    360000.00
) ON CONFLICT (org_id, code) DO NOTHING;

-- 3. Listino
INSERT INTO public.price_lists (id, org_id, code, name, valid_from)
VALUES 
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '01_002', '01_002 Listino Base 2026', '2026-01-01')
ON CONFLICT (org_id, code) DO NOTHING;

-- 4. Cliente: VERDEMARE FORNITURE SPA (Screenshot 1, 2 e 3)
INSERT INTO public.customers (
    id, org_id, code, business_name, vat_number, tax_code, sdi_code,
    email, pec, phone, mobile, address, city, province, postal_code, country, area,
    sales_agent_id, price_list_id, payment_term, iban, bank_name, delivery_notes,
    credit_limit, current_exposure, overdue_amount, status, category
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '000301',
    'VERDEMARE FORNITURE SPA',
    'IT90000000301',
    '90000000301',
    '0000000',
    'davide.ferraresi@example.local',
    'verdemareforniture@pec.example',
    '0000 000301',
    '300 0000311',
    'VIA DEI TIGLI, 12',
    'BORGO LUMINA',
    'XA',
    '99012',
    'ITALIA',
    'VALDORO NORD',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Bonifico bancario 30 - 60 - 90 gg. d.f.',
    'IT00X0000000000000000000301',
    'BANCA DEL TERRITORIO VALDORESE',
    'Chiuso MARTEDI/DOMENICA. Consegna dalle 08:30 alle 12:00 presso magazzino retro.',
    180000.00,
    176420.50,
    92415.30,
    'BLOCKED',
    'HOTEL 3-4'
) ON CONFLICT (org_id, code) DO NOTHING;

-- 5. Partite Aperte e Sospesi (Screenshot 3)
INSERT INTO public.customer_suspended_items (customer_id, doc_number, internal_ref, doc_date, doc_type, match_title, due_date, balance, amount, to_collect, is_paid)
VALUES 
('d0000000-0000-0000-0000-000000000001', '2024-FT-0000079', '771\1', '2024-11-18', 'BON', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2024-11-16', 47.20, 47.20, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2024-FT-0000070', '761\1', '2024-11-09', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2024-12-09', 31250.00, 31250.00, 26800.00, false),
('d0000000-0000-0000-0000-000000000001', '2024-FT-0000079', '777\1', '2024-12-19', 'BON', 'Ns. Fattura', '2024-12-19', 1580.00, 1580.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2025-FT-0000013', '779\1', '2025-02-04', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2025-03-06', 210.00, 290.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2025-FT-0000017', '786\1', '2025-02-15', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2025-03-17', 290.00, 290.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2025-FT-0000018', '787\1', '2025-02-15', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2025-03-17', 96.00, 96.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2025-FT-0000006', '791\1', '2025-01-25', 'RD', 'Ns. Fattura RD45F: RIMESSA DIRETTA 45 GG D.F.F.M.', '2025-03-31', 28940.00, 28940.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2025-FT-0000012', '863\1', '2025-02-04', 'RB', 'Fattura di Vendita RB30F: R.B. 30 gg. d.f.f.m.', '2025-03-31', 290.00, 290.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2025-FT-0000023', '804\1', '2025-03-07', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2025-04-06', 985.00, 985.00, 0.00, false);

-- 6. Categorie Prodotti
INSERT INTO public.product_categories (id, code, name)
VALUES 
('e0000000-0000-0000-0000-000000000001', 'OLIO', 'Olio Imbottigliato & Frantoio'),
('e0000000-0000-0000-0000-000000000002', 'RISERVA', 'Vini Rossi Riserva'),
('e0000000-0000-0000-0000-000000000003', 'SELEZIONE', 'Vini Selezione')
ON CONFLICT (code) DO NOTHING;

-- 7. Prodotti a Catalogo (Screenshot 4)
INSERT INTO public.products (
    id, org_id, code, barcode, name, description, category_id, brand, unit, pack_info,
    base_price, cost_price, default_discount1, default_discount2, image_url, is_promo
) VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'OLEXT075',
    '800123450012',
    'OLIO EXTRAVERGINE D''OLIVA "DEL FRANTOIO" 0,75',
    'Estratto a freddo da olive di cultivar del territorio.',
    'e0000000-0000-0000-0000-000000000001',
    'Frantoio Valdoro',
    'BT',
    '1 ST x BT',
    24.00,
    11.50,
    50.0,
    0.0,
    NULL,
    true
),
(
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'RRIS075',
    '800123450029',
    'ROSSO RISERVA "VALDORO" 0,75',
    'Annata 2021. 30 mesi di affinamento.',
    'e0000000-0000-0000-0000-000000000002',
    'Tenuta Valdoro',
    'BT',
    '12 BT x CA12',
    18.00,
    8.20,
    20.0,
    10.0,
    NULL,
    false
),
(
    'f0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'BBIB5',
    '800123450036',
    'BIANCO FERMO "FONTECHIARA" BAG-IN-BOX LT. 5',
    'Bianco fermo in Bag in Box / Dama.',
    'e0000000-0000-0000-0000-000000000003',
    'Cantina Fontechiara',
    'PZ',
    '1 PZ x PZ',
    8.40,
    4.10,
    10.0,
    5.0,
    NULL,
    false
) ON CONFLICT (org_id, code) DO NOTHING;

-- 8. Ordini (Screenshot 5)
INSERT INTO public.orders (
    id, org_id, number, customer_id, sales_agent_id, status, order_date, requested_delivery_date,
    payment_term, causal, notes, subtotal, discount_total, tax_total, total, residual_total, back_order
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '2026-OV-0000036',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'BLOCKED',
    '2026-08-24',
    '2026-09-01',
    'Bonifico bancario 30 - 60 - 90 gg. d.f.',
    'OV - ORDINI CLIENTI',
    'ho ritirato un assegno',
    5096.76,
    840.00,
    936.49,
    5193.25,
    5096.76,
    true
),
(
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '2026-OV-0000035',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'SHIPPED',
    '2026-08-17',
    '2026-08-22',
    'Bonifico bancario 30 - 60 - 90 gg. d.f.',
    'OV - ORDINI CLIENTI',
    'Consegnato regolarmente',
    189.97,
    20.00,
    37.40,
    207.37,
    189.97,
    false
) ON CONFLICT (org_id, number) DO NOTHING;

-- RLS Abilitato su TUTTE le tabelle
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_suspended_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accesso pubblico lettura demo" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Accesso pubblico clienti" ON public.customers FOR ALL USING (true);
CREATE POLICY "Accesso pubblico prodotti" ON public.products FOR ALL USING (true);
CREATE POLICY "Accesso pubblico ordini" ON public.orders FOR ALL USING (true);
CREATE POLICY "Accesso pubblico sospesi" ON public.customer_suspended_items FOR ALL USING (true);
CREATE POLICY "Accesso pubblico listini" ON public.price_lists FOR ALL USING (true);
CREATE POLICY "Accesso pubblico categorie" ON public.product_categories FOR ALL USING (true);
CREATE POLICY "Accesso pubblico agenti" ON public.sales_agents FOR ALL USING (true);
