import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'VETAP — Elite Website Design & Engineering';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              letterSpacing: -2,
              color: '#ffffff',
              textAlign: 'center',
            }}
          >
            VETAP
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#bbbbbb',
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            Elite Website Design & Engineering
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 32,
            }}
          >
            {['Fast', 'Secure', 'SEO-Optimized'].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: '12px 24px',
                  borderRadius: 999,
                  border: '1px solid #333',
                  color: '#fff',
                  fontSize: 20,
                  background: '#111',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

