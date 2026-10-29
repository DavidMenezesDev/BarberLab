"use client"

import { ProgressProvider } from "@bprogress/next/app"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProgressProvider
      height="4px"
      color="#7577E0"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  )
}

export default Providers
