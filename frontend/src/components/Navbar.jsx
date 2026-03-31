import { Link, NavLink } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isDark, toggleDark] = useDarkMode()

  return (
    <header className="border-b border-black/10 bg-petal shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          to="/dashboard"
          className="text-sm font-semibold tracking-tight text-pale-oak dark:text-zinc-100"
        >
          PromptCards
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm transition-colors ${isActive ? 'font-medium text-pale-oak dark:text-zinc-100' : 'text-white/90 hover:text-pale-oak dark:text-zinc-200 dark:hover:text-zinc-100'}`
            }
          >
            Decks
          </NavLink>
          {user?.email && (
            <span className="hidden text-sm text-white/75 dark:text-zinc-300 sm:inline">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={toggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-md border border-white/35 p-2 text-white transition-colors hover:bg-white/15 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-white/35 text-white hover:bg-white/15 hover:text-white dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            onClick={() => logout()}
          >
            Log out
          </Button>
        </nav>
      </div>
    </header>
  )
}
