export const metadata = {
  title: 'Sanity Studio',
  description: 'Content management for James McDougall blog',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
