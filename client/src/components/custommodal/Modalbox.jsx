import './modalbox.css';
import { createPortal } from 'react-dom';
import { useEffect, isValidElement } from 'react';
import { X } from 'lucide-react';

/**
 * Universal Modal Component for Good Nature EMS
 * - 100% Responsive & always fits inside viewport (<90vh / 100vh)
 * - Fixed Header & Sticky Footer support with vertically scrollable body
 * - 100% backward-compatible: works both with (title, footer, children) or raw children
 */
const Modalbox = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-xl', // 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl'
  size, // alias for maxWidth (e.g., 'sm', 'md', 'lg', 'xl', '2xl', '4xl')
  showClose = true,
  shadow = true,
  outside = true,
  className = '',
  bodyClassName = '',
}) => {
  useEffect(() => {
    if (open) {
      const getScrollbarWidth = () => {
        return window.innerWidth - document.documentElement.clientWidth;
      };

      const scrollbarWidth = getScrollbarWidth();

      // Lock body scroll
      document.body.style.overflowY = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflowY = 'auto';
        document.body.style.paddingRight = '0px';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  // Resolve size mapping if short size prop is used
  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };
  const resolvedMaxWidth = size ? (sizeMap[size] || size) : maxWidth;

  // Check if structured header/footer props are provided
  const hasStructuredLayout = Boolean(title || subtitle || footer);

  return createPortal(
    <div
      className="modalwrapper"
      onClick={outside ? onClose : undefined}
    >
      <div
        className={`modalbox w-full ${resolvedMaxWidth} ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={shadow ? { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)' } : undefined}
      >
        {hasStructuredLayout ? (
          <div className="flex flex-col max-h-[88vh] w-full overflow-hidden rounded-2xl bg-white">
            {/* Fixed Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0 select-none">
                <div className="min-w-0 pr-3">
                  {title && (
                    <h3 className="text-base font-bold text-slate-800 tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Vertically Scrollable Modal Body */}
            <div className={`p-6 overflow-y-auto flex-1 scrollbar-thin ${bodyClassName}`}>
              {children}
            </div>

            {/* Fixed Sticky Footer */}
            {footer && (
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
                {footer}
              </div>
            )}
          </div>
        ) : (
          /* Backward compatibility mode for custom internal modal structures */
          <div className={`max-h-[88vh] flex flex-col ${bodyClassName}`}>
            {children}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modalbox;


