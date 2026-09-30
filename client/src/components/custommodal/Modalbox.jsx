import React from 'react';
import Modal from '../ui/Modal';

/**
 * Universal Modal Component wrapper for Good Nature EMS
 * Re-exports the exact same standardized Modal component for 100% consistency across all pages.
 */
const Modalbox = ({
  open,
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-xl',
  size,
  showClose = true,
  className = '',
  bodyClassName = '',
  ...rest
}) => {
  const isModalOpen = Boolean(open || isOpen);

  // Resolve size mapping if short size prop is used (e.g. size="lg")
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

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={resolvedMaxWidth}
      showClose={showClose}
      className={className}
      bodyClassName={bodyClassName}
      footer={footer}
      {...rest}
    >
      {children}
    </Modal>
  );
};

export default Modalbox;


