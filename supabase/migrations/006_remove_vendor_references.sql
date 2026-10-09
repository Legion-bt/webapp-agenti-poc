-- =============================================================================
-- 006 · Dati ERP neutri
-- =============================================================================
-- Da eseguire nel SQL Editor. Rieseguibile.
-- I dati demo generati in origine indicavano un gestionale con nome commerciale
-- (tipo connettore, endpoint, email dell'agente): li sostituisce con valori neutri.
-- =============================================================================

ALTER TABLE public.organizations ALTER COLUMN erp_connector_type SET DEFAULT 'GENERIC_REST';

UPDATE public.organizations
SET erp_connector_type = 'GENERIC_REST'
WHERE erp_connector_type IS NULL
   OR erp_connector_type NOT IN ('SAP_BUSINESS_ONE', 'ZUCCHETTI_AD HOC', 'GENERIC_REST');

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'erp_endpoint') THEN
        UPDATE public.organizations
        SET erp_endpoint = 'https://erp-gateway.example/v2/' || lower(code)
        WHERE erp_endpoint IS NOT NULL AND erp_endpoint NOT LIKE 'https://erp-gateway.example/%';
    END IF;
END;
$$;

-- Email segnaposto dell'agente demo (se non è già stata sostituita da quella di login).
UPDATE public.sales_agents
SET email = 'alessandro.manoni@example.local'
WHERE email ILIKE 'a.consalvo@%';
