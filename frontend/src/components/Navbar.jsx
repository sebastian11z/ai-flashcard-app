import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-black/10 bg-petal shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          to="/dashboard"
          className="text-sm font-semibold tracking-tight text-pale-oak"
        >
          PromptCards
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm transition-colors ${isActive ? 'font-medium text-pale-oak' : 'text-white/90 hover:text-pale-oak'}`
            }
          >
            Decks
          </NavLink>
          {user?.email && (
            <span className="hidden text-sm text-white/75 sm:inline">{user.email}</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-white/35 text-white hover:bg-white/15 hover:text-white"
            onClick={() => logout()}
          >
            Log out
          </Button>
        </nav>
      </div>
    </header>
  )
}
