export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 h-[calc(100vh-120px)]">
      {children}
    </div>
  )
}
