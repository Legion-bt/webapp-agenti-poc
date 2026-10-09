-- =====================================================================
-- SEED DATA: seed.sql
-- Rich Italian B2B Dataset for ERP Sales Agent WebApp
-- Matching ERP / B2B Screenshots
-- =====================================================================

-- 1. Organization
INSERT INTO organizations (id, code, name, legal_name, vat_number, address, city, province, erp_connector_type, erp_endpoint, erp_status)
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

-- 2. Sales Agents
INSERT INTO sales_agents (id, org_id, code, full_name, email, phone, area, commission_rate, monthly_target, yearly_target)
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
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    '1',
    'Dott. Fabio Riccardi',
    'manager@example.local',
    '+39 300 0000303',
    'Direzione Vendite',
    6.0,
    150000.00,
    1800000.00
) ON CONFLICT (org_id, code) DO NOTHING;

-- 3. Price List
INSERT INTO price_lists (id, org_id, code, name, valid_from)
VALUES 
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '01_002', 'Listino Base 2026', '2026-01-01'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '02_HORECA', 'Listino Ristorazione & Hotel 2026', '2026-01-01'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '03_DISTRIB', 'Listino Grossisti & GDO 2026', '2026-01-01')
ON CONFLICT (org_id, code) DO NOTHING;

-- 4. Customer: VERDEMARE FORNITURE SPA (Direct from Screenshot 1 & 3)
INSERT INTO customers (
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

-- 5. Suspended Items (Direct from Screenshot 3)
INSERT INTO customer_suspended_items (customer_id, doc_number, internal_ref, doc_date, doc_type, match_title, due_date, balance, amount, to_collect, is_paid)
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

-- 6. Product Categories
INSERT INTO product_categories (id, code, name)
VALUES 
('e0000000-0000-0000-0000-000000000001', 'OLIO', 'Olio Imbottigliato & Monovarietale'),
('e0000000-0000-0000-0000-000000000002', 'RISERVA', 'Vini Rossi Riserva'),
('e0000000-0000-0000-0000-000000000003', 'SELEZIONE', 'Vini Selezione'),
('e0000000-0000-0000-0000-000000000004', 'CONDIMENTI', 'Aceti & Condimenti Gourmet')
ON CONFLICT (code) DO NOTHING;

-- 7. Products (Direct from Screenshot 4)
INSERT INTO products (
    id, org_id, code, barcode, name, description, category_id, brand, unit, pack_info,
    base_price, cost_price, default_discount1, default_discount2, image_url, is_promo
) VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'OLEXT075',
    '800123450012',
    'OLIO EXTRAVERGINE D''OLIVA "DEL FRANTOIO" 0,75',
    'Estratto a freddo da olive di cultivar del territorio, bottiglia scura anti-ossidazione con salvagoccia.',
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
    'Annata 2021. 30 mesi di affinamento di cui 12 in barrique di rovere francese.',
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
    'Bianco fermo in Bag in Box / Dama professionale per mescita Horeca veloce.',
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
),
(
    'f0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'RSUP075',
    '800123450043',
    'ROSSO SUPERIORE "ROCCA VENTOSA" 0,75',
    'Rosso da uve a bacca nera dei rilievi collinari, profumi intensi di marasca e spezie.',
    'e0000000-0000-0000-0000-000000000002',
    'Tenuta Rocca Ventosa',
    'BT',
    '6 BT x CA6',
    16.50,
    7.90,
    15.0,
    5.0,
    NULL,
    false
) ON CONFLICT (org_id, code) DO NOTHING;
