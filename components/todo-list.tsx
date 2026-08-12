"use client"

import { useState, useTransition } from "react"
import type { TodoItem } from "@/lib/types"
import { addTodo, toggleTodo, deleteTodo, resetCategory } from "@/app/actions/todos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Sun, CalendarDays, Target, Plus, Trash2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "daily" as const, label: "Dailies", icon: Sun, resettable: true },
  { id: "weekly" as const, label: "Weeklies", icon: CalendarDays, resettable: true },
  { id: "goal" as const, label: "Goals", icon: Target, resettable: false },
]

export function TodoList({ initialItems }: { initialItems: TodoItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [pending, startTransition] = useTransition()

  function add(category: TodoItem["category"], text: string) {
    if (!text.trim()) return
    startTransition(async () => setItems(await addTodo(text, category)))
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {CATEGORIES.map((cat) => {
        const catItems = items.filter((t) => t.category === cat.id)
        const doneCount = catItems.filter((t) => t.done).length
        return (
          <Card key={cat.id} className="flex flex-col border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <cat.icon className="size-4 text-primary" />
                {cat.label}
                <span className="text-xs font-normal text-muted-foreground">
                  {doneCount}/{catItems.length}
                </span>
              </CardTitle>
              {cat.resettable && catItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  disabled={pending}
                  onClick={() => startTransition(async () => setItems(await resetCategory(cat.id)))}
                >
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2">
              {catItems.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Nothing here yet.</p>
              )}
              {catItems.map((t) => (
                <div
                  key={t.id}
                  className="group flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                >
                  <Checkbox
                    checked={t.done}
                    disabled={pending}
                    onCheckedChange={() => startTransition(async () => setItems(await toggleTodo(t.id)))}
                  />
                  <span className={cn("flex-1 text-sm", t.done && "text-muted-foreground line-through")}>
                    {t.text}
                  </span>
                  <button
                    type="button"
                    aria-label="Delete task"
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    disabled={pending}
                    onClick={() => startTransition(async () => setItems(await deleteTodo(t.id)))}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <AddRow onAdd={(text) => add(cat.id, text)} disabled={pending} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function AddRow({ onAdd, disabled }: { onAdd: (text: string) => void; disabled: boolean }) {
  const [text, setText] = useState("")
  return (
    <form
      className="mt-auto flex items-center gap-2 pt-2"
      onSubmit={(e) => {
        e.preventDefault()
        onAdd(text)
        setText("")
      }}
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task..."
        className="h-8 text-sm"
        maxLength={200}
      />
      <Button type="submit" size="sm" variant="secondary" className="h-8 px-2" disabled={disabled || !text.trim()}>
        <Plus className="size-4" />
      </Button>
    </form>
  )
}
