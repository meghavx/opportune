// /*
// ==========================================
// Component: SuperAdminDashboard

// Purpose:
// Gives the Super Admin a high-level summary of the whole system —
// Placement Admin accounts, institution users, uptime, and active
// sessions (SRS 2.3 Super Admin responsibilities: manage Placement Admin
// accounts, configure system settings, monitor system activities).

// Current Features:
// - Statistic cards for system-wide metrics

// Future Backend Integration:
// GET /super-admin/dashboard.
// ==========================================
// */

// import { useEffect, useState } from 'react'
// import { ShieldCheck, Users, Activity, Server } from 'lucide-react'
// import PageHeader from '../../components/PageHeader'
// import StatisticCard from '../../components/StatisticCard'
// import SkeletonLoader from '../../components/SkeletonLoader'
// import { getSuperAdminDashboard } from '../../services/superAdminService'

// export default function SuperAdminDashboard() {
//   const [data, setData] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     // Backend Integration: replace with real GET /super-admin/dashboard response.
//     getSuperAdminDashboard().then((res) => {
//       setData(res)
//       setLoading(false)
//     })
//   }, [])

//   return (
//     <div className="flex flex-col gap-6">
//       <PageHeader
//         title="Super Admin Dashboard"
//         description="System-wide overview and administrative controls."
//         breadcrumb={['Dashboard']}
//       />

//       {loading || !data ? (
//         <SkeletonLoader rows={4} />
//       ) : (
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           <StatisticCard title="Placement Admins" value={data.stats.totalPlacementAdmins} icon={ShieldCheck} />
//           <StatisticCard title="Institution Users" value={data.stats.totalInstitutionUsers} icon={Users} />
//           <StatisticCard title="System Uptime" value={data.stats.systemUptime} icon={Server} />
//           <StatisticCard title="Active Sessions" value={data.stats.activeSessions} icon={Activity} />
//         </div>
//       )}
//     </div>
//   )
// }


/*
==========================================
Component: SuperAdminDashboard

Purpose:
Home page for the Super Admin.

Displays the currently logged in Super Admin's
profile information fetched from GET /api/auth/me.

Future:
Additional dashboard widgets can be added once
backend analytics endpoints are available.
==========================================
*/

import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  User,
  Mail,
  BadgeCheck,
  Users,
  ClipboardList,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Button from '../../components/Button'
import SkeletonLoader from '../../components/SkeletonLoader'

import { getCurrentUser } from '../../services/superAdminService'
import { APP_NAME } from '../../config/appConfig'

export default function SuperAdminDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await getCurrentUser()
        setUser(data)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Super Admin Dashboard"
          description="Welcome back."
          breadcrumb={['Dashboard']}
        />
        <SkeletonLoader rows={6} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Super Admin Dashboard"
        description={`Welcome to ${APP_NAME}.`}
        breadcrumb={['Dashboard']}
      />

      <Card>
        <div className="flex flex-col gap-6">

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <ShieldCheck size={34} className="text-primary-700" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {user?.fullName}
              </h2>

              <p className="text-sm text-gray-500">
                Super Administrator
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <User size={18} />
                <span className="font-medium">Name</span>
              </div>

              <p className="text-gray-700">
                {user?.fullName}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Mail size={18} />
                <span className="font-medium">Email</span>
              </div>

              <p className="text-gray-700 break-all">
                {user?.email}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <BadgeCheck size={18} />
                <span className="font-medium">Role</span>
              </div>

              <p className="text-gray-700">
                {user?.role}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={18} />
                <span className="font-medium">Access Level</span>
              </div>

              <p className="text-gray-700">
                Full System Access
              </p>
            </div>

          </div>
        </div>
      </Card>

      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <Button
            icon={Users}
            onClick={() => navigate('/super-admin/placement-admins')}
          >
            Placement Admins
          </Button>

          <Button
            variant="outline"
            icon={ClipboardList}
            onClick={() => navigate('/super-admin/audit-logs')}
          >
            Audit Logs
          </Button>
        </div>
      </Card>
    </div>
  )
}