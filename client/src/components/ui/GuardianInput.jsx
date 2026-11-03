import React, { forwardRef } from 'react';

const DEFAULT_RELATION_OPTIONS = [
  { value: 'S/o', label: 'S/o' },
  { value: 'D/o', label: 'D/o' },
  { value: 'W/o', label: 'W/o' },
  { value: 'H/o', label: 'H/o' },
  { value: 'C/o', label: 'C/o' },
];

const NORMALIZE_RELATION = {
  'father': 'S/o',
  'son of': 'S/o',
  's/o': 'S/o',
  'so': 'S/o',
  'daughter of': 'D/o',
  'd/o': 'D/o',
  'do': 'D/o',
  'mother': 'S/o',
  'wife of': 'W/o',
  'w/o': 'W/o',
  'wo': 'W/o',
  'husband of': 'H/o',
  'h/o': 'H/o',
  'ho': 'H/o',
  'care of': 'C/o',
  'c/o': 'C/o',
  'co': 'C/o',
};

/**
 * Standardized Guardian / Relative Name Input Component
 * Provides a left-side selectable relation prefix (S/o, D/o, W/o, H/o, C/o)
 * paired with a text input for the guardian's name.
 *
 * Supports two usage patterns:
 * 1. Dual props:
 *    <GuardianInput
 *       relation={formData.relationType}
 *       onRelationChange={(rel) => setFormData({ ...formData, relationType: rel })}
 *       value={formData.fatherOrHusbandName}
 *       onChange={(e) => setFormData({ ...formData, fatherOrHusbandName: e.target.value })}
 *    />
 *
 * 2. Object prop:
 *    <GuardianInput
 *       value={{ relation: formData.relationType, name: formData.fatherOrHusbandName }}
 *       onChange={({ relation, name }) => setFormData({ ...formData, relationType: relation, fatherOrHusbandName: name })}
 *    />
 */
export const GuardianInput = forwardRef(({
  label = 'Guardian / Father Name',
  required = false,
  relation,
  onRelationChange,
  value,
  onChange,
  placeholder = 'Father / Guardian full name',
  options = DEFAULT_RELATION_OPTIONS,
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) => {
  // Normalize value and relation depending on prop signature
  const isObjectValue = value && typeof value === 'object';
  const rawRelation = isObjectValue ? value.relation : relation;
  const currentRelation = (rawRelation && NORMALIZE_RELATION[String(rawRelation).trim().toLowerCase()]) || rawRelation || 'S/o';
  const currentName = isObjectValue ? (value.name || '') : (typeof value === 'string' ? value : '');

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-10 text-base',
  };

  const selectPadding = {
    sm: 'px-2 text-xs',
    md: 'px-2.5 text-xs',
    lg: 'px-3 text-sm',
  };

  const inputPadding = {
    sm: 'px-2.5 text-xs',
    md: 'px-3 text-sm',
    lg: 'px-3.5 text-base',
  };

  const handleRelationChange = (e) => {
    const newRelation = e.target.value;
    if (onRelationChange) {
      onRelationChange(newRelation);
    }
    if (isObjectValue && onChange) {
      onChange({ relation: newRelation, name: currentName });
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    if (isObjectValue && onChange) {
      onChange({ relation: currentRelation, name: newName });
    } else if (onChange) {
      onChange(e);
    }
  };

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // If currentRelation is not in options, dynamically include it so it's selectable
  const resolvedOptions = [...options];
  if (currentRelation && !resolvedOptions.some((opt) => (typeof opt === 'string' ? opt : opt.value) === currentRelation)) {
    resolvedOptions.unshift({ value: currentRelation, label: currentRelation });
  }

  return (
    <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1 select-none"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div
        className={`
          flex items-center rounded-lg border border-slate-300 bg-white
          focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600
          transition-all overflow-hidden shadow-2xs
          ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}
          ${sizeClasses[size] || sizeClasses.md}
          ${className}
        `}
      >
        <select
          value={currentRelation}
          onChange={handleRelationChange}
          disabled={disabled}
          className={`
            h-full bg-slate-50 border-r border-slate-200 font-bold text-slate-700
            hover:bg-slate-100 focus:bg-white outline-none cursor-pointer transition select-none shrink-0
            ${selectPadding[size] || selectPadding.md}
          `}
        >
          {resolvedOptions.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>

        <input
          ref={ref}
          id={inputId}
          type="text"
          value={currentName}
          onChange={handleNameChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            flex-1 w-full h-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium
            ${inputPadding[size] || inputPadding.md}
          `}
          {...props}
        />
      </div>
    </div>
  );
});

GuardianInput.displayName = 'GuardianInput';

export default GuardianInput;
