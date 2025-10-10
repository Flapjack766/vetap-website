import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="en" className="dark">
      <head>
        <title>404 - Page Not Found | VETAP</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .container {
            text-align: center;
            max-width: 600px;
          }
          .icon {
            font-size: 80px;
            margin-bottom: 1.5rem;
            opacity: 0.6;
            animation: float 3s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          h1 {
            font-size: 8rem;
            font-weight: 900;
            background: linear-gradient(to right, #ffffff, #888888);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            line-height: 1;
          }
          h2 {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #ffffff;
          }
          p {
            font-size: 1.125rem;
            color: #999999;
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.875rem 2rem;
            background: #ffffff;
            color: #0a0a0a;
            text-decoration: none;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.2s;
          }
          .btn:hover {
            background: #e5e5e5;
            transform: translateY(-2px);
          }
          .links {
            margin-top: 2rem;
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          .link {
            color: #999999;
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.2s;
          }
          .link:hover {
            color: #ffffff;
          }
          .brand {
            margin-bottom: 2rem;
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="brand">VETAP</div>
          <div className="icon">🔍</div>
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>
            Oops! The page you're looking for doesn't exist or has been moved.
            <br />
            Let's get you back on track.
          </p>
          <Link href="/en" className="btn">
            <span>←</span>
            <span>Go Home</span>
          </Link>
          <div className="links">
            <Link href="/en/services" className="link">Services</Link>
            {/* <Link href="/en/portfolio" className="link">Portfolio</Link> */}
            <Link href="/en/about" className="link">About</Link>
            <Link href="/en/contact" className="link">Contact</Link>
          </div>
        </div>
      </body>
    </html>
  );
}

