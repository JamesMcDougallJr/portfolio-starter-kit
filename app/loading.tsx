import { LoadingSpinner } from './components/loading-spinner'

export default function Loading(): JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
