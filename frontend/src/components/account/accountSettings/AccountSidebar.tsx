import React from 'react'
import { useAuth } from '@context/AuthContext'
import type { WorkGroup } from '@app-types/workgroup'
import { Users, LayoutGrid, Circle } from 'lucide-react'
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { AccountSettingsDialog } from '@components/account/accountSettings/AccountSettingsDialog'
import { UserAvatar } from '@components/shared/UserAvatar'
import { recordGroupOpened } from '@/lib/recentActivity'


interface Props {
  groups: WorkGroup[]
  refreshFunction: () => void
}

export const AccountSidebar: React.FC<Props> = ({ groups, refreshFunction }) => {
  const { user } = useAuth()

  const [settingsOpen, setSettingsOpen] = useState(false)
  if (!user) return null

  const projectCount = groups.reduce((n, g) => n + g.projects.length, 0)
  function handleClickProject( groupID: number) {
 
        if (user) {
    
         
          recordGroupOpened(user.username, groupID)
          refreshFunction()

        }

  }
  return (
    <aside className="hidden w-72 shrink-0 lg:block" data-testid="account-sidebar">
      <div className="sticky top-24 space-y-6">
        <div className="rounded-xl border border-border bg-card/40 p-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              username={user.username}
              profilePicture={user.profilePicture}
              avatarColor={user.avatarColor}
              className="h-8 w-8 border border-border"
            />
            <p className="truncate font-heading text-lg font-medium text-foreground" data-testid="sidebar-username">
              {user.username}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2">
            <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Active workspace</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground-secondary"
            data-testid="open-account-settings"
          >
            <Settings className="h-3.5 w-3.5" />
            Account settings
          </button>

          <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">At a glance</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat icon={<Users className="h-4 w-4" />} value={groups.length} label="Groups" />
            <Stat icon={<LayoutGrid className="h-4 w-4" />} value={projectCount} label="Projects" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your groups</p>
          <ul className="mt-4 space-y-2">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-foreground-secondary hover:bg-accent hover:text-accent-foreground">
                <button onClick={() => handleClickProject(g.id)} className="flex-1 min-w-0 text-left">
                  <span className="truncate">{g.name}</span>
                </button>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground-subtle">{g.members.length}</span>
              </li>
            ))}
            {groups.length === 0 && <li className="text-sm text-muted-foreground-subtle">No groups yet</li>}
          </ul>
        </div>
      </div>
    </aside>
  )
}

const Stat: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
  <div>
    <div className="flex items-center gap-2 text-muted-foreground">{icon}</div>
    <div className="mt-2 font-heading text-2xl font-light text-foreground">{value}</div>
    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
  </div>
)