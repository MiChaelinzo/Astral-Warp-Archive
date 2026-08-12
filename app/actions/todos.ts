"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { getCurrentUser } from "@/lib/auth"
import { getTodos, saveTodos } from "@/lib/db"
import type { TodoItem } from "@/lib/types"

export async function addTodo(text: string, category: TodoItem["category"]): Promise<TodoItem[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not signed in")
  const clean = text.trim().slice(0, 200)
  if (!clean) return getTodos(user.email)
  const items = await getTodos(user.email)
  items.push({ id: nanoid(8), text: clean, done: false, category, createdAt: Date.now() })
  await saveTodos(user.email, items)
  revalidatePath("/todo")
  return items
}

export async function toggleTodo(id: string): Promise<TodoItem[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not signed in")
  const items = await getTodos(user.email)
  const next = items.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
  await saveTodos(user.email, next)
  revalidatePath("/todo")
  return next
}

export async function deleteTodo(id: string): Promise<TodoItem[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not signed in")
  const items = (await getTodos(user.email)).filter((t) => t.id !== id)
  await saveTodos(user.email, items)
  revalidatePath("/todo")
  return items
}

// Clears completed items, or all items in a category reset (for dailies/weeklies).
export async function resetCategory(category: TodoItem["category"]): Promise<TodoItem[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not signed in")
  const items = (await getTodos(user.email)).map((t) =>
    t.category === category ? { ...t, done: false } : t,
  )
  await saveTodos(user.email, items)
  revalidatePath("/todo")
  return items
}
