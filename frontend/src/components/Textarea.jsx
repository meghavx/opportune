/*
========================================
Component: Textarea

Purpose:
Reusable multi-line text field for descriptions (job description,
notification body, additional requirements, etc).

Current Features:
- Label, helper text, required indicator, error message
- Configurable rows

Future:
- Character counter, if a page needs it.
========================================
*/

export default function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false,
  error = '',
  helperText = '',
  maxLength,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        aria-invalid={!!error}
        className={`rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}
          focus:outline-none focus:ring-1 focus:ring-primary-500`}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  )
}
