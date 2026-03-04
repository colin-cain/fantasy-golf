type Props = {
  className?: string
}

export default function FGLLogo({ className = '' }: Props) {
  return (
    <div className={`inline-flex items-stretch bg-orange-600 rounded-[9px] overflow-hidden ring-1 ring-white/10 ${className}`}>

      {/* FGL — left section */}
      <div className="flex items-center justify-center w-[62px]">
        <span
          className="text-white leading-none"
          style={{ fontFamily: 'var(--font-bebas)', fontSize: '27px', letterSpacing: '0.08em', paddingTop: '2px' }}
        >
          FGL
        </span>
      </div>

      {/* Divider with golf ball */}
      <div className="flex flex-col items-center py-1.5">
        <div className="w-px flex-1 bg-white/25" />
        {/* Golf ball — many small dimples, not bowling ball */}
        <div className="my-0.5 flex-shrink-0">
          <svg viewBox="0 0 12 12" width="11" height="11">
            <circle cx="6" cy="6" r="5.5" fill="white" />
            {/* Dimples scattered across the ball */}
            <circle cx="4"   cy="3.8" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="6"   cy="3.2" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="8"   cy="3.8" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="3.2" cy="5.8" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="5.2" cy="5.2" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="7.2" cy="5.2" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="8.8" cy="5.8" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="4"   cy="7.8" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="6"   cy="8.4" r="0.55" fill="rgba(234,88,12,0.28)" />
            <circle cx="8"   cy="7.8" r="0.55" fill="rgba(234,88,12,0.28)" />
          </svg>
        </div>
        <div className="w-px flex-1 bg-white/25" />
      </div>

      {/* Triple D logo — right section */}
      <div className="flex items-center justify-center w-[62px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://us1-prod-images.disco-api.com/2026/02/24/364c6d96-4edb-3091-acbe-acc0ac8fa0b4.png?w=120"
          alt="Diners, Drive-Ins and Dives"
          className="object-contain brightness-0 invert"
          style={{ height: '22px', maxWidth: '58px' }}
        />
      </div>

    </div>
  )
}
