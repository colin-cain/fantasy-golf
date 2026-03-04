type Props = {
  className?: string
}

export default function FGLLogo({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 215 52"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer pill */}
      <rect width="210" height="52" rx="9" fill="#EA580C" />
      {/* Inner border highlight */}
      <rect x="1.5" y="1.5" width="207" height="49" rx="7.5" stroke="white" strokeOpacity="0.2" strokeWidth="1" />

      {/* FGL — left section */}
      <text
        x="52"
        y="37"
        textAnchor="middle"
        fill="white"
        fontWeight="900"
        fontSize="30"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        FGL
      </text>

      {/* Divider */}
      <line x1="104" y1="11" x2="104" y2="41" stroke="white" strokeOpacity="0.35" strokeWidth="1" />
      {/* Dot */}
      <circle cx="109" cy="26" r="2.5" fill="white" fillOpacity="0.45" />

      {/* Triple D — right section */}
      <text
        x="160"
        y="32"
        textAnchor="middle"
        fill="white"
        fontWeight="700"
        fontSize="16"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.3"
      >
        Triple D
      </text>
      <text
        x="160"
        y="44"
        textAnchor="middle"
        fill="white"
        fillOpacity="0.6"
        fontSize="8"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="1"
      >
        FOOD NETWORK
      </text>

      {/* ™ outside pill */}
      <text
        x="213"
        y="48"
        textAnchor="middle"
        fill="#EA580C"
        fillOpacity="0.7"
        fontSize="7"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        ™
      </text>
    </svg>
  )
}
