-- =============================================================================
-- 010 · Connettori ERP
-- =============================================================================
-- Da eseguire nel SQL Editor. Rieseguibile.
-- Connettori disponibili:
--   ESOLVER_REST  "Sistemi - RestAPI - Esolver" (integrazione prevista)
--   GENERIC_REST  "Gateway REST generico"
-- Il vecchio SAP_BUSINESS_ONE diventa ESOLVER_REST; qualsiasi altro valore
-- diventa GENERIC_REST. Un vincolo impedisce valori diversi da questi due.
-- =============================================================================

UPDATE public.organizations SET erp_connector_type = 'ESOLVER_REST'
WHERE erp_connector_type = 'SAP_BUSINESS_ONE';

UPDATE public.organizations SET erp_connector_type = 'GENERIC_REST'
WHERE erp_connector_type IS NULL OR erp_connector_type NOT IN ('ESOLVER_REST', 'GENERIC_REST');

ALTER TABLE public.organizations ALTER COLUMN erp_connector_type SET DEFAULT 'GENERIC_REST';
ALTER TABLE public.organizations ALTER COLUMN erp_connector_type SET NOT NULL;

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_erp_connector_type_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_erp_connector_type_check
    CHECK (erp_connector_type IN ('ESOLVER_REST', 'GENERIC_REST'));
