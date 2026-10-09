-- =============================================================================
-- 007 · Dati demo anonimi
-- =============================================================================
-- Da eseguire nel SQL Editor. Rieseguibile.
-- Sostituisce con valori inventati tutti i dati demo che richiamavano persone,
-- aziende, luoghi, banche, denominazioni di vini o documenti reali:
-- nomi, partite IVA, codici fiscali, IBAN, telefoni, email, indirizzi, città,
-- province (sigle fittizie XA–XE, CAP 99xxx), aree, banche, articoli, categorie,
-- partite aperte e importi del cliente di esempio.
-- NON tocca gli utenti di accesso (auth.users / public.profiles) né le email
-- degli agenti già collegate a un utente di login, né gli ordini inseriti.
-- =============================================================================

-- Organizzazioni -----------------------------------------------------------------
UPDATE public.organizations SET
    name = 'Vigneti & Oliveti di Valdoro S.p.A.',
    legal_name = 'Vigneti & Oliveti di Valdoro Società Agricola S.p.A.',
    vat_number = 'IT90000000101',
    address = 'Via dell''Artigianato, 42',
    city = 'Valdoro',
    province = 'XA'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.organizations SET
    name = 'Poderi di Collemiro',
    legal_name = 'Poderi di Collemiro S.r.l.',
    vat_number = 'IT90000000102',
    address = 'Via dei Vigneti, 112',
    city = 'Collemiro',
    province = 'XD'
WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- Agenti -------------------------------------------------------------------------
UPDATE public.sales_agents SET full_name = 'Davide Ferraresi', phone = '+39 300 0000301',
    area = 'Porto Selene & Rocca Ventosa'
WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE public.sales_agents SET phone = '+39 300 0000304', area = 'Fontechiara & Montecerro'
WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE public.sales_agents SET phone = '+39 300 0000305', area = 'Collemiro & Monteluna'
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

-- Listini ------------------------------------------------------------------------
UPDATE public.price_lists SET name = replace(name, 'Toscana', 'Collemiro')
WHERE name LIKE '%Toscana%';

-- Clienti ------------------------------------------------------------------------
-- Importi del cliente di esempio: l'esposizione viene ridotta della stessa
-- differenza, così restano conteggiati gli ordini già inseriti. Il filtro
-- sull'importo originale rende l'aggiornamento idempotente.
UPDATE public.customers SET
    credit_limit = 180000.00,
    current_exposure = GREATEST(current_exposure - 753342.18, 0),
    overdue_amount = 92415.30
WHERE id = 'd0000000-0000-0000-0000-000000000001' AND overdue_amount = 811008.82;

UPDATE public.customers SET
    code = '000301',
    business_name = 'VERDEMARE FORNITURE SPA',
    vat_number = 'IT90000000301',
    tax_code = '90000000301',
    email = 'amministrazione@verdemare.example',
    pec = 'verdemareforniture@pec.example',
    phone = '0000 000301',
    mobile = '300 0000311',
    address = 'VIA DEI TIGLI, 12',
    city = 'BORGO LUMINA',
    province = 'XA',
    postal_code = '99012',
    area = 'VALDORO NORD',
    iban = 'IT00X0000000000000000000301',
    bank_name = 'BANCA DEL TERRITORIO VALDORESE'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

UPDATE public.customers c SET
    business_name = v.business_name,
    vat_number = v.vat_number,
    tax_code = v.vat_number_digits,
    email = v.email,
    phone = v.phone,
    address = v.address,
    city = v.city,
    province = v.province,
    postal_code = v.postal_code,
    area = v.area,
    bank_name = v.bank_name
FROM (VALUES
    ('d0000000-0000-0000-0000-000000000002'::UUID, 'HOTEL ONDA AZZURRA SRL', 'IT90000000311', '90000000311',
     'amministrazione@ondaazzurra.example', '0000 000311', 'Viale delle Palme, 210', 'Porto Selene', 'XB', '99020',
     'Porto Selene & Rocca Ventosa', 'BANCA DI ROCCA VENTOSA'),
    ('d0000000-0000-0000-0000-000000000003'::UUID, 'RISTORANTE LE TRE VELE SNC', 'IT90000000312', '90000000312',
     'info@trevele.example', '0000 000312', 'Lungomare delle Vele, 15', 'Torre Marina', 'XB', '99027',
     'Porto Selene & Rocca Ventosa', 'BANCA DI TORRE MARINA'),
    ('d0000000-0000-0000-0000-000000000004'::UUID, 'ENOTECA DEL DUCA SRL', 'IT90000000313', '90000000313',
     'enotecadelduca@example.local', '0000 000313', 'Via dei Pittori, 44', 'Rocca Ventosa', 'XB', '99023',
     'Porto Selene & Rocca Ventosa', 'CREDITO COOPERATIVO DI FONTECHIARA'),
    ('d0000000-0000-0000-0000-000000000005'::UUID, 'GRAND HOTEL SCOGLIERA SPA', 'IT90000000314', '90000000314',
     'acquisti@scogliera.example', '0000 000314', 'Via della Scogliera, 1', 'Fontechiara', 'XC', '99030',
     'Fontechiara & Montecerro', 'CASSA DI RISPARMIO DI PORTO SELENE'),
    ('d0000000-0000-0000-0000-000000000006'::UUID, 'TRATTORIA IL MULINO SNC', 'IT90000000315', '90000000315',
     'trattoriamulino@example.local', '0000 000315', 'Corso del Mulino, 87', 'Montecerro', 'XC', '99032',
     'Fontechiara & Montecerro', 'BANCA DI MONTECERRO'),
    ('d0000000-0000-0000-0000-000000000007'::UUID, 'BOTTEGA DEI SAPORI SRL', 'IT90000000316', '90000000316',
     'ordini@bottegasapori.example', '0000 000316', 'Piazza del Borgo, 3', 'Punta Corallo', 'XC', '99034',
     'Fontechiara & Montecerro', 'BANCA DI PUNTA CORALLO'),
    ('d0000000-0000-0000-0000-000000000008'::UUID, 'OSTERIA DEL VICOLO SRL', 'IT90000000317', '90000000317',
     'amministrazione@vicolo.example', '0000 000317', 'Via del Vicolo Stretto, 24', 'Collemiro', 'XD', '99050',
     'Collemiro & Monteluna', 'CASSA DI RISPARMIO DI COLLEMIRO'),
    ('d0000000-0000-0000-0000-000000000009'::UUID, 'RELAIS POGGIO ALTO', 'IT90000000318', '90000000318',
     'booking@poggioalto.example', '0000 000318', 'Strada del Poggio, 9', 'Monteluna', 'XD', '99055',
     'Collemiro & Monteluna', 'BANCA DEL TERRITORIO VALDORESE'),
    ('d0000000-0000-0000-0000-000000000010'::UUID, 'ALIMENTARI LA DISPENSA', 'IT90000000319', '90000000319',
     'ladispensa@example.local', '0000 000319', 'Piazza del Mercato, 18', 'Poggio ai Mandorli', 'XD', '99052',
     'Collemiro & Monteluna', 'BANCA DEI POGGI')
) AS v(id, business_name, vat_number, vat_number_digits, email, phone, address, city, province, postal_code,
       area, bank_name)
WHERE c.id = v.id;

-- Partite aperte del cliente di esempio ------------------------------------------
-- Numeri, riferimenti, date (+18 anni) e importi diversi da quelli di partenza.
UPDATE public.customer_suspended_items SET
    doc_number = replace(replace(replace(doc_number, '2006-', '2024-'), '2007-', '2025-'), '-RFN-', '-FT-'),
    internal_ref = CASE
        WHEN internal_ref ~ '^[0-9]+\\1$' THEN (split_part(internal_ref, '\', 1)::INT + 301)::TEXT || '\1'
        ELSE internal_ref
    END,
    doc_date = doc_date + INTERVAL '18 years',
    due_date = due_date + INTERVAL '18 years',
    balance = CASE balance WHEN 83.57 THEN 47.20 WHEN 86400 THEN 31250 WHEN 4320 THEN 1580 WHEN 260 THEN 210
        WHEN 360 THEN 290 WHEN 144 THEN 96 WHEN 76080 THEN 28940 WHEN 2664 THEN 985 ELSE balance END,
    amount = CASE amount WHEN 83.57 THEN 47.20 WHEN 86400 THEN 31250 WHEN 4320 THEN 1580 WHEN 260 THEN 210
        WHEN 360 THEN 290 WHEN 144 THEN 96 WHEN 76080 THEN 28940 WHEN 2664 THEN 985 ELSE amount END,
    to_collect = CASE to_collect WHEN 73400 THEN 26800 ELSE to_collect END
WHERE doc_number LIKE '%-RFN-%';

-- Categorie e articoli -----------------------------------------------------------
UPDATE public.product_categories SET code = 'RISERVA', name = 'Vini Rossi Riserva' WHERE code = 'DOCG';
UPDATE public.product_categories SET code = 'SELEZIONE', name = 'Vini Selezione' WHERE code = 'DOC';

UPDATE public.products p SET
    code = v.new_code,
    name = v.name,
    description = v.description,
    brand = v.brand
FROM (VALUES
    ('OLEXT075', 'OLEXT075', 'OLIO EXTRAVERGINE D''OLIVA "DEL FRANTOIO" 0,75',
     'Estratto a freddo da olive di cultivar del territorio, bottiglia scura anti-ossidazione con salvagoccia.',
     'Frantoio Valdoro'),
    ('SAGR075', 'RRIS075', 'ROSSO RISERVA "VALDORO" 0,75',
     'Annata 2021. 30 mesi di affinamento di cui 12 in barrique di rovere francese.',
     'Tenuta Valdoro'),
    ('VD5', 'BBIB5', 'BIANCO FERMO "FONTECHIARA" BAG-IN-BOX LT. 5',
     'Bianco fermo in Bag in Box / Dama professionale per mescita Horeca veloce.',
     'Cantina Fontechiara'),
    ('RCON075', 'RSUP075', 'ROSSO SUPERIORE "ROCCA VENTOSA" 0,75',
     'Rosso da uve a bacca nera dei rilievi collinari, profumi intensi di marasca e spezie.',
     'Tenuta Rocca Ventosa'),
    ('LACR075', 'RARO075', 'ROSSO AROMATICO "MONTELUNA" 0,75',
     'Vino rosso aromatico dalle intense note floreali di rosa e viola. Morbido al palato.',
     'Podere Monteluna'),
    ('PECO075', 'BSAP075', 'BIANCO SAPIDO "COLLEMIRO" 0,75',
     'Bianco strutturato, buona acidità e sapidità: con formaggi e piatti di pesce.',
     'Cantina Collemiro'),
    ('ACET250', 'ACET250', 'CONDIMENTO AGRODOLCE INVECCHIATO 250ML',
     'Condimento di mosto cotto affinato in botti di legni pregiati. Denso, sapore agrodolce armonico.',
     'Acetaia Borgo Lumina'),
    ('OLIDOP050', 'OLSEL050', 'OLIO EXTRAVERGINE "BORGO LUMINA" 0,50',
     'Selezione da ulivi secolari delle colline di Borgo Lumina, fruttato leggero con piccante fine.',
     'Frantoio Valdoro')
) AS v(old_code, new_code, name, description, brand)
WHERE p.code = v.old_code;

-- Le immagini esterne vengono rimosse dalla 008 (bucket privato product-images).
