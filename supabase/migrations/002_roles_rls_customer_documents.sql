-- =============================================================================
-- 002 · Ruoli reali, RLS per ruolo, documenti PDF dei clienti
-- =============================================================================
-- Da eseguire nel SQL Editor di Supabase. Rieseguibile (idempotente).
--
-- Cosa fa:
--   1. Crea public.profiles (ruolo + organizzazione per ogni utente di Auth).
--   2. Funzioni helper per le policy (ruolo, org e agente dell'utente corrente).
--   3. Rimuove le policy demo "USING (true)" e applica policy per ruolo:
--        HQ_SUPERADMIN -> tutto
--        ORG_ADMIN     -> solo la propria organizzazione
--        AGENT         -> solo i clienti/ordini assegnati a lui
--   4. Crea public.customer_documents + bucket Storage privato "customer-documents"
--      (solo PDF, max 20 MB) con le stesse regole di visibilità del cliente.
--   5. Crea public.set_user_role(...) per assegnare i ruoli dal SQL Editor.
--
-- L'agente è collegato al suo utente tramite l'email: sales_agents.email = email di login.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'AGENT' CHECK (role IN ('HQ_SUPERADMIN', 'ORG_ADMIN', 'AGENT')),
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS (SECURITY DEFINER: leggono profiles senza ricorsione RLS)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.app_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.app_agent_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT a.id
    FROM public.sales_agents a
    JOIN public.profiles p ON lower(a.email) = lower(p.email) AND a.org_id = p.org_id
    WHERE p.id = auth.uid()
    LIMIT 1;
$$;

-- Visibilità di un cliente per l'utente corrente (stessa regola per clienti, sospesi, documenti).
CREATE OR REPLACE FUNCTION public.can_access_customer(p_customer_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = p_customer_id
          AND (
               public.app_role() = 'HQ_SUPERADMIN'
            OR (public.app_role() = 'ORG_ADMIN' AND c.org_id = public.app_org_id())
            OR (public.app_role() = 'AGENT' AND c.sales_agent_id = public.app_agent_id())
          )
    );
$$;

-- Estrae il customer_id dal path Storage "<customer_id>/<file>.pdf" (NULL se non valido).
CREATE OR REPLACE FUNCTION public.storage_customer_id(p_name TEXT)
RETURNS UUID LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
BEGIN
    RETURN split_part(p_name, '/', 1)::UUID;
EXCEPTION WHEN others THEN
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.app_role(), public.app_org_id(), public.app_agent_id(),
    public.can_access_customer(UUID), public.storage_customer_id(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_role(), public.app_org_id(), public.app_agent_id(),
    public.can_access_customer(UUID), public.storage_customer_id(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. CUSTOMER DOCUMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    uploaded_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_documents_customer_id_idx ON public.customer_documents (customer_id);

-- org_id e autore sono decisi dal server, non dal client.
CREATE OR REPLACE FUNCTION public.customer_documents_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    SELECT org_id INTO NEW.org_id FROM public.customers WHERE id = NEW.customer_id;
    NEW.uploaded_by := auth.uid();
    SELECT nullif(trim(first_name || ' ' || last_name), '') INTO NEW.uploaded_by_name
    FROM public.profiles WHERE id = auth.uid();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customer_documents_before_insert ON public.customer_documents;
CREATE TRIGGER customer_documents_before_insert
    BEFORE INSERT ON public.customer_documents
    FOR EACH ROW EXECUTE FUNCTION public.customer_documents_before_insert();

-- -----------------------------------------------------------------------------
-- 4. RLS: via tutte le policy esistenti (incluse quelle demo "USING (true)")
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('organizations', 'profiles', 'sales_agents', 'customers',
                            'customer_suspended_items', 'customer_documents', 'orders',
                            'products', 'product_categories', 'price_lists')
    LOOP
        EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END;
$$;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_suspended_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

-- Niente accesso anonimo; agli utenti autenticati decidono le policy.
REVOKE ALL ON public.organizations, public.profiles, public.sales_agents, public.customers,
    public.customer_suspended_items, public.customer_documents, public.orders,
    public.products, public.product_categories, public.price_lists FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations, public.sales_agents, public.customers,
    public.customer_suspended_items, public.orders, public.products, public.product_categories,
    public.price_lists TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.customer_documents TO authenticated;

-- ORGANIZATIONS ---------------------------------------------------------------
CREATE POLICY organizations_select ON public.organizations FOR SELECT TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR id = public.app_org_id());
CREATE POLICY organizations_insert ON public.organizations FOR INSERT TO authenticated
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN');
CREATE POLICY organizations_update ON public.organizations FOR UPDATE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN') WITH CHECK (public.app_role() = 'HQ_SUPERADMIN');
CREATE POLICY organizations_delete ON public.organizations FOR DELETE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN');

-- PROFILES (scrittura solo dal SQL Editor tramite set_user_role) --------------
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR public.app_role() = 'HQ_SUPERADMIN'
        OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id())
    );

-- SALES AGENTS ----------------------------------------------------------------
CREATE POLICY sales_agents_select ON public.sales_agents FOR SELECT TO authenticated
    USING (
        public.app_role() = 'HQ_SUPERADMIN'
        OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id())
        OR id = public.app_agent_id()
    );
CREATE POLICY sales_agents_insert ON public.sales_agents FOR INSERT TO authenticated
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));
CREATE POLICY sales_agents_update ON public.sales_agents FOR UPDATE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()))
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));
CREATE POLICY sales_agents_delete ON public.sales_agents FOR DELETE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));

-- CUSTOMERS (gli agenti leggono, l'anagrafica la gestiscono manager e sede) ----
CREATE POLICY customers_select ON public.customers FOR SELECT TO authenticated
    USING (
        public.app_role() = 'HQ_SUPERADMIN'
        OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id())
        OR (public.app_role() = 'AGENT' AND sales_agent_id = public.app_agent_id())
    );
CREATE POLICY customers_insert ON public.customers FOR INSERT TO authenticated
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));
CREATE POLICY customers_update ON public.customers FOR UPDATE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()))
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));
CREATE POLICY customers_delete ON public.customers FOR DELETE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));

-- CUSTOMER SUSPENDED ITEMS ----------------------------------------------------
CREATE POLICY suspended_select ON public.customer_suspended_items FOR SELECT TO authenticated
    USING (public.can_access_customer(customer_id));
CREATE POLICY suspended_insert ON public.customer_suspended_items FOR INSERT TO authenticated
    WITH CHECK (public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN') AND public.can_access_customer(customer_id));
CREATE POLICY suspended_update ON public.customer_suspended_items FOR UPDATE TO authenticated
    USING (public.can_access_customer(customer_id)) WITH CHECK (public.can_access_customer(customer_id));
CREATE POLICY suspended_delete ON public.customer_suspended_items FOR DELETE TO authenticated
    USING (public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN') AND public.can_access_customer(customer_id));

-- CUSTOMER DOCUMENTS (chi vede il cliente vede e carica i documenti;
-- elimina l'autore del caricamento oppure manager/sede) ------------------------
CREATE POLICY customer_documents_select ON public.customer_documents FOR SELECT TO authenticated
    USING (public.can_access_customer(customer_id));
CREATE POLICY customer_documents_insert ON public.customer_documents FOR INSERT TO authenticated
    WITH CHECK (public.can_access_customer(customer_id));
CREATE POLICY customer_documents_delete ON public.customer_documents FOR DELETE TO authenticated
    USING (
        public.can_access_customer(customer_id)
        AND (uploaded_by = auth.uid() OR public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN'))
    );

-- ORDERS ----------------------------------------------------------------------
CREATE POLICY orders_select ON public.orders FOR SELECT TO authenticated
    USING (
        public.app_role() = 'HQ_SUPERADMIN'
        OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id())
        OR (public.app_role() = 'AGENT' AND sales_agent_id = public.app_agent_id())
    );
CREATE POLICY orders_insert ON public.orders FOR INSERT TO authenticated
    WITH CHECK (
        public.app_role() = 'HQ_SUPERADMIN'
        OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id())
        OR (public.app_role() = 'AGENT' AND sales_agent_id = public.app_agent_id() AND public.can_access_customer(customer_id))
    );
CREATE POLICY orders_update ON public.orders FOR UPDATE TO authenticated
    USING (
        public.app_role() = 'HQ_SUPERADMIN'
        OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id())
        OR (public.app_role() = 'AGENT' AND sales_agent_id = public.app_agent_id())
    )
    WITH CHECK (
        public.app_role() = 'HQ_SUPERADMIN'
        OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id())
        OR (public.app_role() = 'AGENT' AND sales_agent_id = public.app_agent_id())
    );
CREATE POLICY orders_delete ON public.orders FOR DELETE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));

-- CATALOGO (lettura per tutti gli autenticati, scrittura manager/sede) --------
CREATE POLICY products_select ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY products_insert ON public.products FOR INSERT TO authenticated
    WITH CHECK (public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN'));
CREATE POLICY products_update ON public.products FOR UPDATE TO authenticated
    USING (public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN')) WITH CHECK (public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN'));
CREATE POLICY products_delete ON public.products FOR DELETE TO authenticated
    USING (public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN'));

CREATE POLICY product_categories_select ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY product_categories_insert ON public.product_categories FOR INSERT TO authenticated
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN');
CREATE POLICY product_categories_update ON public.product_categories FOR UPDATE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN') WITH CHECK (public.app_role() = 'HQ_SUPERADMIN');
CREATE POLICY product_categories_delete ON public.product_categories FOR DELETE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN');

CREATE POLICY price_lists_select ON public.price_lists FOR SELECT TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR org_id = public.app_org_id());
CREATE POLICY price_lists_insert ON public.price_lists FOR INSERT TO authenticated
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));
CREATE POLICY price_lists_update ON public.price_lists FOR UPDATE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()))
    WITH CHECK (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));
CREATE POLICY price_lists_delete ON public.price_lists FOR DELETE TO authenticated
    USING (public.app_role() = 'HQ_SUPERADMIN' OR (public.app_role() = 'ORG_ADMIN' AND org_id = public.app_org_id()));

-- -----------------------------------------------------------------------------
-- 5. STORAGE: bucket privato per i PDF
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('customer-documents', 'customer-documents', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
    SET public = false,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS customer_documents_objects_select ON storage.objects;
DROP POLICY IF EXISTS customer_documents_objects_insert ON storage.objects;
DROP POLICY IF EXISTS customer_documents_objects_delete ON storage.objects;

CREATE POLICY customer_documents_objects_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'customer-documents' AND public.can_access_customer(public.storage_customer_id(name)));
CREATE POLICY customer_documents_objects_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'customer-documents' AND public.can_access_customer(public.storage_customer_id(name)));
CREATE POLICY customer_documents_objects_delete ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'customer-documents'
        AND public.can_access_customer(public.storage_customer_id(name))
        AND (
            public.app_role() IN ('HQ_SUPERADMIN', 'ORG_ADMIN')
            OR EXISTS (
                SELECT 1 FROM public.customer_documents d
                WHERE d.storage_path = storage.objects.name AND d.uploaded_by = auth.uid()
            )
        )
    );

-- -----------------------------------------------------------------------------
-- 6. ASSEGNAZIONE RUOLI (solo da SQL Editor, non esposta all'app)
-- -----------------------------------------------------------------------------
-- Esempi:
--   SELECT public.set_user_role('sede@azienda.it',    'HQ_SUPERADMIN');
--   SELECT public.set_user_role('manager@azienda.it', 'ORG_ADMIN', 'ORG-01', 'Laura', 'Ferri');
--   SELECT public.set_user_role('agente@azienda.it',  'AGENT',     'ORG-01', p_agent_code => '3');
-- Per un AGENT, p_agent_code collega l'utente all'agente con quel codice
-- (ne aggiorna l'email con quella di login), così vede i clienti di quell'agente.
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
        UPDATE public.sales_agents SET email = v_email
        WHERE org_id = v_org_id AND code = p_agent_code
        RETURNING full_name INTO v_agent_name;
        IF v_agent_name IS NULL THEN
            RAISE EXCEPTION 'Agente con codice % non trovato in %', p_agent_code, p_org_code;
        END IF;
    END IF;

    INSERT INTO public.profiles AS p (id, email, first_name, last_name, role, org_id)
    VALUES (
        v_user_id, v_email,
        coalesce(p_first_name, split_part(v_agent_name, ' ', 1), split_part(v_email, '@', 1)),
        coalesce(p_last_name, nullif(substr(v_agent_name, length(split_part(v_agent_name, ' ', 1)) + 2), ''), ''),
        p_role, v_org_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        org_id = EXCLUDED.org_id,
        first_name = coalesce(p_first_name, split_part(v_agent_name, ' ', 1), p.first_name),
        last_name = coalesce(p_last_name, nullif(substr(v_agent_name, length(split_part(v_agent_name, ' ', 1)) + 2), ''), p.last_name),
        updated_at = NOW();

    RETURN format('%s -> %s%s%s', v_email, p_role,
        CASE WHEN p_org_code IS NOT NULL THEN ' (' || p_org_code || ')' ELSE '' END,
        CASE WHEN v_agent_name IS NOT NULL THEN ' = agente ' || v_agent_name ELSE '' END);
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
