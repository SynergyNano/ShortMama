'use client'

import Search from './search'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100/35 via-white to-purple-50/25">

      <div className="w-full">
        <Search />
      </div>
    </div>
  )
}
