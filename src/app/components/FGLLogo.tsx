type Props = {
  className?: string
}

export default function FGLLogo({ className = '' }: Props) {
  return (
    <div className={`inline-flex items-stretch bg-orange-600 rounded-[9px] overflow-hidden ring-1 ring-white/10 ${className}`}>

      {/* FGL — left section */}
      <div className="flex items-center px-3.5">
        <span
          className="text-white leading-none tracking-widest"
          style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px' }}
        >
          FGL
        </span>
      </div>

      {/* Divider */}
      <div className="w-px bg-white/25 my-2" />

      {/* Triple D logo — right section */}
      <div className="flex items-center px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://us1-prod-images.disco-api.com/2026/02/24/364c6d96-4edb-3091-acbe-acc0ac8fa0b4.png?w=120"
          alt="Diners, Drive-Ins and Dives"
          className="h-5 w-auto object-contain brightness-0 invert"
        />
      </div>

    </div>
  )
}
