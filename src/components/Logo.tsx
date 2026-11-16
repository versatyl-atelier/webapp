import {
  LOGO_GREY_POINTS,
  LOGO_MITER_LIMIT,
  LOGO_ORANGE_POINTS,
  LOGO_PATH_LENGTH,
  LOGO_PEACH_POINTS,
  LOGO_STROKES,
  LOGO_STROKE_WIDTH,
  LOGO_VIEW_BOX,
} from "@/constants/logo";

const STROKE_DELAYS = [
  "delay-0",
  "delay-70",
  "delay-140",
  "delay-210",
  "delay-280",
] as const;

const STRIPE_CLASS = "motion-safe:group-hover:animate-logo-fade-in";

export function Logo() {
  return (
    <svg
      viewBox={LOGO_VIEW_BOX}
      aria-hidden
      focusable="false"
      className="overflow-visible transition-transform duration-100 group-active:scale-90"
    >
      <polygon
        points={LOGO_PEACH_POINTS}
        className={`fill-logo-peach ${STRIPE_CLASS}`}
      />
      <polygon
        points={LOGO_ORANGE_POINTS}
        className={`fill-logo-orange ${STRIPE_CLASS}`}
      />
      <polygon
        points={LOGO_GREY_POINTS}
        className={`fill-logo-grey ${STRIPE_CLASS}`}
      />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={LOGO_STROKE_WIDTH}
        strokeMiterlimit={LOGO_MITER_LIMIT}
        strokeLinejoin="miter"
      >
        {LOGO_STROKES.map(({ d, square }, index) => (
          <path
            key={d}
            d={d}
            pathLength={LOGO_PATH_LENGTH}
            strokeDasharray={LOGO_PATH_LENGTH}
            strokeLinecap={square ? "square" : "butt"}
            className={`${STROKE_DELAYS[index]} motion-safe:group-hover:animate-logo-draw`}
          />
        ))}
      </g>
    </svg>
  );
}
