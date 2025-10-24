'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/lib/actions/auth.actions'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const result = await logoutAction()

      if (result.success) {
        toast.success('Logged out successfully')
        router.push('/auth/login')
        router.refresh()
      } else {
        toast.error(result.error)
        setIsLoading(false)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
