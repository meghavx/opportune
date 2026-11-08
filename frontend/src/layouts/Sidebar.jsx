
import { NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, UserRound, X } from 'lucide-react'
import { SIDEBAR_MENUS } from '../routes/sidebarMenus'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import { ROLE_LABELS } from '../constants/roles'
import { APP_NAME } from '../config/appConfig'

export default function Sidebar({ isOpen, onClose }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  const menuItems = SIDEBAR_MENUS[role] || []

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          role="presentation"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 shrink-0
          border-r border-white/10 bg-[#0B131F] text-slate-300
          transition-transform duration-200
          md:static md:h-full md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav className="flex h-full flex-col overflow-y-auto px-4 py-6">
          <div className="mb-8 border-b border-white/10 pb-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-emerald-400/10 p-2 text-emerald-400">
                  <GraduationCap size={22} />
                </span>
                <span className="text-lg font-semibold tracking-tight text-white">
                  {APP_NAME}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="rounded-md p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white md:hidden"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/[0.06] p-2 text-slate-300">
                <UserRound size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {/* <span className="text-slate-500"></span> */}
                  <span className="font-medium text-white">{user?.fullName}</span>
                </p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[role]}</p>
              </div>
            </div>
          </div>

          <ul className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path.split('/').length <= 2}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'border-emerald-400/15 bg-emerald-400/10 text-emerald-400 shadow-sm'
                        : 'border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} strokeWidth={1.9} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-red-400/10 hover:bg-red-400/10 hover:text-red-400"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>
    </>
  )
}
