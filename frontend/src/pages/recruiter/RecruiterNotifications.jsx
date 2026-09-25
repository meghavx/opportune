/*
==========================================
Component: RecruiterNotifications

Purpose:
Allows recruiters to view and manage placement announcements and
recruitment-related notifications (FR-4.9.1).

Current Features:
- Filter by notification type
- Notification cards with priority, read status, mark read/delete

Future Backend Integration:
GET /recruiter/notifications, PUT /recruiter/notifications/{id}, DELETE /recruiter/notifications/{id}.
==========================================
*/

import { useEffect, useState } from 'react'
import { Bell, Users, CalendarClock, Megaphone, AlertCircle, Award } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import FilterBar from '../../components/FilterBar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import SkeletonLoader from '../../components/SkeletonLoader'
import { getRecruiterNotifications } from '../../services/recruiterService'
import { markNotificationRead } from '../../services/notificationService'
import { useNotification } from '../../hooks/useNotification'

const TYPE_ICONS = {
  'Applications Received': Users,
  'Interview Reminder': CalendarClock,
  'Placement Announcement': Megaphone,
  'Deadline Reminder': AlertCircle,
  'Result Published': Award,
  General: Bell,
}

const FILTER_OPTIONS = ['Applications Received', 'Interview Reminder', 'Deadline Reminder', 'Result Published']

export default function RecruiterNotifications() {
  const { notify } = useNotification()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    // Backend Integration: replace with real GET /recruiter/notifications response.
    getRecruiterNotifications().then((res) => {
      setNotifications(res)
      setLoading(false)
    })
  }, [])

  const filtered = filter ? notifications.filter((n) => n.type === filter) : notifications

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleDelete = async (id) => {
    await deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    notify('Notification Deleted')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Applications, interview reminders, and results relevant to your drives."
        breadcrumb={['Dashboard', 'Notifications']}
      />

      <FilterBar
        filters={[{ name: 'filter', label: 'Type', value: filter, onChange: (e) => setFilter(e.target.value), options: FILTER_OPTIONS }]}
        onReset={() => setFilter('')}
      />

      {loading ? (
        <SkeletonLoader rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." icon={Bell} />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell
            return (
              <li
                key={n.id}
                className={`flex items-start gap-4 rounded-xl border p-4 ${n.read ? 'border-gray-200 bg-white' : 'border-primary-200 bg-primary-50/40'}`}
              >
                <span className="rounded-lg bg-white p-2 text-primary-600 shadow-sm">
                  <Icon size={18} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    <Badge label={n.priority} color={n.priority === 'High' ? 'red' : n.priority === 'Medium' ? 'yellow' : 'gray'} />
                  </div>
                  <p className="text-sm text-gray-600">{n.description}</p>
                  <p className="mt-1 text-xs text-gray-400">{n.time}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                      Mark Read
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
