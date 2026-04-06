import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#18181b',
          color: '#fafafa',
          fontSize: 80,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        SM
      </div>
    ),
    { width: 192, height: 192 }
  )
}
