import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  FileCheck,
  Calendar,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';

/**
 * DocumentPreviewModal
 * Provides in-app interactive preview for PDF documents and images (JPG, PNG, WEBP, GIF, BMP, TIFF)
 * with direct external tab opening and download support.
 */
const DocumentPreviewModal = ({ open, onClose, doc }) => {
  if (!doc || !doc.fileUrl) return null;

  const url = doc.fileUrl;
  const fileName = doc.fileName || 'Document Attachment';
  const fileType = doc.fileType || 'Document';
  const description = doc.description || '';
  const fileSize = doc.fileSize ? `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB` : null;

  const isPdf =
    url.toLowerCase().endsWith('.pdf') ||
    url.toLowerCase().includes('/raw/') ||
    fileType.toLowerCase().includes('pdf') ||
    doc.format === 'pdf';

  const isImage =
    !isPdf &&
    (/\.(jpg|jpeg|png|webp|gif|bmp|tiff|tif|avif)(\?.*)?$/i.test(url) ||
      url.toLowerCase().includes('/image/') ||
      doc.format === 'jpg' ||
      doc.format === 'jpeg' ||
      doc.format === 'png' ||
      doc.format === 'webp');

  return (
    <Modalbox
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg shrink-0">
            {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
          </div>
          <div className="truncate">
            <span className="font-bold text-slate-900 text-sm md:text-base block truncate">
              {fileName}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="px-1.5 py-0.2 bg-teal-50 text-teal-800 border border-teal-200 rounded font-semibold text-[10px]">
                {fileType}
              </span>
              {fileSize && <span>• {fileSize}</span>}
              {doc.uploadedAt && (
                <span className="flex items-center gap-1">
                  • <Calendar size={11} /> {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      }
      maxWidth="max-w-4xl"
      bodyClassName="p-0 overflow-hidden"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 italic truncate max-w-sm">
            {description ? `Note: ${description}` : 'Land Document Attachment'}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Open in New Tab</span>
            </a>
            <a
              href={url}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Download</span>
            </a>
          </div>
        </div>
      }
    >
      <div className="relative bg-slate-900/5 min-h-[420px] max-h-[75vh] flex items-center justify-center p-3 md:p-4 overflow-auto">
        {isPdf ? (
          <div className="w-full h-[68vh] flex flex-col items-center">
            <iframe
              src={url}
              title={fileName}
              className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-inner"
            />
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              If PDF does not preview in your browser, click{' '}
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline font-bold">
                Open in New Tab
              </a>{' '}
              to view or download.
            </p>
          </div>
        ) : isImage ? (
          <div className="flex flex-col items-center justify-center max-h-[70vh]">
            <img
              src={url}
              alt={fileName}
              className="max-h-[66vh] max-w-full rounded-xl object-contain shadow-sm border border-slate-200 bg-white"
            />
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-200">
              <FileCheck size={32} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">{fileName}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              This document type cannot be directly previewed inline. You can download or view it in a new window.
            </p>
            <div className="pt-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                <Download size={14} />
                <span>Open / Download Document</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </Modalbox>
  );
};

export default DocumentPreviewModal;
