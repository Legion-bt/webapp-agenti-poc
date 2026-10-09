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
    'Vigneti & Oliveti Adriatici S.p.A.',
    'Vigneti & Oliveti Adriatici Società Agricola S.p.A.',
    'IT90000000101',
    'Via dell''Artigianato, 42',
    'Jesi',
    'AN',
    'GENERIC_REST',
    'https://erp-gateway.example/v2/adriatici',
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
    'Pesaro - Urbino & Romagna',
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
    'Ancona - Macerata',
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
    'Direzione Vendite Centro-Nord',
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
    '000030',
    'VERDEMARE FORNITURE SPA',
    'IT90000000301',
    '90000000301',
    '0000000',
    'davide.ferraresi@example.local',
    'verdemareforniture@pec.example',
    '0721 000301',
    '300 0000311',
    'VIA DEI TIGLI, 12',
    'BARCHI',
    'PU',
    '61030',
    'ITALIA',
    'PESARO URBINO',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Bonifico bancario 30 - 60 - 90 gg. d.f.',
    'IT00X0000000000000000000301',
    'MONTE DEI PASCHI DI SIENA',
    'Chiuso MARTEDI/DOMENICA. Consegna dalle 08:30 alle 12:00 presso magazzino retro.',
    950000.00,
    929762.68,
    811008.82,
    'BLOCKED',
    'HOTEL 3-4'
) ON CONFLICT (org_id, code) DO NOTHING;

-- 5. Suspended Items (Direct from Screenshot 3)
INSERT INTO customer_suspended_items (customer_id, doc_number, internal_ref, doc_date, doc_type, match_title, due_date, balance, amount, to_collect, is_paid)
VALUES 
('d0000000-0000-0000-0000-000000000001', '2006-RFN-0000079', '470\1', '2006-11-18', 'BON', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2006-11-16', 83.57, 83.57, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2006-RFN-0000070', '460\1', '2006-11-09', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2006-12-09', 86400.00, 86400.00, 73400.00, false),
('d0000000-0000-0000-0000-000000000001', '2006-RFN-0000079', '476\1', '2006-12-19', 'BON', 'Ns. Fattura', '2006-12-19', 4320.00, 4320.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2007-RFN-0000013', '478\1', '2007-02-04', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2007-03-06', 260.00, 360.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2007-RFN-0000017', '485\1', '2007-02-15', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2007-03-17', 360.00, 360.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2007-RFN-0000018', '486\1', '2007-02-15', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2007-03-17', 144.00, 144.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2007-RFN-0000006', '490\1', '2007-01-25', 'RD', 'Ns. Fattura RD45F: RIMESSA DIRETTA 45 GG D.F.F.M.', '2007-03-31', 76080.00, 76080.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2007-RFN-0000012', '562\1', '2007-02-04', 'RB', 'Fattura di Vendita RB30F: R.B. 30 gg. d.f.f.m.', '2007-03-31', 360.00, 360.00, 0.00, false),
('d0000000-0000-0000-0000-000000000001', '2007-RFN-0000023', '503\1', '2007-03-07', 'RB', 'Ns. Fattura RB30: R.B. 30 gg. d.f.', '2007-04-06', 2664.00, 2664.00, 0.00, false);

-- 6. Product Categories
INSERT INTO product_categories (id, code, name)
VALUES 
('e0000000-0000-0000-0000-000000000001', 'OLIO', 'Olio Imbottigliato & Monovarietale'),
('e0000000-0000-0000-0000-000000000002', 'DOCG', 'Vini DOCG Imbottigliati'),
('e0000000-0000-0000-0000-000000000003', 'DOC', 'Vini DOC di Pregio'),
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
    'Estratto a freddo da olive Raggia e Leccino marchigiane, bottiglia scura anti-ossidazione con salvagoccia.',
    'e0000000-0000-0000-0000-000000000001',
    'Frantoio Marchigiano',
    'BT',
    '1 ST x BT',
    24.00,
    11.50,
    50.0,
    0.0,
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
    true
),
(
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'SAGR075',
    '800123450029',
    'SAGRANTINO DI MONTEFALCO X 0,75',
    'DOCG Imbottigliato 2021. 30 mesi di affinamento di cui 12 in barrique di rovere francese.',
    'e0000000-0000-0000-0000-000000000002',
    'Tenuta del Monte',
    'BT',
    '12 BT x CA12',
    18.00,
    8.20,
    20.0,
    10.0,
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=80',
    false
),
(
    'f0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'VD5',
    '800123450036',
    'VERDICCHIO DEI CASTELLI DI JESI DA LT. 5',
    'DOC Classico Superiore in Bag in Box / Dama professionale per mescita Horeca veloce.',
    'e0000000-0000-0000-0000-000000000003',
    'Cantine Jesine',
    'PZ',
    '1 PZ x PZ',
    8.40,
    4.10,
    10.0,
    5.0,
    'https://images.unsplash.com/photo-1558001373-a8a25c34e0fd?w=500&auto=format&fit=crop&q=80',
    false
),
(
    'f0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'RCON075',
    '800123450043',
    'ROSSO CONERO RISERVA DOCG 0,75',
    'Montepulciano in purezza delle pendici del Monte Conero, profumi intensi di marasca e spezie.',
    'e0000000-0000-0000-0000-000000000002',
    'Tenute Riviera',
    'BT',
    '6 BT x CA6',
    16.50,
    7.90,
    15.0,
    5.0,
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=500&auto=format&fit=crop&q=80',
    false
) ON CONFLICT (org_id, code) DO NOTHING;
