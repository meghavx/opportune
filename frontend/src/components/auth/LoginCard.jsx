
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
      const loggedInUser = await login(
        username,
        password,
        role
      )

      navigate(ROLE_HOME_ROUTE[loggedInUser.role])
    } catch (err) {
      setLoginError(
        err.message ||
        'Invalid email, password, or role selected.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
<div className="w-full max-w-md rounded-3xl border border-white/40 bg-[#FCFCFD]/90 backdrop-blur-xl p-10 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">

      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="rounded-full bg-emerald-50 p-3 text-primary-600">
          <GraduationCap size={28} />
        </span>

        <h1 className="text-xl font-semibold text-gray-900">
          {APP_NAME}
        </h1>

        <p className="text-sm text-slate-500">
          Sign in to continue
        </p>
      </div>

      {loginError && (
        <div className="mb-4">
          <Alert
            type="error"
            message={loginError}
          />
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

        <Button
          type="submit"
          loading={loading}
          fullWidth
          className="bg-[#42e886]! hover:bg-[#28d0ac]! text-white"
        >
          Log In
        </Button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          className="text-left text-sm text-primary-600 hover:underline"
        >
          Forgot Password?
        </button>

      </form>

    </div>
  )
}