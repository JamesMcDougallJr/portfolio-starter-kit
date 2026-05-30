export default function Page(): JSX.Element {
  return (
    <iframe
      src="https://historical-map-omega.vercel.app/map"
      className="h-full w-full border-0"
      title="Historical Map"
      allow="geolocation"
    />
  )
}
