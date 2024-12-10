import './_styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0'
        />
        <title>Wikipedia Synonym Search</title>
      </head>
      <body className='h-screen bg-gray-900 flex items-center justify-center'>{children}</body>
    </html>
  );
}
