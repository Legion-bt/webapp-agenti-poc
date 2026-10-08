import { store } from '../lib/store';
import { supabase } from '../lib/supabase/client';
import { CustomerDocument } from '../types';

const BUCKET = 'customer-documents';
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

// Visibility and delete rights are enforced by RLS on customer_documents and on
// the storage bucket (see supabase/migrations/002); the checks here only drive the UI.
export class DocumentService {
  public isAvailable(): boolean {
    return Boolean(supabase);
  }

  public async listDocuments(customerId: string): Promise<CustomerDocument[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(this.describeError(error.message));

    return (data || []).map((d: any) => ({
      id: d.id,
      customerId: d.customer_id,
      fileName: d.file_name,
      storagePath: d.storage_path,
      sizeBytes: Number(d.size_bytes),
      uploadedBy: d.uploaded_by,
      uploadedByName: d.uploaded_by_name,
      createdAt: d.created_at,
    }));
  }

  /** Returns an error message for files that cannot be uploaded, or null if valid. */
  public validateFile(file: File): string | null {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return `"${file.name}" non è un PDF.`;
    if (file.size === 0) return `"${file.name}" è vuoto.`;
    if (file.size > MAX_DOCUMENT_BYTES) return `"${file.name}" supera il limite di 20 MB.`;
    return null;
  }

  public async uploadDocument(customerId: string, file: File): Promise<void> {
    if (!supabase) throw new Error('Servizio documenti non disponibile.');
    const invalid = this.validateFile(file);
    if (invalid) throw new Error(invalid);

    const storagePath = `${customerId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw new Error(this.describeError(uploadError.message));

    const { error: insertError } = await supabase.from('customer_documents').insert({
      customer_id: customerId,
      file_name: file.name,
      storage_path: storagePath,
      size_bytes: file.size,
    });
    if (insertError) {
      // Keep storage and table consistent if the metadata row is rejected.
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw new Error(this.describeError(insertError.message));
    }
  }

  /** Short-lived signed URL: the bucket is private. */
  public async getDocumentUrl(doc: CustomerDocument, download = false): Promise<string> {
    if (!supabase) throw new Error('Servizio documenti non disponibile.');
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storagePath, 60, download ? { download: doc.fileName } : undefined);
    if (error || !data) throw new Error(this.describeError(error?.message || ''));
    return data.signedUrl;
  }

  public async deleteDocument(doc: CustomerDocument): Promise<void> {
    if (!supabase) throw new Error('Servizio documenti non disponibile.');
    // Delete the row first: if RLS refuses, nothing is touched.
    const { data, error } = await supabase
      .from('customer_documents')
      .delete()
      .eq('id', doc.id)
      .select('id');
    if (error) throw new Error(this.describeError(error.message));
    if (!data || data.length === 0) throw new Error('Non hai i permessi per eliminare questo documento.');

    await supabase.storage.from(BUCKET).remove([doc.storagePath]);
  }

  /** Mirrors the delete policy: the uploader, or a manager / HQ admin. */
  public canDelete(doc: CustomerDocument): boolean {
    const state = store.getState();
    const profile = state.profiles.find((p) => p.id === state.currentProfileId);
    if (!profile) return false;
    return profile.role !== 'AGENT' || doc.uploadedBy === profile.id;
  }

  private describeError(message: string): string {
    if (/row-level security|violates|not authorized|unauthorized|403/i.test(message)) {
      return 'Non hai i permessi per questa operazione su questo cliente.';
    }
    if (/customer_documents|schema cache/i.test(message)) {
      return 'Archivio documenti non ancora configurato sul database (migrazione 002).';
    }
    if (/Bucket not found/i.test(message)) {
      return 'Archivio documenti non ancora configurato (bucket mancante, migrazione 002).';
    }
    if (/exceeded|too large|maximum allowed size/i.test(message)) {
      return 'Il file supera la dimensione massima consentita (20 MB).';
    }
    if (/mime|invalid_mime_type/i.test(message)) {
      return 'Sono ammessi solo file PDF.';
    }
    return message || 'Operazione non riuscita.';
  }
}

export const documentService = new DocumentService();
