import { cn } from '@/lib/utils'

/**
 * Study-mode flashcard with 3D flip (click or Space from parent).
 */
export default function FlashCard({ front, back, flipped, onFlip, className }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className={cn(
        'relative h-64 w-full max-w-xl cursor-pointer rounded-xl border-2 border-pale-oak/55 bg-transparent p-0 text-left shadow-md outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-lilac/45 dark:border-zinc-600 sm:h-72',
        className
      )}
      aria-label={flipped ? 'Show question' : 'Show answer'}
    >
      <div
        className="relative h-full w-full [perspective:1200px]"
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl border border-pale-oak/50 bg-pink-orchid px-6 py-4 [backface-visibility:hidden] dark:border-zinc-500 dark:bg-pink-orchid/80"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-center text-lg font-medium leading-relaxed text-stone-800 dark:text-zinc-900">
              {front}
            </p>
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl border border-lilac/25 bg-pale-oak/25 px-6 py-4 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-zinc-600 dark:bg-zinc-700/80"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-center text-lg leading-relaxed text-stone-800 dark:text-zinc-100">
              {back}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}
