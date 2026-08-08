import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

   return (
     <Button
       variant="ghost"
       size="sm"
       onClick={toggleTheme}
       className="px-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
       aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
       data-testid="theme-toggle"
     >
       {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
     </Button>
   )
}