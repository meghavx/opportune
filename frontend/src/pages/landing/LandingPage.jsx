import {
  GraduationCap,
  Building2,
  Briefcase,
  ArrowRight,
} from 'lucide-react'

import LoginCard from '../../components/auth/LoginCard'
import { APP_NAME } from '../../config/appConfig'

export default function LandingPage() {
  return (
    <div className="relative h-screen overflow-hidden bg-[#08111F]">

      {/* Background Glow */}
      <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[#42E886]/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-emerald-400/10 blur-3xl" />

      {/* Decorative circles */}
      <div className="absolute left-24 top-20 h-3 w-3 rounded-full bg-[#42E886]" />
      <div className="absolute left-52 top-40 h-2 w-2 rounded-full bg-white/50" />
      <div className="absolute bottom-40 left-40 h-2 w-2 rounded-full bg-[#42E886]/70" />

      <div className="mx-auto flex h-screen max-w-7xl items-center justify-between px-12">

        {/* LEFT */}

        <div className="max-w-xl">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#42E886]/20 bg-[#42E886]/10 px-5 py-2">

            <GraduationCap
              size={18}
              className="text-[#42E886]"
            />

            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#42E886]">

              {APP_NAME.toUpperCase()}

            </span>

          </div>

          <h1 className="text-6xl font-black leading-tight text-white">

            Your Next
            <span className="block text-[#42E886]">
              Opportunity
            </span>
            Starts Here.

          </h1>

          <p className="mt-8 max-w-lg text-lg leading-8 text-gray-300">

            Helping students discover placement opportunities,
            connect with recruiters, and begin successful careers
            through one unified placement platform.

          </p>

          <div className="mt-12 flex gap-5">

            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">

              <Building2
                className="mb-3 text-[#42E886]"
                size={28}
              />

              <h3 className="font-semibold text-white">

                Top Recruiters

              </h3>

              <p className="mt-2 text-sm text-gray-400">

                Connect with companies participating
                in campus placement drives.

              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">

              <Briefcase
                className="mb-3 text-[#42E886]"
                size={28}
              />

              <h3 className="font-semibold text-white">

                Placement Drives

              </h3>

              <p className="mt-2 text-sm text-gray-400">

                Explore opportunities that match
                your career aspirations.

              </p>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="relative w-full max-w-md shrink-0">

          <div className="absolute -inset-6 rounded-[40px] bg-[#42E886]/10 blur-2xl" />

          <div className="relative">

            <LoginCard />

          </div>

        </div>

      </div>

    </div>
  )
}