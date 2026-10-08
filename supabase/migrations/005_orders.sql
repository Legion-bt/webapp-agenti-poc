-- =============================================================================
-- 005 · Ordini su Supabase
-- =============================================================================
-- Da eseguire nel SQL Editor DOPO la 004. Rieseguibile.
--
-- Cosa fa:
--   1. Assicura le colonne di public.orders e la tabella public.order_items
--      (righe d'ordine), con RLS: le righe seguono la visibilità dell'ordine.
--   2. public.create_order(...): salva ordine + righe in un'unica transazione,
--      assegna il numero progressivo per organizzazione e anno (2026-OV-0000001),
--      ricalcola i totali sul server e aggiorna l'esposizione del cliente.
--      Chi può: chi vede il cliente (agente solo i propri clienti, manager la
--      propria organizzazione, sede tutto).
--
-- I prezzi unitari arrivano dall'app (motore prezzi / gateway ERP simulato):
-- quando ci sarà l'ERP reale il calcolo andrà spostato lato server.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELLE
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS requested_delivery_date DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_term VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS causal VARCHAR(100) DEFAULT 'OV - ORDINI CLIENTI';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS residual_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS back_order BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS block_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS erp_sync_status VARCHAR(50) DEFAULT 'SYNCED';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS erp_doc_number VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INT NOT NULL,
    quantity_shipped INT DEFAULT 0,
    list_price NUMERIC(12,2) NOT NULL,
    discount1 NUMERIC(5,2) DEFAULT 0,
    discount2 NUMERIC(5,2) DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders (customer_id);

-- -----------------------------------------------------------------------------
-- 2. RLS ORDER_ITEMS (stessa visibilità dell'ordine; scrittura solo da create_order)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_order(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = p_order_id
          AND (
               public.app_role() = 'HQ_SUPERADMIN'
            OR (public.app_role() = 'ORG_ADMIN' AND o.org_id = public.app_org_id())
            OR (public.app_role() = 'AGENT' AND o.sales_agent_id = public.app_agent_id())
          )
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_order(UUID) TO authenticated;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.order_items', r.policyname);
    END LOOP;
END;
$$;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM authenticated;
GRANT SELECT ON public.order_items TO authenticated;

CREATE POLICY order_items_select ON public.order_items FOR SELECT TO authenticated
    USING (public.can_access_order(order_id));

-- Gli ordini si creano solo con create_order (numero e totali decisi dal server).
DROP POLICY IF EXISTS orders_insert ON public.orders;
REVOKE INSERT ON public.orders FROM authenticated;

-- -----------------------------------------------------------------------------
-- 3. CREATE_ORDER
-- -----------------------------------------------------------------------------
-- p_items: [{"product_id": "...", "quantity": 6, "list_price": 10.5,
--            "discount1": 10, "discount2": 0, "unit_price": 9.45}, ...]
CREATE OR REPLACE FUNCTION public.create_order(
    p_customer_id UUID,
    p_items JSONB,
    p_requested_delivery_date DATE DEFAULT NULL,
    p_payment_term TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_block_reason TEXT DEFAULT NULL,
    p_erp_doc_number TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_customer public.customers%ROWTYPE;
    v_order_id UUID;
    v_number TEXT;
    v_prefix TEXT := to_char(CURRENT_DATE, 'YYYY') || '-OV-';
    v_next INT;
    v_subtotal NUMERIC(12,2);
    v_tax NUMERIC(12,2);
    v_total NUMERIC(12,2);
    v_status TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Accesso richiesto';
    END IF;

    SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id;
    IF NOT FOUND OR NOT public.can_access_customer(p_customer_id) THEN
        RAISE EXCEPTION 'Cliente non trovato o non accessibile';
    END IF;
    IF v_customer.sales_agent_id IS NULL THEN
        RAISE EXCEPTION 'Il cliente non ha un agente assegnato';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'L''ordine non contiene righe';
    END IF;
    IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_items) i
        WHERE coalesce((i->>'quantity')::INT, 0) <= 0
           OR coalesce((i->>'unit_price')::NUMERIC, -1) < 0
           OR NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = (i->>'product_id')::UUID)
    ) THEN
        RAISE EXCEPTION 'Righe d''ordine non valide (articolo, quantità o prezzo)';
    END IF;

    SELECT round(sum((i->>'quantity')::INT * (i->>'unit_price')::NUMERIC), 2)
    INTO v_subtotal FROM jsonb_array_elements(p_items) i;
    v_tax := round(v_subtotal * 0.22, 2);
    v_total := v_subtotal + v_tax;
    v_status := CASE WHEN nullif(trim(p_block_reason), '') IS NULL THEN 'CONFIRMED' ELSE 'BLOCKED' END;

    -- Numerazione per organizzazione e anno, senza buchi né doppioni.
    PERFORM pg_advisory_xact_lock(hashtext('orders:' || v_customer.org_id::TEXT));
    SELECT coalesce(max(substring(number FROM length(v_prefix) + 1)::INT), 0) + 1
    INTO v_next
    FROM public.orders
    WHERE org_id = v_customer.org_id AND number LIKE v_prefix || '%' AND substring(number FROM length(v_prefix) + 1) ~ '^[0-9]+$';
    v_number := v_prefix || lpad(v_next::TEXT, 7, '0');

    INSERT INTO public.orders (
        org_id, number, customer_id, sales_agent_id, status, order_date, requested_delivery_date,
        payment_term, causal, notes, subtotal, discount_total, tax_total, total, residual_total,
        back_order, block_reason, erp_sync_status, erp_doc_number, created_by
    ) VALUES (
        v_customer.org_id, v_number, v_customer.id, v_customer.sales_agent_id, v_status, CURRENT_DATE,
        p_requested_delivery_date, coalesce(nullif(trim(p_payment_term), ''), v_customer.payment_term),
        'OV - ORDINI CLIENTI', coalesce(p_notes, ''), v_subtotal, 0, v_tax, v_total, v_total,
        FALSE, nullif(trim(p_block_reason), ''), 'SYNCED', p_erp_doc_number, auth.uid()
    )
    RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, list_price, discount1, discount2, unit_price, line_total)
    SELECT v_order_id,
           (i->>'product_id')::UUID,
           (i->>'quantity')::INT,
           coalesce((i->>'list_price')::NUMERIC, (i->>'unit_price')::NUMERIC),
           coalesce((i->>'discount1')::NUMERIC, 0),
           coalesce((i->>'discount2')::NUMERIC, 0),
           (i->>'unit_price')::NUMERIC,
           round((i->>'quantity')::INT * (i->>'unit_price')::NUMERIC, 2)
    FROM jsonb_array_elements(p_items) i;

    UPDATE public.customers
    SET current_exposure = coalesce(current_exposure, 0) + v_total
    WHERE id = v_customer.id;

    RETURN jsonb_build_object('id', v_order_id, 'number', v_number, 'status', v_status, 'total', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(UUID, JSONB, DATE, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(UUID, JSONB, DATE, TEXT, TEXT, TEXT, TEXT) TO authenticated;
