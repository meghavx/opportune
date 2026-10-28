/*
========================================
Component: Footer

Purpose:
Simple shared footer shown at the bottom of the dashboard layout.

Current Features:
- Copyright line

Future:
- None.
========================================
*/

import { APP_NAME } from '../config/appConfig'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 px-6 py-4 text-center text-xs text-gray-400">
      © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
    </footer>
  )
}
