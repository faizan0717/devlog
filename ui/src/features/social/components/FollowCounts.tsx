interface FollowCountsProps {
  followers: number
  following: number
}

export function FollowCounts({ followers, following }: FollowCountsProps) {
  return (
    <div className="flex items-center gap-4 text-body">
      <span>
        <strong className="text-ink-primary font-semibold">{followers}</strong>{' '}
        <span className="text-ink-tertiary">Followers</span>
      </span>
      <span>
        <strong className="text-ink-primary font-semibold">{following}</strong>{' '}
        <span className="text-ink-tertiary">Following</span>
      </span>
    </div>
  )
}
