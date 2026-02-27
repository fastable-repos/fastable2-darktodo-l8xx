import { useState, useEffect, useCallback } from 'react'

// ─── Data Model ────────────────────────────────────────────────────────────────
interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

type Filter = 'all' | 'active' | 'completed'

const STORAGE_TASKS = 'darktodo_tasks'
const STORAGE_DARK  = 'darktodo_darkmode'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_TASKS)
    if (raw) return JSON.parse(raw) as Task[]
  } catch (err) {
    console.error('Failed to load tasks from localStorage', err)
  }
  return []
}

function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks))
  } catch (err) {
    console.error('Failed to save tasks to localStorage', err)
  }
}

function loadDarkMode(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_DARK)
    if (raw !== null) return raw === 'true'
  } catch (err) {
    console.error('Failed to load dark mode preference', err)
  }
  return true // dark by default
}

function saveDarkMode(dark: boolean): void {
  try {
    localStorage.setItem(STORAGE_DARK, String(dark))
  } catch (err) {
    console.error('Failed to save dark mode preference', err)
  }
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks,   setTasks]   = useState<Task[]>(() => loadTasks())
  const [dark,    setDark]    = useState<boolean>(() => loadDarkMode())
  const [input,   setInput]   = useState('')
  const [filter,  setFilter]  = useState<Filter>('all')

  // Persist tasks whenever they change
  useEffect(() => { saveTasks(tasks) }, [tasks])
  // Persist dark mode whenever it changes
  useEffect(() => { saveDarkMode(dark) }, [dark])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const addTask = useCallback(() => {
    const text = input.trim()
    if (!text) return
    const task: Task = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => [...prev, task])
    setInput('')
  }, [input])

  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.completed))
  }, [])

  const toggleDark = useCallback(() => {
    setDark(prev => !prev)
  }, [])

  // ── Derived state ─────────────────────────────────────────────────────────────
  const activeCount    = tasks.filter(t => !t.completed).length
  const completedCount = tasks.filter(t =>  t.completed).length

  const visibleTasks = tasks.filter(t => {
    if (filter === 'active')    return !t.completed
    if (filter === 'completed') return  t.completed
    return true
  })

  // ── Theme classes ─────────────────────────────────────────────────────────────
  const bg      = dark ? 'bg-[#1a1a2e]'                : 'bg-[#f9fafb]'
  const card    = dark ? 'bg-[#16213e] shadow-2xl shadow-black/40' : 'bg-white shadow-xl shadow-gray-200'
  const textMain= dark ? 'text-gray-100'               : 'text-gray-900'
  const textSub = dark ? 'text-gray-400'               : 'text-gray-500'
  const inputBg = dark ? 'bg-[#0f3460] border-[#7c3aed]/40 text-gray-100 placeholder-gray-500'
                       : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
  const divider = dark ? 'border-gray-700'             : 'border-gray-200'
  const toggleBtn = dark
    ? 'bg-[#16213e] border border-[#7c3aed]/40 text-yellow-300 hover:bg-[#7c3aed]/20'
    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'

  const filterBase   = 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150'
  const filterActive = 'bg-[#7c3aed] text-white'
  const filterInact  = dark
    ? 'text-gray-400 hover:text-gray-200'
    : 'text-gray-500 hover:text-gray-700'

  return (
    <div
      data-testid="app"
      data-theme={dark ? 'dark' : 'light'}
      className={`min-h-screen ${bg} transition-colors duration-300 flex flex-col items-center py-12 px-4`}
    >
      {/* Theme toggle */}
      <div className="w-full max-w-[600px] flex justify-end mb-4">
        <button
          data-testid="theme-toggle"
          onClick={toggleDark}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`p-2 rounded-full transition-colors duration-200 ${toggleBtn}`}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      {/* Card */}
      <div className={`w-full max-w-[600px] rounded-2xl overflow-hidden ${card} transition-colors duration-300`}>

        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <h1 className={`text-3xl font-bold tracking-tight ${textMain} mb-6`}>
            <span className="text-[#7c3aed]">#</span> DarkTodo
          </h1>

          {/* Input row */}
          <div className="flex gap-3">
            <input
              data-testid="task-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask() }}
              placeholder="What needs to be done?"
              className={`flex-1 px-4 py-3 rounded-xl border text-sm outline-none
                focus:ring-2 focus:ring-[#7c3aed]/60 focus:border-[#7c3aed]
                transition-all duration-150 ${inputBg}`}
            />
            <button
              data-testid="add-button"
              onClick={addTask}
              className="px-5 py-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6]
                text-white text-sm font-semibold transition-colors duration-150 shrink-0"
            >
              Add
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className={`px-6 pb-3 flex gap-1 border-b ${divider}`}>
          {(['all', 'active', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              data-testid={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`${filterBase} ${filter === f ? filterActive : filterInact}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Task list */}
        <ul className="divide-y divide-transparent">
          {visibleTasks.length === 0 ? (
            <li className={`py-16 text-center text-sm ${textSub}`} data-testid="empty-state">
              {filter === 'all'
                ? 'No tasks yet — add one above!'
                : filter === 'active'
                  ? 'No active tasks — great job!'
                  : 'No completed tasks yet.'}
            </li>
          ) : (
            visibleTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                dark={dark}
                divider={divider}
                textMain={textMain}
                textSub={textSub}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </ul>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className={`px-6 py-4 flex items-center justify-between border-t ${divider}`}>
            <span data-testid="active-count" className={`text-xs font-medium ${textSub}`}>
              {activeCount} {activeCount === 1 ? 'task' : 'tasks'} left
            </span>
            {completedCount > 0 && (
              <button
                data-testid="clear-completed"
                onClick={clearCompleted}
                className={`text-xs font-medium transition-colors duration-150
                  ${dark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}
              >
                Clear Completed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Task Item ─────────────────────────────────────────────────────────────────
interface TaskItemProps {
  task: Task
  dark: boolean
  divider: string
  textMain: string
  textSub: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function TaskItem({ task, dark, divider, textMain, textSub, onToggle, onDelete }: TaskItemProps) {
  const rowHover = dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'

  return (
    <li
      data-testid="task-item"
      className={`group flex items-center gap-3 px-6 py-4 border-b ${divider} last:border-0
        transition-colors duration-150 ${rowHover}`}
    >
      {/* Checkbox */}
      <button
        data-testid="task-checkbox"
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50
          ${task.completed
            ? 'bg-[#7c3aed] border-[#7c3aed]'
            : dark
              ? 'border-gray-600 hover:border-[#7c3aed]'
              : 'border-gray-300 hover:border-[#7c3aed]'
          }`}
      >
        {task.completed && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Text */}
      <span
        data-testid="task-text"
        className={`flex-1 text-sm leading-relaxed transition-all duration-150
          ${task.completed
            ? `line-through ${textSub}`
            : textMain
          }`}
      >
        {task.text}
      </span>

      {/* Delete button */}
      <button
        data-testid="task-delete"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className={`shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
          transition-all duration-150 focus:opacity-100 focus:outline-none
          ${dark
            ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
      >
        <TrashIcon />
      </button>
    </li>
  )
}
