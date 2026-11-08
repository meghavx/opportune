/*
Purpose
Renders the standalone login page using the reusable LoginCard component.

Current Features
- Displays the reusable login card centered on the page.

Future Features
- Authentication logic is implemented inside LoginCard.
*/

import LoginCard from '../../components/auth/LoginCard'

export default function LoginPage() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setShowLogin(false)
        }
      }}
    >
      <div className="w-full max-w-md">
        <LoginCard />
      </div>
    </div>
  )
}