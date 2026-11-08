import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { forgotPassword } from '../../services/authService'

import Input from '../../components/Input'
import Button from '../../components/Button'
import Alert from '../../components/Alert'

import { ROUTES } from '../../constants/routes'
import { validateRequired } from '../../utils/validators'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const validate = () => {
    const newErrors = {}

    if (!validateRequired(email)) {
      newErrors.email = 'Email is required.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    if (!validate()) return

    setLoading(true)

    try {
      const response = await forgotPassword(email)
      setSuccessMessage(
        response.message || 'Password reset link sent successfully.'
      )
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-900"
      style={{
        backgroundColor: '#171817',
        backgroundImage: `
          radial-gradient(ellipse 38% 78% at 0% 52%, rgba(0, 112, 67, 0.30) 0%, rgba(0, 86, 55, 0.17) 38%, transparent 78%),
          radial-gradient(ellipse 38% 78% at 100% 52%, rgba(0, 112, 67, 0.27) 0%, rgba(0, 86, 55, 0.15) 38%, transparent 78%),
          linear-gradient(180deg, #171817 0%, #171817 100%)
        `,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/[0.04]" />

      <section className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[#FCFCFD] px-7 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:px-9 sm:py-9">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-[#42E886] to-teal-400" />

        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <GraduationCap size={29} strokeWidth={2} />
          </span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Forgot Password
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Enter your registered email address and we'll send you a link to
              reset your password.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-5">
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {errorMessage && (
          <div className="mb-5">
            <Alert type="error" message={errorMessage} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            required
            error={errors.email}
          />

          <div className="pt-1">
            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="bg-[#42e886]! text-slate-950 shadow-[0_5px_16px_rgba(34,197,94,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#31d978]! hover:shadow-[0_8px_20px_rgba(34,197,94,0.24)]"
            >
              Send Reset Link
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <Link
            to={ROUTES.LOGIN}
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Back to Sign In
          </Link>
        </div>
      </section>
    </main>
  )
}
