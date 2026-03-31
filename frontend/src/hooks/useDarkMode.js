import { useCallback, useLayoutEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

function readStoredIsDark() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark'
  } catch {
    return false
  }
}

function applyRootClass(isDark) {
  const root = document.documentElement
  if (isDark) root.classList.add('dark')
  else root.classList.remove('dark')
}

/**
 * @returns {[boolean, () => void]}
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? readStoredIsDark() : false
  )

  useLayoutEffect(() => {
    applyRootClass(isDark)
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [isDark])

  const toggleDark = useCallback(() => {
    setIsDark((d) => !d)
  }, [])

  return [isDark, toggleDark]
}
