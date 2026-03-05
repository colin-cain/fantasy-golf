import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#ea580c',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 900,
            fontFamily: 'Arial Black, Arial, sans-serif',
            letterSpacing: -1,
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size }
  )
}
