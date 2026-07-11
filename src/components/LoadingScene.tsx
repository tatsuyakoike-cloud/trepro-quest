export type LoadingVariant = 'battle' | 'book'

interface LoadingSceneProps {
  variant: LoadingVariant
  message: string
  fullscreen?: boolean
}

function BattleAnimation() {
  return (
    <div className="pixel-loading-battle" aria-hidden="true">
      <div className="pixel-loading-battle__ground" />
      <div className="pixel-loading-battle__hero">
        <div className="pixel-loading-battle__hero-head" />
        <div className="pixel-loading-battle__hero-body" />
        <div className="pixel-loading-battle__hero-legs" />
        <div className="pixel-loading-battle__sword" />
      </div>
      <div className="pixel-loading-battle__hit">!</div>
      <div className="pixel-loading-battle__hp">
        <div className="pixel-loading-battle__hp-fill" />
      </div>
      <div className="pixel-loading-battle__slime" />
    </div>
  )
}

function BookAnimation() {
  return (
    <div className="pixel-loading-book" aria-hidden="true">
      <div className="pixel-loading-book__base" />
      <div className="pixel-loading-book__page pixel-loading-book__page--3" />
      <div className="pixel-loading-book__page pixel-loading-book__page--2" />
      <div className="pixel-loading-book__page pixel-loading-book__page--1" />
      <span className="pixel-loading-book__sparkle pixel-loading-book__sparkle--1">✦</span>
      <span className="pixel-loading-book__sparkle pixel-loading-book__sparkle--2">✦</span>
    </div>
  )
}

export function LoadingScene({ variant, message, fullscreen = false }: LoadingSceneProps) {
  const wrapClass = fullscreen
    ? 'pixel-loading-wrap pixel-loading-wrap--fullscreen pixel-bg-world'
    : 'pixel-loading-wrap py-12'

  return (
    <div className={wrapClass} role="status" aria-live="polite" aria-label={message}>
      {variant === 'battle' ? <BattleAnimation /> : <BookAnimation />}
      <p className="pixel-loading-message">{message}</p>
    </div>
  )
}
