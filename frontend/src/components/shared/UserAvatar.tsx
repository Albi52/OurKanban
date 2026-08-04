import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@components/shared/ui/avatar'

interface Props {
  username: string
  profilePicture?: string | null | undefined
  avatarColor: string
  className?: string
}

export function UserAvatar({ username, profilePicture, avatarColor, className }: Props) {
    if (profilePicture === undefined) {
    // Not fetched yet — render a neutral placeholder, not the initials
    // fallback, so users who DO have a picture don't see a flash of the
    // wrong avatar before it loads.
    return (
      <div
        className={cn('animate-pulse rounded-full bg-zinc-800', className)}
        aria-hidden="true"
      />
    )
  }
  return (
    <Avatar className={className}>
      {profilePicture && <AvatarImage src={profilePicture} alt={username} />}
      <AvatarFallback 
      delayMs={profilePicture ? 400 : undefined}
      className="text-xs font-medium text-zinc-950" 
      style={{ background: avatarColor }}>
        {username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}