import { test, expect, type Page } from '@playwright/test'
import { captureScreenshot } from './helpers'

// Helper: clear localStorage and reload fresh
async function freshPage(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('[data-testid="task-input"]')
}

// Helper: add a task via Enter key
async function addTask(page: Page, text: string) {
  await page.fill('[data-testid="task-input"]', text)
  await page.press('[data-testid="task-input"]', 'Enter')
}

// ─── Happy Path Tests ──────────────────────────────────────────────────────────

test('happy path: add a task and see it in the list with counter increment', async ({ page }) => {
  await freshPage(page)

  // Counter starts at 0 (footer hidden when no tasks)
  await expect(page.locator('[data-testid="active-count"]')).not.toBeVisible()

  // Add a task
  await addTask(page, 'Buy groceries')

  // Task appears
  const taskItems = page.locator('[data-testid="task-item"]')
  await expect(taskItems).toHaveCount(1)
  await expect(page.locator('[data-testid="task-text"]').first()).toHaveText('Buy groceries')

  // Checkbox is unchecked (no line-through)
  const taskText = page.locator('[data-testid="task-text"]').first()
  await expect(taskText).not.toHaveClass(/line-through/)

  // Counter shows 1
  await expect(page.locator('[data-testid="active-count"]')).toBeVisible()
  await expect(page.locator('[data-testid="active-count"]')).toHaveText('1 task left')
})

test('happy path: mark a task complete applies strikethrough and decrements counter', async ({ page }) => {
  await freshPage(page)

  await addTask(page, 'Read a book')
  await addTask(page, 'Go for a walk')

  // Counter should show 2
  await expect(page.locator('[data-testid="active-count"]')).toHaveText('2 tasks left')

  // Click checkbox of first task
  await page.locator('[data-testid="task-checkbox"]').first().click()

  // First task text gets strikethrough
  await expect(page.locator('[data-testid="task-text"]').first()).toHaveClass(/line-through/)

  // Counter decrements to 1
  await expect(page.locator('[data-testid="active-count"]')).toHaveText('1 task left')
})

test('happy path: clear completed button removes completed tasks, keeps active ones', async ({ page }) => {
  await freshPage(page)

  await addTask(page, 'Task A')
  await addTask(page, 'Task B')
  await addTask(page, 'Task C')

  // Complete Task A and Task C
  const checkboxes = page.locator('[data-testid="task-checkbox"]')
  await checkboxes.nth(0).click()
  await checkboxes.nth(2).click()

  // Clear completed
  await page.locator('[data-testid="clear-completed"]').click()

  // Only Task B should remain
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(1)
  await expect(page.locator('[data-testid="task-text"]').first()).toHaveText('Task B')

  // Counter shows 1 active
  await expect(page.locator('[data-testid="active-count"]')).toHaveText('1 task left')
})

// ─── Filter Tests ──────────────────────────────────────────────────────────────

test('filter: all / active / completed tabs show correct subsets', async ({ page }) => {
  await freshPage(page)

  await addTask(page, 'Alpha')
  await addTask(page, 'Beta')
  await addTask(page, 'Gamma')

  // Complete "Beta"
  await page.locator('[data-testid="task-checkbox"]').nth(1).click()

  // Active filter — only uncompleted
  await page.locator('[data-testid="filter-active"]').click()
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(2)

  // Completed filter — only completed
  await page.locator('[data-testid="filter-completed"]').click()
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(1)
  await expect(page.locator('[data-testid="task-text"]').first()).toHaveText('Beta')

  // All filter — everything back
  await page.locator('[data-testid="filter-all"]').click()
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(3)
})

// ─── Persistence Tests ─────────────────────────────────────────────────────────

test('data persistence: tasks survive page refresh', async ({ page }) => {
  await freshPage(page)

  await addTask(page, 'Persistent task 1')
  await addTask(page, 'Persistent task 2')

  // Complete task 1
  await page.locator('[data-testid="task-checkbox"]').first().click()

  // Refresh
  await page.reload()
  await page.waitForSelector('[data-testid="task-input"]')

  // Both tasks still present
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(2)

  // Task 1 still completed (strikethrough)
  await expect(page.locator('[data-testid="task-text"]').first()).toHaveClass(/line-through/)

  // Task 2 still active
  await expect(page.locator('[data-testid="task-text"]').nth(1)).not.toHaveClass(/line-through/)
})

test('dark mode persistence: light mode survives page refresh', async ({ page }) => {
  await freshPage(page)

  // App should start in dark mode
  await expect(page.locator('[data-testid="app"]')).toHaveAttribute('data-theme', 'dark')

  // Toggle to light mode
  await page.locator('[data-testid="theme-toggle"]').click()
  await expect(page.locator('[data-testid="app"]')).toHaveAttribute('data-theme', 'light')

  // Refresh
  await page.reload()
  await page.waitForSelector('[data-testid="task-input"]')

  // Should still be in light mode
  await expect(page.locator('[data-testid="app"]')).toHaveAttribute('data-theme', 'light')
})

// ─── Edge Case Tests ───────────────────────────────────────────────────────────

test('edge case: submitting empty input does not add a task', async ({ page }) => {
  await freshPage(page)

  // Press Enter with empty input
  await page.press('[data-testid="task-input"]', 'Enter')
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(0)

  // Click Add button with whitespace only
  await page.fill('[data-testid="task-input"]', '   ')
  await page.click('[data-testid="add-button"]')
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(0)
})

test('edge case: delete button removes task immediately', async ({ page }) => {
  await freshPage(page)

  await addTask(page, 'To be deleted')
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(1)

  // Hover over the task to reveal delete button, then click it
  const taskItem = page.locator('[data-testid="task-item"]').first()
  await taskItem.hover()
  await page.locator('[data-testid="task-delete"]').first().click()

  // Task is gone
  await expect(page.locator('[data-testid="task-item"]')).toHaveCount(0)
  // Empty state message visible
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
})

// ─── Screenshot Tests ──────────────────────────────────────────────────────────

test('screenshot: dark mode with mixed tasks', async ({ page }) => {
  await freshPage(page)

  // Ensure dark mode
  const app = page.locator('[data-testid="app"]')
  if ((await app.getAttribute('data-theme')) !== 'dark') {
    await page.locator('[data-testid="theme-toggle"]').click()
  }

  await addTask(page, 'Design new landing page')
  await addTask(page, 'Review pull requests')
  await addTask(page, 'Write unit tests')
  await addTask(page, 'Deploy to production')

  // Complete some tasks
  await page.locator('[data-testid="task-checkbox"]').nth(1).click()
  await page.locator('[data-testid="task-checkbox"]').nth(3).click()

  await captureScreenshot(page, '1-dark-mode-mixed-tasks')
})

test('screenshot: light mode main screen', async ({ page }) => {
  await freshPage(page)

  // Switch to light mode
  const app = page.locator('[data-testid="app"]')
  if ((await app.getAttribute('data-theme')) === 'dark') {
    await page.locator('[data-testid="theme-toggle"]').click()
  }

  await addTask(page, 'Morning workout')
  await addTask(page, 'Read documentation')
  await addTask(page, 'Team standup')

  await page.locator('[data-testid="task-checkbox"]').first().click()

  await captureScreenshot(page, '2-light-mode-main')
})

test('screenshot: empty state in dark mode', async ({ page }) => {
  await freshPage(page)

  // Ensure dark mode
  const app = page.locator('[data-testid="app"]')
  if ((await app.getAttribute('data-theme')) !== 'dark') {
    await page.locator('[data-testid="theme-toggle"]').click()
  }

  await captureScreenshot(page, '3-empty-state-dark')
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
})
