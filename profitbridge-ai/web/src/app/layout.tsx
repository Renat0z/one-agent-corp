export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'sans-serif', backgroundColor: '#0a0a0a', color: 'white', padding: '2rem' }}>
        {children}
      </body>
    </html>
  );
}
