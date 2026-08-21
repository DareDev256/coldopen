import './globals.css';

export const metadata = {
  title: 'COLD OPEN Studio',
  description: 'Name the world. The design falls out of the name.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
