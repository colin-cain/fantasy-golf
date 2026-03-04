type Props = {
  className?: string
}

export default function FGLLogo({ className = '' }: Props) {
  return (
    <div className={`inline-flex items-stretch bg-orange-600 rounded-[9px] overflow-hidden ring-1 ring-white/10 ${className}`}>

      {/* FGL — left section, fixed width to match right */}
      <div className="flex items-center justify-center w-[78px]">
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
        {/* Golf ball */}
        <div className="my-0.5 flex-shrink-0">
          <svg viewBox="0 0 14 14" width="14" height="14">
            <circle cx="7" cy="7" r="6.5" fill="white" />
            {/* Dimples */}
            <circle cx="5"   cy="5.5" r="1"   fill="rgba(234,88,12,0.25)" />
            <circle cx="9"   cy="5.5" r="1"   fill="rgba(234,88,12,0.25)" />
            <circle cx="7"   cy="9"   r="1"   fill="rgba(234,88,12,0.25)" />
            <circle cx="7"   cy="4"   r="0.7" fill="rgba(234,88,12,0.18)" />
          </svg>
        </div>
        <div className="w-px flex-1 bg-white/25" />
      </div>

      {/* Triple D logo — right section, fixed width to match left */}
      <div className="flex items-center justify-center w-[78px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://us1-prod-images.disco-api.com/2026/02/24/364c6d96-4edb-3091-acbe-acc0ac8fa0b4.png?w=120"
          alt="Diners, Drive-Ins and Dives"
          className="object-contain brightness-0 invert"
          style={{ height: '22px', maxWidth: '70px' }}
        />
      </div>

    </div>
  )
}
