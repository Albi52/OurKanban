import React, { useEffect, useState } from 'react'
import { TopBar } from '@components/shared/TopBar'
import { WorkingGroupSection } from '@components/homeManagement/workgroups/WorkingGroupSection'
import { AccountSidebar } from '@components/account/accountSettings/AccountSidebar'
import { CreateProjectDialog } from '@components/homeManagement/projects/CreateProjectDialog'
import { CreateGroupDialog } from '@components/homeManagement/workgroups/CreateGroupDialog'
import { useAuth } from '@context/AuthContext'
import { getMyWorkGroups } from '@api/homeManagement/workGroupAPI'
import type { WorkGroup } from '@app-types/workgroup'
import { Button } from '@components/shared/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { VerifyEmailBanner } from '@components/account/auth/EmailVerifyBanner'

import { getGroupRecency, getProjectRecency } from '@lib/recentActivity'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<WorkGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [createInGroup, setCreateInGroup] = useState<WorkGroup | null>(null)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)


  async function refresh() {
    setLoading(true)
    try {
      const data = await getMyWorkGroups()
      const username = user?.username ?? ''

      const sorted = data
        .map((g) => ({
          ...g,
          projects: [...g.projects].sort(
            (a, b) => getProjectRecency(username, b.id) - getProjectRecency(username, a.id)
          ),
        }))
        .sort((a, b) => getGroupRecency(username, b.id) - getGroupRecency(username, a.id))

      setGroups(sorted)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  if (!user) return null

  const projectCount = groups.reduce((n, g) => n + g.projects.length, 0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />

      <div className="mx-auto flex max-w-[1600px] gap-8 px-6 py-10 md:px-10">
        <AccountSidebar groups={groups} refreshFunction={refresh} />

        <main className="flex-1 min-w-0">
          <div className="mb-8 flex flex-col items-start gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground0">Workspace</p>
              <h1 className="mt-2 font-heading text-3xl font-light tracking-tighter text-foreground sm:text-4xl md:text-5xl" data-testid="dashboard-title">
                Good to see you, <span className="font-medium">{user.username}</span>.
              </h1>
              <div className="my-4">
                <VerifyEmailBanner />
              </div>
              <p className="mt-2 text-sm text-foreground0">
                {groups.length} working group{groups.length === 1 ? '' : 's'} · {projectCount} projects
              </p>
            </div>
            <Button onClick={() => setCreateGroupOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" data-testid="new-group-btn">
              <Plus className="mr-2 h-4 w-4" />
              New group
            </Button>
          </div>

          {loading ? (
            <p className="text-foreground0">Loading...</p>
          ) : (
            <div className="space-y-14">
              {groups.length === 0 && (
                <div className="rounded-xl border border-border bg-card/40 p-12 text-center text-foreground0">
                  You're not in any working groups yet.
                </div>
              )}
              {groups.map((group, index) => (
                <WorkingGroupSection key={group.id} group={group} onChanged={refresh} onCreateProject={() => setCreateInGroup(group)} initiallyCollapsed={index !== 0} />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateProjectDialog group={createInGroup} onClose={() => setCreateInGroup(null)} onCreated={() => { setCreateInGroup(null); refresh() }} />
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} onCreated={refresh} />
    </div>
  )
}

export default HomePage