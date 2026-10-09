import { store } from '../lib/store';
import { supabase } from '../lib/supabase/client';
import { Product } from '../types';

const BUCKET = 'product-images';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const URL_TTL_SECONDS = 3600;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The bucket is private: images are shown through short-lived signed URLs and only
// to signed-in users. Write rights are enforced by RLS and set_product_image
// (supabase/migrations/008); the checks here only drive the UI.
export class ProductImageService {
  private cache = new Map<string, { url: string; expiresAt: number }>();
  private pending = new Map<string, Promise<string | null>>();

  public async getUrl(path: string): Promise<string | null> {
    if (!supabase || !path) return null;
    const cached = this.cache.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.url;

    let request = this.pending.get(path);
    if (!request) {
      request = supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, URL_TTL_SECONDS)
        .then(({ data, error }) => {
          if (error || !data) return null;
          // Refresh a few minutes before the signature expires.
          this.cache.set(path, { url: data.signedUrl, expiresAt: Date.now() + (URL_TTL_SECONDS - 300) * 1000 });
          return data.signedUrl;
        })
        .finally(() => this.pending.delete(path));
      this.pending.set(path, request);
    }
    return request;
  }

  /** HQ, or a manager of the product's organization; demo products are not on the database. */
  public canManage(product: Product): boolean {
    if (!supabase || !UUID_RE.test(product.id)) return false;
    const state = store.getState();
    const profile = state.profiles.find((p) => p.id === state.currentProfileId);
    if (!profile) return false;
    return profile.role === 'HQ_SUPERADMIN' || (profile.role === 'ORG_ADMIN' && profile.orgId === product.orgId);
  }

  /** Returns an error message for files that cannot be uploaded, or null if valid. */
  public validateFile(file: File): string | null {
    if (!ALLOWED_TYPES[file.type]) return 'Sono ammesse solo immagini JPEG, PNG o WebP.';
    if (file.size === 0) return 'Il file è vuoto.';
    if (file.size > MAX_IMAGE_BYTES) return "L'immagine supera il limite di 5 MB.";
    return null;
  }

  public async upload(product: Product, file: File): Promise<void> {
    if (!supabase) throw new Error('Archivio immagini non disponibile.');
    const invalid = this.validateFile(file);
    if (invalid) throw new Error(invalid);

    const path = `${product.id}/${crypto.randomUUID()}.${ALLOWED_TYPES[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(this.describeError(uploadError.message));

    const { error } = await supabase.rpc('set_product_image', { p_product_id: product.id, p_path: path });
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(this.describeError(error.message));
    }
    await this.removeObject(product.imagePath);
    this.setLocalPath(product.id, path);
  }

  public async remove(product: Product): Promise<void> {
    if (!supabase) throw new Error('Archivio immagini non disponibile.');
    const { error } = await supabase.rpc('set_product_image', { p_product_id: product.id, p_path: null });
    if (error) throw new Error(this.describeError(error.message));
    await this.removeObject(product.imagePath);
    this.setLocalPath(product.id, '');
  }

  private async removeObject(path: string): Promise<void> {
    if (!supabase || !path) return;
    this.cache.delete(path);
    await supabase.storage.from(BUCKET).remove([path]);
  }

  private setLocalPath(productId: string, path: string): void {
    store.setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === productId ? { ...p, imagePath: path } : p)),
    }));
  }

  private describeError(message: string): string {
    if (/row-level security|violates|not authorized|unauthorized|403|42501/i.test(message)) {
      return "Non hai i permessi per modificare l'immagine di questo articolo.";
    }
    if (/Bucket not found|set_product_image|schema cache|function/i.test(message)) {
      return 'Archivio immagini non ancora configurato sul database (migrazione 008).';
    }
    if (/exceeded|too large|maximum allowed size/i.test(message)) {
      return "L'immagine supera la dimensione massima consentita (5 MB).";
    }
    if (/mime|invalid_mime_type/i.test(message)) {
      return 'Sono ammesse solo immagini JPEG, PNG o WebP.';
    }
    return message || 'Operazione non riuscita.';
  }
}

export const productImageService = new ProductImageService();
