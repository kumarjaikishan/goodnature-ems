import { toast as sonnerToast } from 'sonner';

/**
 * Universal Toast Adapter
 * Provides modern Sonner toast notifications with backwards-compatible API
 * for seamless transition from react-toastify without breaking existing calls.
 */
export const toast = {
  success: (msg, opts = {}) => sonnerToast.success(msg, { duration: opts.autoClose || 3000, ...opts }),
  error: (msg, opts = {}) => sonnerToast.error(msg, { duration: opts.autoClose || 4000, ...opts }),
  warning: (msg, opts = {}) => sonnerToast.warning(msg, { duration: opts.autoClose || 3500, ...opts }),
  warn: (msg, opts = {}) => sonnerToast.warning(msg, { duration: opts.autoClose || 3500, ...opts }),
  info: (msg, opts = {}) => sonnerToast.info(msg, { duration: opts.autoClose || 3000, ...opts }),
  message: (msg, opts = {}) => sonnerToast(msg, opts),
  loading: (msg, opts = {}) => sonnerToast.loading(msg, opts),
  dismiss: (id) => sonnerToast.dismiss(id),
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
};

export default toast;
