import { Avatar, AvatarImage, AvatarFallback } from '@components/shared/ui/avatar'

interface Props {
  username: string
  profilePicture?: string | null
  avatarColor: string
  className?: string
}

export function UserAvatar({ username, profilePicture, avatarColor, className }: Props) {
  return (
    <Avatar className={className}>
      {profilePicture && <AvatarImage src={profilePicture} alt={username} />}
      <AvatarFallback className="text-xs font-medium text-zinc-950" style={{ background: avatarColor }}>
        {username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}