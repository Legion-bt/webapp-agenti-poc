-- =============================================================================
-- 008 · Immagini articoli in un bucket privato
-- =============================================================================
-- Da eseguire nel SQL Editor, dopo la 007. Rieseguibile.
--   1. Bucket Storage privato "product-images" (JPEG/PNG/WebP, max 5 MB):
--      le immagini si vedono solo dalla webapp, con utente autenticato,
--      tramite URL firmati a scadenza. Nessuna immagine da URL esterni.
--   2. products.image_url contiene il path nel bucket ("<product_id>/<file>"),
--      non più un URL; i vecchi URL esterni vengono rimossi.
--   3. RPC set_product_image: solo sede (HQ) o manager dell'organizzazione
--      dell'articolo possono cambiare l'immagine.
-- =============================================================================

UPDATE public.products SET image_url = NULL WHERE image_url ~* '^https?://';

-- Può gestire l'articolo: sede, oppure manager della stessa organizzazione.
CREATE OR REPLACE FUNCTION public.can_manage_product(p_product_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = p_product_id
          AND (
               public.app_role() = 'HQ_SUPERADMIN'
            OR (public.app_role() = 'ORG_ADMIN' AND p.org_id = public.app_org_id())
          )
    );
$$;

-- Estrae il product_id dal path Storage "<product_id>/<file>" (NULL se non valido).
CREATE OR REPLACE FUNCTION public.storage_product_id(p_name TEXT)
RETURNS UUID LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
BEGIN
    RETURN split_part(p_name, '/', 1)::UUID;
EXCEPTION WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_product_image(p_product_id UUID, p_path TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT public.can_manage_product(p_product_id) THEN
        RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
    END IF;
    IF p_path IS NOT NULL AND public.storage_product_id(p_path) IS DISTINCT FROM p_product_id THEN
        RAISE EXCEPTION 'invalid image path' USING ERRCODE = '22023';
    END IF;
    UPDATE public.products SET image_url = p_path WHERE id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_product(UUID), public.storage_product_id(TEXT),
    public.set_product_image(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_product(UUID), public.storage_product_id(TEXT),
    public.set_product_image(UUID, TEXT) TO authenticated;

-- Bucket privato -------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
    SET public = false,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS product_images_objects_select ON storage.objects;
DROP POLICY IF EXISTS product_images_objects_insert ON storage.objects;
DROP POLICY IF EXISTS product_images_objects_update ON storage.objects;
DROP POLICY IF EXISTS product_images_objects_delete ON storage.objects;

-- Lettura: tutti gli utenti autenticati (come la tabella products).
CREATE POLICY product_images_objects_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'product-images');
CREATE POLICY product_images_objects_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images' AND public.can_manage_product(public.storage_product_id(name)));
CREATE POLICY product_images_objects_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images' AND public.can_manage_product(public.storage_product_id(name)))
    WITH CHECK (bucket_id = 'product-images' AND public.can_manage_product(public.storage_product_id(name)));
CREATE POLICY product_images_objects_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'product-images' AND public.can_manage_product(public.storage_product_id(name)));
