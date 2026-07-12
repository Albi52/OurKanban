import React from 'react'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { useAuth } from '../context/AuthContext'
import type { WorkGroup } from '../types/workgroup'
import { Users, LayoutGrid, Circle } from 'lucide-react'
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { AccountSettingsDialog } from './AccountSettingsDialog'


interface Props {
  groups: WorkGroup[]
}

export const AccountSidebar: React.FC<Props> = ({ groups }) => {
  const { user } = useAuth()

  const [settingsOpen, setSettingsOpen] = useState(false)
  if (!user) return null

  const projectCount = groups.reduce((n, g) => n + g.projects.length, 0)

  return (
    <aside className="hidden w-72 shrink-0 lg:block" data-testid="account-sidebar">
      <div className="sticky top-24 space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border border-zinc-800">
              <AvatarFallback className="text-sm font-medium text-zinc-950" style={{ background: user.avatarColor }}>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="truncate font-heading text-lg font-medium text-zinc-50" data-testid="sidebar-username">
              {user.username}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
            <span className="text-xs text-zinc-400">Active workspace</span>
          </div>
          <button
  onClick={() => setSettingsOpen(true)}
  className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
  data-testid="open-account-settings"
>
  <Settings className="h-3.5 w-3.5" />
  Account settings
</button>

<AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">At a glance</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat icon={<Users className="h-4 w-4" />} value={groups.length} label="Groups" />
            <Stat icon={<LayoutGrid className="h-4 w-4" />} value={projectCount} label="Projects" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Your groups</p>
          <ul className="mt-4 space-y-2">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900">
                <span className="truncate">{g.name}</span>
                <span className="text-xs text-zinc-600">{g.members.length}</span>
              </li>
            ))}
            {groups.length === 0 && <li className="text-sm text-zinc-600">No groups yet</li>}
          </ul>
        </div>
      </div>
    </aside>
  )
}

const Stat: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
  <div>
    <div className="flex items-center gap-2 text-zinc-500">{icon}</div>
    <div className="mt-2 font-heading text-2xl font-light text-zinc-50">{value}</div>
    <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
  </div>
)