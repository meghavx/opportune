/*
========================================
Component: DashboardLayout

Purpose:
The ONE shared layout used by every authenticated page in the
application (Sidebar + Main Content + Footer), per the mandatory
Dashboard Layout section of the spec. No page ever builds its own layout.

Current Features:
- Renders Sidebar, Footer, and the routed page content
- Controls sidebar open/close on mobile via useSidebar

Future Features
- None; keep this the single DashboardLayout implementation.
========================================
*/

import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Footer from './Footer'
import ToastContainer from '../components/Toast'
import { useSidebar } from '../hooks/useSidebar'

export default function DashboardLayout() {
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isOpen} onClose={closeSidebar} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex h-14 shrink-0 items-center border-b border-slate-200/70 px-4 md:hidden">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Open navigation menu"
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
          >
            <Menu size={22} />
          </button>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ToastContainer />
    </div>
  )
}
