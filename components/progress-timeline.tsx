"use client"

import { Check, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export type StepStatus = "pending" | "active" | "done"

export interface TimelineStep {
  id: string
  label: string
  description: string
  status: StepStatus
}

export function ProgressTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="glass rounded-xl border border-border p-6">
      <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Crew Execution Pipeline
      </p>
      <ol className="relative flex flex-col gap-6">
        {steps.map((step, i) => (
          <li key={step.id} className="relative flex items-start gap-4">
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "absolute left-[15px] top-9 h-[calc(100%+8px)] w-px",
                  step.status === "done" ? "bg-primary/50" : "bg-border",
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                step.status === "done" && "border-success/60 bg-success/15 text-success",
                step.status === "active" && "border-primary/60 bg-primary/15 text-primary shadow-glow-teal",
                step.status === "pending" && "border-border bg-secondary text-muted-foreground",
              )}
            >
              {step.status === "done" && <Check className="size-4" aria-hidden="true" />}
              {step.status === "active" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {step.status === "pending" && <Circle className="size-3" aria-hidden="true" />}
            </span>
            <div className="pt-1">
              <p
                className={cn(
                  "font-mono text-sm font-medium transition-colors",
                  step.status === "pending" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
            <span className="ml-auto pt-1.5">
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-wider",
                  step.status === "done" && "text-success",
                  step.status === "active" && "text-primary",
                  step.status === "pending" && "text-muted-foreground/60",
                )}
              >
                {step.status === "done" ? "Complete" : step.status === "active" ? "Running" : "Queued"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
