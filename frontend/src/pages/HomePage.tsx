import React, { useEffect, useState } from 'react'
import { TopBar } from '../components/TopBar'
import { WorkingGroupSection } from '../components/WorkingGroupSection'
import { AccountSidebar } from '../components/AccountSidebar'
import { CreateProjectDialog } from '../components/CreateProjectDialog'
import { CreateGroupDialog } from '../components/CreateGroupDialog'
import { useAuth } from '../context/AuthContext'
import { getMyWorkGroups } from '../api/workGroupAPI'
import type { WorkGroup } from '../types/workgroup'
import { Button } from '../components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<WorkGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [createInGroup, setCreateInGroup] = useState<WorkGroup | null>(null)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      setGroups(await getMyWorkGroups())
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
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <TopBar />

      <div className="mx-auto flex max-w-[1600px] gap-8 px-6 py-10 md:px-10">
        <AccountSidebar groups={groups} />

        <main className="flex-1 min-w-0">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Workspace</p>
              <h1 className="mt-2 font-heading text-4xl font-light tracking-tighter text-zinc-50 md:text-5xl" data-testid="dashboard-title">
                Good to see you, <span className="font-medium">{user.username}</span>.
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                {groups.length} working group{groups.length === 1 ? '' : 's'} · {projectCount} projects
              </p>
            </div>
            <Button onClick={() => setCreateGroupOpen(true)} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 rounded-full" data-testid="new-group-btn">
              <Plus className="mr-2 h-4 w-4" />
              New group
            </Button>
          </div>

          {loading ? (
            <p className="text-zinc-500">Loading...</p>
          ) : (
            <div className="space-y-14">
              {groups.length === 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-zinc-500">
                  You're not in any working groups yet.
                </div>
              )}
              {groups.map((group) => (
                <WorkingGroupSection key={group.id} group={group} onChanged={refresh} onCreateProject={() => setCreateInGroup(group)} />
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