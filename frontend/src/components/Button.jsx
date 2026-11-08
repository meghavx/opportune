/*
========================================
Component: Button

Purpose:
Single reusable button used throughout the application. Never create
page-specific buttons — extend this one via props instead.

Current Features:
- Variants: primary, secondary, outline, danger, success, ghost, link
- Sizes: sm, md, lg
- Loading and disabled states
- Optional leading icon

Future:
- Could later add analytics tracking on click.
========================================
*/

const VARIANT_CLASSES = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  primaryOutline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
  link: 'text-primary-600 hover:underline p-0',
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  label,
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon = null,
  ariaLabel,
  fullWidth = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-1
        ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary}
        ${variant !== 'link' ? SIZE_CLASSES[size] || SIZE_CLASSES.md : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}`}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && Icon && <Icon size={16} />}
      {label || children}
    </button>
  )
}
