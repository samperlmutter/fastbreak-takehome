import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/supabase/server'
import { EventList } from '@/components/events/event-list'
import { EventListSkeleton } from '@/components/events/event-list-skeleton'
import { LogoutButton } from '@/components/auth/logout-button'

interface DashboardPageProps {
  searchParams: Promise<{ search?: string; sportType?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getUser()
  const params = await searchParams

  if (!user) {
    return null // Middleware will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fastbreak Event Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/events/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<EventListSkeleton />}>
          <EventList
            initialSearch={params.search}
            initialSportType={params.sportType}
          />
        </Suspense>
      </main>
    </div>
  )
}
