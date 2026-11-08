import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

import Input from '../Input'
import PasswordInput from '../PasswordInput'
import Dropdown from '../Dropdown'
import Button from '../Button'
import Alert from '../Alert'

import { useAuth } from '../../hooks/useAuth'
import { ROLE_HOME_ROUTE } from '../../routes/sidebarMenus'
import { ROLES } from '../../constants/roles'
import { ROUTES } from '../../constants/routes'
import { validateRequired } from '../../utils/validators'
import { APP_NAME } from '../../config/appConfig'

const ROLE_OPTIONS = [
  { label: 'Placement Admin', value: ROLES.PLACEMENT_ADMIN },
  { label: 'Recruiter', value: ROLES.RECRUITER },
  { label: 'Student', value: ROLES.STUDENT },
]

export default function LoginCard() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!validateRequired(role)) {
      newErrors.role = 'Please select a role.'
    }

    if (!validateRequired(username)) {
      newErrors.username = 'Email is required.'
    }

    if (!validateRequired(password)) {
      newErrors.password = 'Password is required.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (!validate()) return

    setLoading(true)

    try {
      const loggedInUser = await login(username, password, role)
      navigate(ROLE_HOME_ROUTE[loggedInUser.role])
    } catch (err) {
      setLoginError(
        err.message || 'Invalid email, password, or role selected.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[#FCFCFD] px-7 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:px-9 sm:py-9">
      {/* Small accent at the top ties the card to Opportune's emerald theme. */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-[#42E886] to-teal-400" />

      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <GraduationCap size={29} strokeWidth={2} />
        </span>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {APP_NAME}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to your placement workspace
          </p>
        </div>
      </div>

      {loginError && (
        <div className="mb-5">
          <Alert type="error" message={loginError} />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        <Dropdown
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={ROLE_OPTIONS}
          placeholder="Select your role"
          required
          error={errors.role}
        />

        <Input
          label="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="you@college.edu"
          required
          error={errors.username}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          error={errors.password}
        />

        <div className="pt-1">
          <Button
            type="submit"
            loading={loading}
            fullWidth
            className="bg-[#42e886]! text-slate-950 shadow-[0_5px_16px_rgba(34,197,94,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#31d978]! hover:shadow-[0_8px_20px_rgba(34,197,94,0.24)]"
          >
            Log In
          </Button>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          className="self-start text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Forgot Password?
        </button>
      </form>

    </div>
  )
}
