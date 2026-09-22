/** Placeholder mark: a turned spindle, the shape a lathe makes. Replace when there is a real logo. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10 4H22V7H18V9.5C21 11 22.5 13.5 22.5 16C22.5 18.5 21 21 18 22.5V25H23V28H9V25H14V22.5C11 21 9.5 18.5 9.5 16C9.5 13.5 11 11 14 9.5V7H10Z" fill="currentColor" />
    </svg>
  )
}
