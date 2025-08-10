import './globals.css';

export const metadata = {
  title: 'Feedback App - Full Stack',
  description: 'Anonymous feedback demo with real-time updates',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900 antialiased">{children}</body>
    </html>
  );
} 