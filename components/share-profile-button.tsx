"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { GameId } from "@/lib/games"
import { Check, Share2 } from "lucide-react"

export function ShareProfileButton({ gameId, uid }: { gameId: GameId; uid: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = `${window.location.origin}/u/${gameId}/${uid}`
    const data = { title: "My gacha luck profile", text: "Check out my gacha stats", url }
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share(data)
        return
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copy your public profile link:", url)
    }
  }

  return (
    <Button variant="outline" onClick={share} className="gap-2 bg-transparent">
      {copied ? <Check className="size-4 text-primary" /> : <Share2 className="size-4" />}
      {copied ? "Link copied" : "Share"}
    </Button>
  )
}
