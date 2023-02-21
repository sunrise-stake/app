import { Brandmark } from '@/partials/brandmark'

export const metadata = {
  title: 'trees. - Sunrise Stake',
  desciption: '',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function Page() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Brandmark />
    </div>
  )
}
