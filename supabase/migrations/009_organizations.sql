-- =============================================================================
-- 009 · Gestione organizzazioni dalla webapp
-- =============================================================================
-- Da eseguire nel SQL Editor. Rieseguibile.
-- La sede (HQ_SUPERADMIN) crea e modifica le organizzazioni dalla pagina
-- "Organizzazioni" (le policy di insert/update ci sono già dalla 002).
--   1. Le organizzazioni non si eliminano più (l'eliminazione cancellava a
--      cascata clienti, ordini e agenti): si disattivano (active = false).
--   2. Gli utenti di un'organizzazione disattivata perdono l'accesso ai dati:
--      app_role() restituisce NULL e tutte le policy li escludono.
--      La sede non è toccata.
-- =============================================================================

DROP POLICY IF EXISTS organizations_delete ON public.organizations;
REVOKE DELETE ON public.organizations FROM authenticated;

UPDATE public.organizations SET active = true WHERE active IS NULL;
ALTER TABLE public.organizations ALTER COLUMN active SET DEFAULT true;
ALTER TABLE public.organizations ALTER COLUMN active SET NOT NULL;

CREATE OR REPLACE FUNCTION public.app_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT p.role
    FROM public.profiles p
    LEFT JOIN public.organizations o ON o.id = p.org_id
    WHERE p.id = auth.uid()
      AND (p.role = 'HQ_SUPERADMIN' OR o.active IS DISTINCT FROM false);
$$;
