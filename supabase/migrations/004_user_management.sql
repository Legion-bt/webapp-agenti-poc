-- =============================================================================
-- 004 · Gestione utenti dalla webapp
-- =============================================================================
-- Da eseguire nel SQL Editor DOPO la 002 e la 003. Rieseguibile.
--
-- Cosa cambia:
--   1. profiles.agent_id: l'utente AGENT è collegato alla sua scheda agente con un
--      riferimento esplicito (prima si confrontava sales_agents.email con l'email di
--      login). Una scheda agente può essere collegata a un solo utente.
--   2. app_agent_id() usa profiles.agent_id.
--   3. set_user_role(...) imposta agent_id (stessa firma della 002).
--
-- Creazione, modifica, password e disattivazione degli utenti passano dalla
-- Edge Function "admin-users" (supabase/functions/admin-users), che usa la chiave
-- service_role lato server e controlla i permessi di chi la chiama.
-- =============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.sales_agents(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_agent_id_key ON public.profiles (agent_id) WHERE agent_id IS NOT NULL;

-- Collega gli agenti già assegnati con set_user_role della 002 (match per email).
UPDATE public.profiles p
SET agent_id = a.id
FROM public.sales_agents a
WHERE p.role = 'AGENT'
  AND p.agent_id IS NULL
  AND a.org_id = p.org_id
  AND lower(a.email) = lower(p.email)
  AND NOT EXISTS (SELECT 1 FROM public.profiles o WHERE o.agent_id = a.id);

CREATE OR REPLACE FUNCTION public.app_agent_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT a.id
    FROM public.profiles p
    JOIN public.sales_agents a ON a.id = p.agent_id AND a.org_id = p.org_id
    WHERE p.id = auth.uid() AND p.role = 'AGENT';
$$;

-- La Edge Function scrive profiles con la service_role (che ignora la RLS).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

CREATE OR REPLACE FUNCTION public.set_user_role(
    p_email TEXT,
    p_role TEXT,
    p_org_code TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_agent_code TEXT DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_org_id UUID;
    v_agent_id UUID;
    v_agent_name TEXT;
BEGIN
    IF p_role NOT IN ('HQ_SUPERADMIN', 'ORG_ADMIN', 'AGENT') THEN
        RAISE EXCEPTION 'Ruolo non valido: % (usa HQ_SUPERADMIN, ORG_ADMIN o AGENT)', p_role;
    END IF;

    SELECT id, email INTO v_user_id, v_email FROM auth.users WHERE lower(email) = lower(p_email);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente % non trovato: crealo prima in Authentication > Users', p_email;
    END IF;

    IF p_org_code IS NOT NULL THEN
        SELECT id INTO v_org_id FROM public.organizations WHERE code = p_org_code;
        IF v_org_id IS NULL THEN
            RAISE EXCEPTION 'Organizzazione con codice % non trovata', p_org_code;
        END IF;
    ELSIF p_role <> 'HQ_SUPERADMIN' THEN
        RAISE EXCEPTION 'Per il ruolo % serve il codice organizzazione (p_org_code)', p_role;
    END IF;

    IF p_role = 'AGENT' AND p_agent_code IS NOT NULL THEN
        SELECT id, full_name INTO v_agent_id, v_agent_name
        FROM public.sales_agents WHERE org_id = v_org_id AND code = p_agent_code;
        IF v_agent_id IS NULL THEN
            RAISE EXCEPTION 'Agente con codice % non trovato in %', p_agent_code, p_org_code;
        END IF;
        -- La scheda agente passa a questo utente.
        UPDATE public.profiles SET agent_id = NULL, updated_at = NOW()
        WHERE agent_id = v_agent_id AND id <> v_user_id;
    END IF;

    INSERT INTO public.profiles AS p (id, email, first_name, last_name, role, org_id, agent_id)
    VALUES (
        v_user_id, v_email,
        coalesce(p_first_name, split_part(v_agent_name, ' ', 1), split_part(v_email, '@', 1)),
        coalesce(p_last_name, nullif(substr(v_agent_name, length(split_part(v_agent_name, ' ', 1)) + 2), ''), ''),
        p_role, v_org_id, v_agent_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        org_id = EXCLUDED.org_id,
        agent_id = CASE WHEN EXCLUDED.role = 'AGENT' THEN coalesce(EXCLUDED.agent_id, p.agent_id) END,
        first_name = coalesce(p_first_name, split_part(v_agent_name, ' ', 1), p.first_name),
        last_name = coalesce(p_last_name, nullif(substr(v_agent_name, length(split_part(v_agent_name, ' ', 1)) + 2), ''), p.last_name),
        updated_at = NOW();

    RETURN format('%s -> %s%s%s', v_email, p_role,
        CASE WHEN p_org_code IS NOT NULL THEN ' (' || p_org_code || ')' ELSE '' END,
        CASE WHEN v_agent_name IS NOT NULL THEN ' = agente ' || v_agent_name ELSE '' END);
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
