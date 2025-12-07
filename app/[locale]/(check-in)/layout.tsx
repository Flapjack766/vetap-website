import { ReactNode } from 'react';

interface CheckInLayoutProps {
  children: ReactNode;
}

// This layout is used for check-in pages that don't need the main site's Header/Footer
// The children are rendered directly without any wrapper
export default function CheckInLayout({ children }: CheckInLayoutProps) {
  return <>{children}</>;
}

