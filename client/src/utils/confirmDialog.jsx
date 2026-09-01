import { toast } from 'sonner';

/**
 * Modern, Lightweight Confirmation Dialog powered by Sonner
 * Replaces legacy sweetalert with zero extra bundle weight.
 *
 * Usage:
 * const proceed = await confirmDialog({
 *   title: "Delete this record?",
 *   text: "This action cannot be undone.",
 *   confirmText: "Delete",
 *   cancelText: "Cancel",
 *   isDanger: true
 * });
 * if (proceed) { ... }
 */
export const confirmDialog = (options = {}) => {
  // Support both string signature `confirmDialog("Are you sure?")` and object signature `confirmDialog({ title, text, ... })`
  let config = {};
  if (typeof options === 'string') {
    config = { title: options };
  } else {
    config = { ...options };
  }

  const {
    title = 'Are you sure?',
    text = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = true,
  } = config;

  return new Promise((resolve) => {
    toast.custom((t) => (
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 font-sans pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-700'
          }`}>
            <span className="text-base font-bold">{isDanger ? '⚠️' : 'ℹ️'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {title}
            </h4>
            {text && (
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                {text}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t);
              resolve(false);
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t);
              resolve(true);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  });
};

/**
 * Universal backwards-compatible swal() drop-in replacement
 * so existing `swal({ title, text, ... }).then(proceed => ...)` continues working without changes.
 */
export const swal = (opts, ...args) => {
  if (typeof opts === 'string') {
    const secondArg = args[0];
    return confirmDialog({
      title: opts,
      text: typeof secondArg === 'string' ? secondArg : '',
      isDanger: args.includes('warning') || args.includes('error')
    });
  }

  return confirmDialog({
    title: opts?.title || 'Are you sure?',
    text: opts?.text || '',
    confirmText: opts?.buttons?.[1] || (opts?.dangerMode ? 'Delete' : 'Confirm'),
    cancelText: opts?.buttons?.[0] || 'Cancel',
    isDanger: opts?.dangerMode !== false,
  });
};

export default confirmDialog;
