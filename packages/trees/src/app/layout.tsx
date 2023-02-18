import '@/styles/globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head></head>
      <body className="h-full bg-white">
        {children}
        <audio
          className="fixed top-0 right-0"
          loop autoPlay controls
        >
          <source src="meydan-surreal-forest.mp3" type="audio/mpeg" />
        </audio>
      </body>
    </html>
  );
}
