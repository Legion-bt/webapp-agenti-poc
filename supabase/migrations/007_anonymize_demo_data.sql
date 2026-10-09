-- =============================================================================
-- 007 · Dati demo anonimi
-- =============================================================================
-- Da eseguire nel SQL Editor. Rieseguibile.
-- Sostituisce nomi di persone e aziende, partite IVA, codici fiscali, IBAN,
-- telefoni, email e indirizzi dei dati demo con valori inventati.
-- NON tocca gli utenti di accesso (auth.users / public.profiles) né le email
-- degli agenti già collegate a un utente di login.
-- =============================================================================

-- Organizzazioni -----------------------------------------------------------------
UPDATE public.organizations SET
    name = 'Vigneti & Oliveti Adriatici S.p.A.',
    legal_name = 'Vigneti & Oliveti Adriatici Società Agricola S.p.A.',
    vat_number = 'IT90000000101',
    address = 'Via delle Industrie, 10'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.organizations SET
    name = 'Poderi delle Colline Toscane',
    legal_name = 'Poderi delle Colline Toscane S.r.l.',
    vat_number = 'IT90000000102',
    address = 'Via dei Poderi, 20'
WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- Agenti -------------------------------------------------------------------------
UPDATE public.sales_agents SET full_name = 'Davide Ferraresi', phone = '+39 300 0000301'
WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE public.sales_agents SET phone = '+39 300 0000304'
WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE public.sales_agents SET phone = '+39 300 0000305'
WHERE id = 'b0000000-0000-0000-0000-000000000003';

-- Email segnaposto solo se non è l'email di un utente di login.
UPDATE public.sales_agents a SET email = v.email
FROM (VALUES
    ('b0000000-0000-0000-0000-000000000001'::UUID, 'davide.ferraresi@example.local'),
    ('b0000000-0000-0000-0000-000000000002'::UUID, 'giulia.bianchi@example.local'),
    ('b0000000-0000-0000-0000-000000000003'::UUID, 'marco.conti@example.local')
) AS v(id, email)
WHERE a.id = v.id
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(a.email));

-- Clienti ------------------------------------------------------------------------
UPDATE public.customers SET
    business_name = 'VERDEMARE FORNITURE SPA',
    vat_number = 'IT90000000301',
    tax_code = '90000000301',
    email = 'amministrazione@verdemare.example',
    pec = 'verdemareforniture@pec.example',
    phone = '0721 000301',
    mobile = '300 0000311',
    address = 'VIA DEI TIGLI, 12',
    iban = 'IT00X0000000000000000000301'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

UPDATE public.customers c SET
    business_name = v.business_name,
    vat_number = v.vat_number,
    tax_code = v.tax_code,
    email = v.email,
    phone = v.phone
FROM (VALUES
    ('d0000000-0000-0000-0000-000000000002'::UUID, 'HOTEL ONDA AZZURRA SRL',          'IT90000000311', '90000000311', 'amministrazione@ondaazzurra.example', '0721 000311'),
    ('d0000000-0000-0000-0000-000000000003'::UUID, 'RISTORANTE LE TRE VELE SNC',      'IT90000000312', '90000000312', 'info@trevele.example',                '0541 000312'),
    ('d0000000-0000-0000-0000-000000000004'::UUID, 'ENOTECA DEL DUCA SRL',            'IT90000000313', '90000000313', 'enotecadelduca@example.local',        '0722 000313'),
    ('d0000000-0000-0000-0000-000000000005'::UUID, 'GRAND HOTEL SCOGLIERA SPA',       'IT90000000314', '90000000314', 'acquisti@scogliera.example',          '071 000314'),
    ('d0000000-0000-0000-0000-000000000006'::UUID, 'TRATTORIA IL MULINO SNC',         'IT90000000315', '90000000315', 'trattoriamulino@example.local',       '0733 000315'),
    ('d0000000-0000-0000-0000-000000000007'::UUID, 'BOTTEGA DEI SAPORI SRL',          'IT90000000316', '90000000316', 'ordini@bottegasapori.example',        '071 000316'),
    ('d0000000-0000-0000-0000-000000000008'::UUID, 'OSTERIA DEL VICOLO SRL',          'IT90000000317', '90000000317', 'amministrazione@vicolo.example',      '055 000317'),
    ('d0000000-0000-0000-0000-000000000009'::UUID, 'RELAIS POGGIO ALTO',              'IT90000000318', '90000000318', 'booking@poggioalto.example',          '0577 000318'),
    ('d0000000-0000-0000-0000-000000000010'::UUID, 'ALIMENTARI LA DISPENSA',          'IT90000000319', '90000000319', 'ladispensa@example.local',            '055 000319')
) AS v(id, business_name, vat_number, tax_code, email, phone)
WHERE c.id = v.id;
