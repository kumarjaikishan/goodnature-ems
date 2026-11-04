import React from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Info, X, Loader2 } from 'lucide-react';

/**
 * Modern Confirmation Dialog powered by Clean React Portal (Matching Sonner/Sweetalert aesthetics)
 *
 * Usage:
 * const proceed = await confirmDialog({
 *   title: "Are you sure?",
 *   text: "Once deleted, you will not be able to recover this Data!",
 *   confirmText: "Delete",
 *   cancelText: "Cancel",
 *   loadingText: "Processing...",
 *   isDanger: true,
 *   onConfirm: async () => { ... } // optional callback that keeps loader active until finished
 * });
 * if (proceed) { ... }
 */
export const confirmDialog = (options = {}) => {
  let config = {};
  if (typeof options === 'string') {
    config = { title: options };
  } else {
    config = { ...options };
  }

  const {
    title = 'Are you sure?',
    text = 'Once deleted, you will not be able to recover this Data!',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    loadingText = 'Please wait...',
    isDanger = true,
    onConfirm = null,
  } = config;

  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.id = 'confirm-dialog-root';
    document.body.appendChild(container);

    const root = createRoot(container);

    const cleanup = () => {
      setTimeout(() => {
        root.unmount();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 150);
    };

    const DialogComponent = () => {
      const [isSubmitting, setIsSubmitting] = React.useState(false);

      const handleConfirm = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
          if (typeof onConfirm === 'function') {
            await onConfirm();
          } else {
            // Provide smooth visual confirmation feedback so the user always sees click registration and loading spinner
            await new Promise((r) => setTimeout(r, 250));
          }
          cleanup();
          resolve(true);
        } catch {
          setIsSubmitting(false);
          cleanup();
          resolve(false);
        }
      };

      const handleCancel = () => {
        if (isSubmitting) return;
        cleanup();
        resolve(false);
      };

      React.useEffect(() => {
        const onKeyDown = (e) => {
          if (isSubmitting) return;
          if (e.key === 'Escape') handleCancel();
          if (e.key === 'Enter') handleConfirm();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [isSubmitting]);

      return (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={handleCancel}
        >
          <div
            className="relative w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col items-center text-center font-sans pointer-events-auto transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-Right Close Button */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X size={17} />
            </button>

            {/* Icon Badge */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-xs ${
              isDanger ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-teal-50 text-teal-600 border border-teal-100'
            }`}>
              {isDanger ? (
                <AlertTriangle size={28} className="stroke-[2.2]" />
              ) : (
                <Info size={28} className="stroke-[2.2]" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-normal mb-1.5 px-2">
              {title}
            </h3>

            {/* Description Subtext */}
            {text && (
              <p className="text-xs font-normal text-slate-500 leading-relaxed max-w-[320px] mb-6">
                {text}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 px-4 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed ${
                  isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                    : 'bg-teal-700 hover:bg-teal-800 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin shrink-0" />
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    };

    root.render(<DialogComponent />);
  });
};

/**
 * Universal backwards-compatible swal() drop-in replacement
 * so existing `swal({ title, text, ... }).then(proceed => ...)` opens this exact dialog.
 */
export const swal = (opts, ...args) => {
  if (typeof opts === 'string') {
    const secondArg = args[0];
    return confirmDialog({
      title: opts,
      text: typeof secondArg === 'string' ? secondArg : 'Once deleted, you will not be able to recover this Data!',
      isDanger: args.includes('warning') || args.includes('error')
    });
  }

  return confirmDialog({
    title: opts?.title || 'Are you sure?',
    text: opts?.text || 'Once deleted, you will not be able to recover this Data!',
    confirmText: opts?.buttons?.[1] || opts?.button?.text || (opts?.dangerMode ? 'Delete' : 'Confirm'),
    cancelText: opts?.buttons?.[0] || 'Cancel',
    isDanger: opts?.dangerMode !== false,
  });
};

export default confirmDialog;
