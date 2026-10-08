import React, { useCallback, useEffect, useRef, useState } from 'react';
import { documentService } from '../../services/document.service';
import { CustomerDocument } from '../../types';
import { FileText, UploadCloud, Download, Trash2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

interface CustomerDocumentsPanelProps {
  customerId: string;
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const CustomerDocumentsPanel: React.FC<CustomerDocumentsPanelProps> = ({ customerId }) => {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setDocuments(await documentService.listDocuments(customerId));
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    setIsLoading(true);
    setErrors([]);
    load();
  }, [load]);

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setErrors([]);

    const problems: string[] = [];
    const valid = files.filter((f) => {
      const invalid = documentService.validateFile(f);
      if (invalid) problems.push(invalid);
      return !invalid;
    });

    setUploading(valid.map((f) => f.name));
    for (const file of valid) {
      try {
        await documentService.uploadDocument(customerId, file);
      } catch (err: any) {
        problems.push(`${file.name}: ${err.message}`);
      }
      setUploading((prev) => prev.filter((n) => n !== file.name));
    }

    setErrors(problems);
    await load();
  };

  const openDocument = async (doc: CustomerDocument, download = false) => {
    setBusyId(doc.id);
    try {
      const url = await documentService.getDocumentUrl(doc, download);
      if (download) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener');
      }
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setBusyId(null);
    }
  };

  const deleteDocument = async (doc: CustomerDocument) => {
    if (!window.confirm(`Eliminare "${doc.fileName}"? L'operazione non si può annullare.`)) return;
    setBusyId(doc.id);
    try {
      await documentService.deleteDocument(doc);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Documentazione cliente</h3>
          <p className="text-xs text-slate-500 mt-0.5">Contratti, schede, certificazioni e altri documenti in PDF (max 20 MB).</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading.length > 0}
          className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
        >
          <UploadCloud className="w-4 h-4" />
          Carica PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="p-5 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 py-7 rounded-xl border-2 border-dashed text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <UploadCloud className="w-6 h-6" />
          <p className="text-sm font-medium">Trascina qui i PDF oppure fai clic per selezionarli</p>
          <p className="text-xs opacity-75">Puoi caricare più file insieme</p>
        </div>

        {errors.length > 0 && (
          <div role="alert" className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <ul className="space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Caricamento documenti…
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {uploading.map((name) => (
              <li key={`up-${name}`} className="flex items-center gap-3 px-4 py-3 bg-blue-50/50">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <span className="text-sm text-slate-700 truncate flex-1">{name}</span>
                <span className="text-xs text-blue-700">Caricamento…</span>
              </li>
            ))}

            {documents.length === 0 && uploading.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">Nessun documento caricato per questo cliente.</li>
            )}

            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => openDocument(doc)}
                    className="cursor-pointer block max-w-full text-left text-sm font-semibold text-slate-800 hover:text-blue-700 truncate"
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </button>
                  <p className="text-xs text-slate-500 truncate">
                    {formatSize(doc.sizeBytes)} · {formatDate(doc.createdAt)}
                    {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {busyId === doc.id ? (
                    <Loader2 className="w-4 h-4 m-2 text-slate-400 animate-spin" />
                  ) : (
                    <>
                      <button
                        onClick={() => openDocument(doc)}
                        className="cursor-pointer p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        title="Apri"
                        aria-label={`Apri ${doc.fileName}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDocument(doc, true)}
                        className="cursor-pointer p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        title="Scarica"
                        aria-label={`Scarica ${doc.fileName}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {documentService.canDelete(doc) && (
                        <button
                          onClick={() => deleteDocument(doc)}
                          className="cursor-pointer p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Elimina"
                          aria-label={`Elimina ${doc.fileName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
