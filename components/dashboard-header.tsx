import { Activity, Zap } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-5 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary shadow-glow-teal">
          <Zap className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-balance font-mono text-xl font-bold tracking-tight text-primary text-glow-teal md:text-2xl">
          Digital Crew
        </h1>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        <Activity className="size-3.5 text-success" aria-hidden="true" />
        <span className="font-mono text-xs font-medium text-success">System: Active</span>
      </div>
    </header>
  )
}
