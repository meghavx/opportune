import { useEffect, useState } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

import LoginCard from '../../components/auth/LoginCard'
import { APP_NAME } from '../../config/appConfig'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Assisted Workflows',
    description: 'Job description extraction and resume matching.',
    color: 'emerald',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'One platform for admins, recruiters and students.',
    color: 'blue',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Placement Management',
    description: 'Drives, applications and recruitment in one place.',
    color: 'violet',
  },
  {
    icon: BarChart3,
    title: 'Placement Insights',
    description: 'A clear view of placement activity and progress.',
    color: 'teal',
  },
]

const featureColors = {
  emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  blue: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
  violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  teal: 'bg-teal-400/10 text-teal-300 ring-teal-400/20',
}

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (!showLogin) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowLogin(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLogin])

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-white lg:h-screen lg:overflow-hidden"
      style={{
        backgroundColor: '#171817',
        backgroundImage: `
          radial-gradient(ellipse 38% 78% at 0% 52%, rgba(0, 112, 67, 0.30) 0%, rgba(0, 86, 55, 0.17) 38%, transparent 78%),
          radial-gradient(ellipse 38% 78% at 100% 52%, rgba(0, 112, 67, 0.27) 0%, rgba(0, 86, 55, 0.15) 38%, transparent 78%),
          linear-gradient(180deg, #171817 0%, #171817 100%)
        `,
      }}
    >
      <style>{`
        /* Keep the page background visible during browser overscroll. */
        html,
        body,
        #root {
          min-height: 100%;
          background-color: #171817;
        }

        @keyframes featureEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-feature-enter {
          animation: featureEnter 560ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-feature-enter {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>

      <header className="relative z-20 mx-auto flex max-w-[1800px] items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
        <a href="#" className="flex items-center gap-3" aria-label={`${APP_NAME} home`}>
          <GraduationCap size={38} strokeWidth={2.1} className="text-[#42E886]" />
          <span>
            <span className="block text-xl font-bold leading-6 tracking-tight">{APP_NAME}</span>
            <span className="block text-xs text-slate-400">Campus Placement Platform</span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="rounded-xl border border-slate-300/60 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-[#42E886] hover:text-[#42E886] focus:outline-none focus:ring-2 focus:ring-[#42E886]/70"
        >
          Sign In
        </button>
      </header>

      <section className="relative z-10 mx-auto flex max-w-[1800px] items-center justify-center px-6 pb-8 pt-8 text-center sm:px-10 lg:h-[54vh] lg:px-16 lg:pb-4 lg:pt-0">
        <div className="mx-auto max-w-[850px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-2 text-xs font-semibold text-emerald-300 sm:text-sm">
            <Sparkles size={15} />
            AI-powered campus placements
          </div>

          <h1 className="text-[clamp(2.8rem,5vw,4.8rem)] font-extrabold leading-[1.05] tracking-tight">
            Smarter Placements.
            <span className="mt-1 block text-[#42E886]">Powered by AI.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[1200px] text-sm leading-7 text-slate-300 sm:text-base">
            One platform for placement drives, applications and recruitment — enhanced with AI-powered job extraction and resume matching.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-2 text-xs font-medium text-emerald-200">
              <FileText size={14} /> Job description extraction
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.06] px-4 py-2 text-xs font-medium text-violet-200">
              <Users size={14} /> Resume analysis & matching
            </span>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1280px] px-6 pb-0 pt-8 sm:px-10 lg:h-auto lg:px-12 lg:pb-0 lg:pt-7">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Built for the entire placement journey
          </h2>
        </div>

        <div className="grid min-h-[108px] overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.035] shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, color }, index) => (
            <article
              key={title}
              style={{ animationDelay: `${index * 110}ms` }}
              className={`group flex items-center gap-3 px-4 py-3 opacity-0 animate-feature-enter transition-colors duration-300 hover:bg-white/[0.045] sm:px-5 lg:px-4 xl:px-6 ${
                index > 0 ? 'border-t border-white/[0.08] sm:border-l sm:border-t-0' : ''
              } ${index > 1 ? 'lg:border-l lg:border-t-0' : ''}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 ${featureColors[color]}`}>
                <Icon size={18} strokeWidth={1.9} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-white sm:text-sm">{title}</h3>
                <p className="mt-1 text-[11px] leading-[1.45] text-slate-400 sm:text-xs">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="absolute bottom-3 left-0 z-10 w-full px-6 text-center">
        <p className="text-xs leading-5 text-slate-500 sm:text-sm">
          © 2026 Opportune. All rights reserved.
        </p>
      </footer>

      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowLogin(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sign in to Opportune"
            className="relative w-full max-w-md"
          >
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              aria-label="Close sign in"
              className="absolute right-3 top-3 z-10 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={20} />
            </button>
            <LoginCard />
          </div>
        </div>
      )}
    </main>
  )
}
