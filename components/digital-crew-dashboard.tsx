"use client"

import { useRef, useState } from "react"
import { Zap, Loader2, Cpu, Mail, Terminal, AlertTriangle, Linkedin } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProgressTimeline, type TimelineStep } from "@/components/progress-timeline"
import { CodeWindow } from "@/components/code-window"

const INITIAL_STEPS: TimelineStep[] = [
  {
    id: "scraper",
    label: "Web Scraper Deep Scan",
    description: "Crawling target surface, assets and stack fingerprints.",
    status: "pending",
  },
  {
    id: "scout",
    label: "Scout Agent Flaw Analysis",
    description: "Detecting UX gaps, performance and conversion flaws.",
    status: "pending",
  },
  {
    id: "builder",
    label: "Builder Agent Pricing Calculation",
    description: "Drafting upgrade architecture and effort pricing.",
    status: "pending",
  },
  {
    id: "salesman",
    label: "Salesman Agent Pitch Compilation",
    description: "Composing the outreach email asset.",
    status: "pending",
  },
]

// DELETE THIS LINE
const API_ENDPOINT = `${(process.env as any).NEXT_PUBLIC_API_URL}/analyze`;
const CHANNEL_STEP_INDEX: Record<AssetChannel, number> = {
  scout: 1, // Scout agent
  blueprint: 2, // Builder agent
  pitch: 3, // Salesman agent
  review: 3, // Reviewer agent (same step)
  linkedin: 4, // LinkedIn agent
}

type AssetChannel = "scout" | "blueprint" | "pitch" | "review" | "linkedin"

function resolveChannel(name: unknown): AssetChannel | null {
  if (typeof name !== "string") return null
  const key = name.toLowerCase()
  if (key.includes("scout") || key.includes("analysis") || key.includes("flaw")) return "scout"
  if (key.includes("builder") || key.includes("blueprint") || key.includes("architecture")) return "blueprint"
  if (key.includes("review") || key.includes("alignment") || key.includes("quality")) return "review"
  if (key.includes("linkedin")) return "linkedin"
  if (key.includes("salesman") || key.includes("pitch") || key.includes("email")) return "pitch"
  return null
}

export function DigitalCrewDashboard() {
  const [url, setUrl] = useState("")
  const [steps, setSteps] = useState<TimelineStep[]>(INITIAL_STEPS)
  const [isRunning, setIsRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const [scout, setScout] = useState("")
  const [blueprint, setBlueprint] = useState("")
  const [pitch, setPitch] = useState("")
  const [review, setReview] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function setStepStatus(index: number, status: TimelineStep["status"]) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status } : s)))
  }

  function resetTimeline() {
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })))
  }

  function startSpinnerCycle() {
    let current = 0
    setSteps((prev) => prev.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })))
    intervalRef.current = setInterval(() => {
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i < current) return { ...s, status: "done" }
          if (i === current) return { ...s, status: "active" }
          return { ...s, status: "pending" }
        }),
      )
      current = Math.min(current + 1, INITIAL_STEPS.length - 1)
    }, 900)
  }

  function stopSpinnerCycle(success: boolean) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (success) {
      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })))
    }
  }

  function appendToChannel(channel: AssetChannel, delta: string) {
    if (!delta) return
    if (channel === "scout") setScout((prev) => prev + delta)
    else if (channel === "blueprint") setBlueprint((prev) => prev + delta)
    else if (channel === "pitch") setPitch((prev) => prev + delta)
    else if (channel === "review") setReview((prev) => prev + delta)
    else if (channel === "linkedin") setLinkedin((prev) => prev + delta)

    const activeIndex = CHANNEL_STEP_INDEX[channel]
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i < activeIndex) return { ...s, status: "done" }
        if (i === activeIndex) return { ...s, status: "active" }
        return s
      }),
    )
  }

  function routeStreamEvent(evt: unknown) {
    if (!evt || typeof evt !== "object") return
    const obj = evt as Record<string, unknown>

    if (typeof obj.status === "string" && (typeof obj.id === "string" || typeof obj.step === "string")) {
      const id = (obj.id ?? obj.step) as string
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: obj.status as TimelineStep["status"] } : s)),
      )
      return
    }

    const targetName = obj.target ?? obj.field ?? obj.channel ?? obj.agent
    const text = obj.text ?? obj.delta ?? obj.chunk ?? obj.content
    const directChannel = resolveChannel(targetName)
    if (directChannel && typeof text === "string") {
      appendToChannel(directChannel, text)
      return
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== "string") continue
      const channel = resolveChannel(key)
      if (channel) appendToChannel(channel, value)
    }
  }

  async function handleIgnite() {
    const target = url.trim()
    if (!target || isRunning) return

    setError(null)
    setScout("")
    setBlueprint("")
    setPitch("")
    setReview("")
    setLinkedin("")
    setStarted(true)
    setIsRunning(true)
    resetTimeline()
    startSpinnerCycle()

    try {
      // 1. Get the URL from environment variables, or default to your backend
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://digital-crew-backend.onrender.com";

// 2. Fetch from the dynamic URL
const res = await fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      })

      if (!res.ok) {
        throw new Error(`Backend responded with status ${res.status}`)
      }

      if (!res.body) {
        throw new Error("Streaming not supported: empty response body.")
      }

      stopSpinnerCycle(false)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let sawEvent = false

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let newlineIndex: number
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const rawLine = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          if (!rawLine) continue

          const payload = rawLine.startsWith("data:") ? rawLine.slice(5).trim() : rawLine
          if (payload === "[DONE]") continue

          try {
            routeStreamEvent(JSON.parse(payload))
            sawEvent = true
          } catch {
            // Not JSON — ignore
          }
        }
      }

      buffer += decoder.decode()
      const tail = buffer.trim()
      if (tail) {
        const payload = tail.startsWith("data:") ? tail.slice(5).trim() : tail
        try {
          const parsed = JSON.parse(payload)
          if (!sawEvent) {
            setScout(parsed?.scout_analysis ?? "")
            setBlueprint(parsed?.builder_blueprint ?? "")
            setPitch(parsed?.salesman_pitch ?? "")
            setReview(parsed?.review_status ?? "")
            setLinkedin(parsed?.linkedin_pitch ?? "")
          } else {
            routeStreamEvent(parsed)
          }
          sawEvent = true
        } catch {
          // ignore
        }
      }

      stopSpinnerCycle(true)
    } catch (err) {
      stopSpinnerCycle(false)
      setError(
        err instanceof Error
          ? `Connection failed: ${err.message}. Ensure the FastAPI server is running at ${API_ENDPOINT}.`
          : "An unknown error occurred.",
      )
    } finally {
      setIsRunning(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleIgnite()
  }

  return (
    <div className="grid-backdrop min-h-screen bg-background">
      <DashboardHeader />

      {/* WIDENED WRAPPER: Changed layout max-width to max-w-7xl to pull columns wide */}
      <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-14">
        {/* Hero / Input */}
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Luminous Protocol</p>
          <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Deploy the crew against any{" "}
            <span className="text-primary text-glow-teal">target</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            Autonomous agents scan, analyze, architect and pitch. Drop a URL and ignite the pipeline.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="glass relative flex flex-1 items-center rounded-xl border border-border focus-within:border-primary/60 focus-within:shadow-glow-teal">
              <Terminal className="ml-4 size-4 shrink-0 text-primary" aria-hidden="true" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ENTER TARGET URL OR SEED DIRECTORY..."
                aria-label="Target URL"
                className="w-full bg-transparent px-3 py-3.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleIgnite}
              disabled={isRunning || !url.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-glow-teal transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRunning ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Zap className="size-4" aria-hidden="true" />
              )}
              {isRunning ? "Igniting..." : "Ignite Digital Crew"}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-left"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              <p className="font-mono text-xs leading-relaxed text-destructive-foreground">{error}</p>
            </div>
          )}
        </section>

        {/* Pipeline + Results Grid Layout */}
        {started && (
          <div className="mt-12 grid gap-6 xl:grid-cols-[280px_1fr]">
            <ProgressTimeline steps={steps} />

            {/* EXPANDED COLUMN CONTAINER: Grid allows cards to claim much wider spacing footprints */}
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <CodeWindow
                title="Scout Analysis: Critical Flaws"
                icon={<AlertTriangle className="size-4" />}
                content={scout}
                accent="red"
                placeholder={isRunning ? "// Scout agent analyzing flaws..." : "// Awaiting scout analysis..."}
              />
              <CodeWindow
                title="Technical Upgrade Architecture"
                icon={<Cpu className="size-4" />}
                content={blueprint}
                accent="teal"
                placeholder={isRunning ? "// Builder agent computing blueprint..." : "// Awaiting builder output..."}
              />
              <CodeWindow
                title="Salesman Email Asset"
                icon={<Mail className="size-4" />}
                content={pitch}
                accent="purple"
                copyable
                placeholder={isRunning ? "// Salesman agent compiling pitch..." : "// Awaiting salesman output..."}
              />
              <CodeWindow
                title="Quality Review Status"
                icon={<Cpu className="size-4" />}
                content={review}
                accent="emerald"
                placeholder={isRunning ? "// Reviewer checking alignment..." : "// Awaiting review..."}
              />
              <CodeWindow
                title="LinkedIn Outreach Asset"
                icon={<Linkedin className="size-4" />}
                content={linkedin}
                accent="purple"
                copyable
                placeholder={isRunning ? "// LinkedIn agent drafting outreach..." : "// Awaiting LinkedIn output..."}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}