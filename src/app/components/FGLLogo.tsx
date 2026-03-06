type Props = {
  className?: string
}

export default function FGLLogo({ className = '' }: Props) {
  return (
    <div className={`inline-flex items-stretch border-[3px] border-white rounded-[9px] overflow-hidden ${className}`}>

      {/* FGL — left section */}
      <div className="flex items-center justify-center w-[68px]">
        <span
          className="text-white leading-none"
          style={{ fontFamily: 'var(--font-bebas)', fontSize: '38px', letterSpacing: '0.1em', marginRight: '-0.1em', paddingTop: '5px' }}
        >
          FGL
        </span>
      </div>

      {/* Divider with golf ball */}
      <div className="flex flex-col items-center">
        <div className="w-0.5 flex-1 bg-white" />
        <div className="my-0.5 flex-shrink-0">
          {/* Golf ball: hex-grid dimple pattern clipped to circle */}
          <svg viewBox="0 0 12 12" width="11" height="11">
            <defs>
              <clipPath id="fgl-ball-clip">
                <circle cx="6" cy="6" r="5.4" />
              </clipPath>
            </defs>
            <circle cx="6" cy="6" r="5.5" fill="white" />
            <g clipPath="url(#fgl-ball-clip)">
              {/* Row 1 y=1.2 */}
              <circle cx="3.2" cy="1.2" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="4.6" cy="1.2" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.0" cy="1.2" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="7.4" cy="1.2" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.8" cy="1.2" r="0.5" fill="rgba(0,80,40,0.25)" />
              {/* Row 2 y=2.5 offset */}
              <circle cx="2.5" cy="2.5" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="3.9" cy="2.5" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="5.3" cy="2.5" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.7" cy="2.5" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.1" cy="2.5" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="9.5" cy="2.5" r="0.5" fill="rgba(0,80,40,0.25)" />
              {/* Row 3 y=3.8 */}
              <circle cx="1.8" cy="3.8" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="3.2" cy="3.8" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="4.6" cy="3.8" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.0" cy="3.8" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="7.4" cy="3.8" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.8" cy="3.8" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="10.2" cy="3.8" r="0.5" fill="rgba(0,80,40,0.25)" />
              {/* Row 4 y=5.1 offset */}
              <circle cx="1.1" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="2.5" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="3.9" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="5.3" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.7" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.1" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="9.5" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="10.9" cy="5.1" r="0.5" fill="rgba(0,80,40,0.25)" />
              {/* Row 5 y=6.4 */}
              <circle cx="1.8" cy="6.4" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="3.2" cy="6.4" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="4.6" cy="6.4" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.0" cy="6.4" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="7.4" cy="6.4" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.8" cy="6.4" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="10.2" cy="6.4" r="0.5" fill="rgba(0,80,40,0.25)" />
              {/* Row 6 y=7.7 offset */}
              <circle cx="2.5" cy="7.7" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="3.9" cy="7.7" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="5.3" cy="7.7" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.7" cy="7.7" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.1" cy="7.7" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="9.5" cy="7.7" r="0.5" fill="rgba(0,80,40,0.25)" />
              {/* Row 7 y=9.0 */}
              <circle cx="3.2" cy="9.0" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="4.6" cy="9.0" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.0" cy="9.0" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="7.4" cy="9.0" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.8" cy="9.0" r="0.5" fill="rgba(0,80,40,0.25)" />
              {/* Row 8 y=10.3 offset */}
              <circle cx="3.9" cy="10.3" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="5.3" cy="10.3" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="6.7" cy="10.3" r="0.5" fill="rgba(0,80,40,0.25)" />
              <circle cx="8.1" cy="10.3" r="0.5" fill="rgba(0,80,40,0.25)" />
            </g>
          </svg>
        </div>
        <div className="w-0.5 flex-1 bg-white" />
      </div>

      {/* Triple D logo — right section */}
      <div className="flex items-center justify-center w-[68px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://us1-prod-images.disco-api.com/2026/02/24/364c6d96-4edb-3091-acbe-acc0ac8fa0b4.png?w=120"
          alt="Diners, Drive-Ins and Dives"
          className="object-contain brightness-0 invert"
          style={{ height: '25px', maxWidth: '62px' }}
        />
      </div>

    </div>
  )
}
