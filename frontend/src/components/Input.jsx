/*
========================================
Component: Input

Purpose:
Reusable text input used across every form in the application
(login, profile, drive creation, student/recruiter management, etc).

Current Features:
- Label, helper text, required indicator, error message
- Supports text, email, password, number, date, tel, search types
- Disabled / read-only states

Future:
- None; keep this the single Input implementation.
========================================
*/

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onKeyDown,
  placeholder = '',
  required = false,
  disabled = false,
  readOnly = false,
  error = '',
  helperText = '',
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
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={!!error}
        className={`rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          disabled:bg-gray-100 disabled:text-gray-500
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
