type Props = {
  className?: string
}

export default function FGLLogo({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 80 90"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield body */}
      <path
        d="M4 0H76C78.2 0 80 1.8 80 4V54C80 67 63 80 40 90C17 80 0 67 0 54V4C0 1.8 1.8 0 4 0Z"
        fill="#1B3358"
      />
      {/* Inner border highlight */}
      <path
        d="M7.5 3.5H72.5C74 3.5 75.5 5 75.5 6.5V53.5C75.5 64.5 60 76.5 40 85.5C20 76.5 4.5 64.5 4.5 53.5V6.5C4.5 5 6 3.5 7.5 3.5Z"
        stroke="white"
        strokeOpacity="0.15"
        strokeWidth="1"
      />

      {/* FGL text */}
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fill="white"
        fontWeight="900"
        fontSize="38"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-1"
      >
        FGL
      </text>

      {/* Sponsor pill — orange for Triple D vibes */}
      <rect x="13" y="55" width="54" height="18" rx="9" fill="#EA580C" />
      <text
        x="40"
        y="67.5"
        textAnchor="middle"
        fill="white"
        fontWeight="700"
        fontSize="8.5"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.4"
      >
        Triple D
      </text>
    </svg>
  )
}
