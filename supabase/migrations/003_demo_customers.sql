-- =============================================================================
-- 003 · Dati demo per provare i permessi (seconda organizzazione, agenti, clienti)
-- =============================================================================
-- Da eseguire nel SQL Editor DOPO la 002. Rieseguibile: non duplica le righe.
--
-- Risultato:
--   ORG-01 Cantine & Frantoi Marchigiani   agente 3 Alessandro Manoni  -> 4 clienti
--                                          agente 7 Giulia Bianchi     -> 3 clienti
--   ORG-02 Tenute Chianti & Olio Toscano   agente 2 Marco Conti        -> 3 clienti
-- Le email degli agenti sono segnaposto: set_user_role(..., p_agent_code => '...')
-- le sostituisce con quella dell'utente di login.
-- =============================================================================

-- Organizzazione 2 -------------------------------------------------------------
INSERT INTO public.organizations (id, code, name, legal_name, vat_number, address, city, province, erp_connector_type, erp_status)
VALUES ('a0000000-0000-0000-0000-000000000002', 'ORG-02', 'Tenute Chianti & Olio Toscano',
        'Tenute Chianti & Olio Toscano S.r.l.', 'IT05518230487', 'Via Chiantigiana, 112', 'Greve in Chianti', 'FI',
        'APRA_ERP', 'CONNECTED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_lists (id, org_id, code, name)
VALUES ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '02_001', '02_001 Listino Toscana 2026')
ON CONFLICT (id) DO NOTHING;

-- Agenti -------------------------------------------------------------------------
INSERT INTO public.sales_agents (id, org_id, code, full_name, email, phone, area, commission_rate, monthly_target, yearly_target)
VALUES
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '7', 'Giulia Bianchi',
     'giulia.bianchi@example.local', '+39 333 1122334', 'Ancona & Macerata', 5.00, 30000, 360000),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', '2', 'Marco Conti',
     'marco.conti@example.local', '+39 347 5566778', 'Firenze & Siena', 6.00, 40000, 480000)
ON CONFLICT (id) DO NOTHING;

-- Clienti ------------------------------------------------------------------------
INSERT INTO public.customers (
    id, org_id, code, business_name, vat_number, tax_code, email, phone, address, city, province, postal_code,
    area, sales_agent_id, price_list_id, payment_term, bank_name, delivery_notes,
    credit_limit, current_exposure, overdue_amount, status, category
) VALUES
    -- ORG-01 · Alessandro Manoni (agente 3)
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '000031',
     'HOTEL LUNGOMARE PESARO SRL', 'IT02233440418', '02233440418', 'amministrazione@hotellungomare.example', '0721 334455',
     'Viale Trieste, 210', 'Pesaro', 'PU', '61121', 'Pesaro - Urbino & Romagna',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'Ri.Ba. 60 gg. d.f.', 'BANCA DI PESARO', 'Consegna ingresso fornitori lato mare, 7:00-10:30.',
     60000, 18450.00, 0, 'ACTIVE', 'HOTEL 3-4'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '000032',
     'RISTORANTE IL GAMBERO ROSSO SNC', 'IT02455660416', '02455660416', 'info@gamberorosso.example', '0541 778899',
     'Lungomare Murri, 15', 'Rimini', 'RN', '47921', 'Pesaro - Urbino & Romagna',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'Bonifico bancario 30 gg. d.f.', 'CREDIT AGRICOLE', 'Chiuso il lunedì.',
     25000, 9870.50, 2150.00, 'ACTIVE', 'RISTORANTE'),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '000033',
     'ENOTECA URBINATE DI SANTI MARCO', 'IT02566770419', 'SNTMRC80A01L500X', 'enoteca.urbinate@example.it', '0722 112233',
     'Via Raffaello, 44', 'Urbino', 'PU', '61029', 'Pesaro - Urbino & Romagna',
     'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'Rimessa diretta', 'BPER BANCA', NULL,
     15000, 0, 0, 'POTENTIAL', 'ENOTECA'),

    -- ORG-01 · Giulia Bianchi (agente 7)
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '000040',
     'GRAND HOTEL PASSETTO SPA', 'IT01122330424', '01122330424', 'acquisti@grandhotelpassetto.example', '071 445566',
     'Via Thaon de Revel, 1', 'Ancona', 'AN', '60124', 'Ancona & Macerata',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
     'Bonifico bancario 60 - 90 gg. d.f.', 'INTESA SANPAOLO', 'Scarico da rampa interrata.',
     120000, 64300.00, 0, 'ACTIVE', 'HOTEL 5'),
    ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '000041',
     'TRATTORIA DA ROSA DI ROSA BALDI', 'IT01233440432', 'BLDRSO65D41E783K', 'trattoriadarosa@example.it', '0733 223344',
     'Corso Cavour, 87', 'Macerata', 'MC', '62100', 'Ancona & Macerata',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
     'Ri.Ba. 30 gg. d.f.', 'BANCA MACERATA', NULL,
     12000, 11650.00, 4800.00, 'BLOCKED', 'RISTORANTE'),
    ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '000042',
     'BOTTEGA DEL CONERO SRL', 'IT01344550425', '01344550425', 'ordini@bottegaconero.example', '071 9330011',
     'Piazza Roma, 3', 'Sirolo', 'AN', '60020', 'Ancona & Macerata',
     'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
     'Bonifico bancario 30 gg. d.f.', 'UNICREDIT', 'Stagionale: aperto aprile-ottobre.',
     30000, 7420.00, 0, 'ACTIVE', 'GASTRONOMIA'),

    -- ORG-02 · Marco Conti (agente 2)
    ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', '100001',
     'OSTERIA DEL PORCELLINO SRL', 'IT06677880481', '06677880481', 'amministrazione@porcellino.example', '055 2399001',
     'Via Porta Rossa, 24', 'Firenze', 'FI', '50123', 'Firenze & Siena',
     'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002',
     'Bonifico bancario 30 - 60 gg. d.f.', 'BANCA CR FIRENZE', 'ZTL: consegna entro le 9:30.',
     40000, 15200.00, 0, 'ACTIVE', 'RISTORANTE'),
    ('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', '100002',
     'RELAIS LE CRETE SENESI', 'IT01455660527', '01455660527', 'booking@relaiscrete.example', '0577 707070',
     'Strada di Leonina, 9', 'Asciano', 'SI', '53041', 'Firenze & Siena',
     'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002',
     'Ri.Ba. 90 gg. d.f.', 'MONTE DEI PASCHI DI SIENA', 'Strada bianca: preavvisare consegna con furgoni grandi.',
     80000, 52300.00, 8900.00, 'ACTIVE', 'HOTEL 5'),
    ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', '100003',
     'ALIMENTARI SAPORI DI CHIANTI', 'IT07788990480', 'GRCLCU72B12D612P', 'saporidichianti@example.it', '055 853300',
     'Piazza Matteotti, 18', 'Greve in Chianti', 'FI', '50022', 'Firenze & Siena',
     'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002',
     'Rimessa diretta', 'CHIANTIBANCA', NULL,
     10000, 1240.00, 0, 'ACTIVE', 'GASTRONOMIA')
ON CONFLICT (id) DO NOTHING;
