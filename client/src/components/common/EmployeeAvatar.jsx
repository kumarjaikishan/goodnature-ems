import React, { useState, useEffect } from 'react';
import { cloudinaryUrl } from '../../utils/imageurlsetter';

/**
 * Renders an employee profile image with automatic fallback to initials
 * (or custom fallback node) when no image URL is set or the URL fails to load.
 */
const EmployeeAvatar = ({
  src,
  name = '',
  initials = '?',
  bgColor = '#e2e8f0',
  textColor = '#334155',
  sizeClass = 'w-8 h-8',
  textClass = 'text-[11px]',
  imgClassName = 'rounded-full object-cover shrink-0 border border-slate-200',
  width = 80,
  height = 80,
  fallbackNode = null,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    if (fallbackNode) return fallbackNode;
    return (
      <div
        style={{ backgroundColor: bgColor, color: textColor }}
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${textClass} tracking-wider shrink-0 select-none shadow-2xs`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      alt={name}
      className={`${sizeClass} ${imgClassName}`}
      src={cloudinaryUrl(src, { format: 'webp', width, height })}
      onError={() => setImgError(true)}
    />
  );
};

export default EmployeeAvatar;
