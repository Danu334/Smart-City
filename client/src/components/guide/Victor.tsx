import styles from "./Guide.module.css";

const SKIN = "#f3c6a2";
const SUIT = "#13294b";

function WavingArm() {
  return (
    <g className={styles.wave}>
      <path d="M54 200L38 146" stroke={SUIT} strokeWidth="20" strokeLinecap="round" />
      <ellipse cx="37" cy="141" rx="10" ry="4.5" fill="#fff" transform="rotate(-18 37 141)" />
      <g stroke={SKIN} strokeWidth="5.5" strokeLinecap="round">
        <path d="M28 121l-3-12M33 119l-1-13M38 119l1-12M42 122l3-10M27 131l-7-6" />
      </g>
      <circle cx="34" cy="128" r="10.5" fill={SKIN} />
    </g>
  );
}

function PointingArm() {
  return (
    <g>
      <path d="M54 200L32 162" stroke={SUIT} strokeWidth="20" strokeLinecap="round" />
      <ellipse cx="31" cy="157" rx="10" ry="4.5" fill="#fff" transform="rotate(-30 31 157)" />
      <path d="M22 146L9 131" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />
      <circle cx="26" cy="150" r="9.5" fill={SKIN} />
      <path d="M31 145l3-6" stroke={SKIN} strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

// Victor, the site's guide: a young municipal specialist. Pure SVG so it
// stays crisp at any size; `pose` swaps the arm for waving or pointing.
type VictorProps = {
  pose?: "idle" | "wave" | "point";
  className?: string;
  /** Accessible name; omit for a decorative Victor. */
  title?: string;
  viewBox?: string;
};

export default function Victor({ pose = "idle", className, title, viewBox = "0 0 200 250" }: VictorProps) {
  return (
    <svg viewBox={viewBox} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx="100" cy="110" r="84" fill="#dfe8f4" />
      {/* neck + shadow under jaw */}
      <path d="M87 124h26v30H87z" fill="#e8b48e" />
      <path d="M87 126c8 8 18 8 26 0v10c-8 4-18 4-26 0z" fill="#d69a74" />
      {/* suit */}
      <path d="M22 250c0-50 28-86 78-98 50 12 78 48 78 98z" fill={SUIT} />
      <path d="M83 150l17 46 17-46c-6-2-11-3-17-3s-11 1-17 3z" fill="#fff" />
      {/* slim tie */}
      <path d="M96 152h8l-1 8h-6z" fill="#083e7c" />
      <path d="M97 160h6l3 32-6 7-6-7z" fill="#0b4f9c" />
      {/* lapels */}
      <path d="M83 150l17 46-26-6-12-30z" fill="#0d1f3a" />
      <path d="M117 150l-17 46 26-6 12-30z" fill="#0d1f3a" />
      {/* badge */}
      <rect x="128" y="200" width="26" height="18" rx="3" fill="#fff" />
      <path d="M133 207h16M133 212h10" stroke="#0b4f9c" strokeWidth="2.4" strokeLinecap="round" />
      {/* Moldovan flag lapel pin */}
      <g transform="rotate(-8 70 184)">
        <rect x="61" y="179" width="18" height="11" rx="1.5" fill="#fff" />
        <rect x="62" y="180" width="5.4" height="9" fill="#0046ae" />
        <rect x="67.3" y="180" width="5.4" height="9" fill="#ffd200" />
        <rect x="72.6" y="180" width="5.4" height="9" fill="#cc092f" />
        <circle cx="70" cy="184.5" r="1.6" fill="#8a5a1c" />
      </g>
      {/* ears */}
      <ellipse cx="67" cy="96" rx="6" ry="9.5" fill="#e8b48e" />
      <ellipse cx="133" cy="96" rx="6" ry="9.5" fill="#e8b48e" />
      {/* face */}
      <path d="M68 86c0-26 14-40 32-40s32 14 32 40c0 12-2 22-6 30-6 12-14 19-26 21-12-2-20-9-26-21-4-8-6-18-6-30z" fill={SKIN} />
      {/* short side-part hair */}
      <path d="M67 96C62 74 64 50 80 39C93 30 114 29 127 37C139 45 141 68 136 96L132 96C132 82 131 73 127 66C114 58 98 54 86 56C80 58 75 64 72 72L72 96Z" fill="#2a211d" />
      <path d="M90 40C102 34 118 35 128 44" stroke="#4a3d36" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M96 47C106 43 118 44 126 51" stroke="#4a3d36" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
      {/* brows */}
      <path d="M76 82C81 77 88 77 93 79M107 79C112 77 119 77 124 82" stroke="#2a211d" strokeWidth="4.2" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <g className={styles.blink}>
        <path d="M78 93c4-4 10-4 14 0-4 3-10 3-14 0z" fill="#fff" />
        <path d="M108 93c4-4 10-4 14 0-4 3-10 3-14 0z" fill="#fff" />
        <circle cx="85" cy="93" r="3.6" fill="#3a2a20" />
        <circle cx="115" cy="93" r="3.6" fill="#3a2a20" />
        <circle cx="86.2" cy="91.8" r="1.2" fill="#fff" />
        <circle cx="116.2" cy="91.8" r="1.2" fill="#fff" />
        <path d="M77 92.5c4.5-5 11.5-5 16 0M107 92.5c4.5-5 11.5-5 16 0" stroke="#16202e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      {/* nose, smile, cheeks */}
      <path d="M101 95c-1 5-2 9-5 12 2 2 6 2 8 0" fill="none" stroke="#cf8f6a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M89 115c6.5 5.5 15.5 5.5 22 0" stroke="#8f4a34" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="76" cy="108" rx="6" ry="3.5" fill="#e79a8a" opacity=".25" />
      <ellipse cx="124" cy="108" rx="6" ry="3.5" fill="#e79a8a" opacity=".25" />

      {pose === "wave" && <WavingArm />}
      {pose === "point" && <PointingArm />}
    </svg>
  );
}
