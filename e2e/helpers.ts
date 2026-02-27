import { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'screenshots')

export async function captureScreenshot(page: Page, name: string): Promise<void> {
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    }
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${name}.png`),
      fullPage: true,
    })
  } catch (err) {
    console.error(`Failed to capture screenshot "${name}":`, err)
  }
}

export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  if (errors.length > 0) {
    throw new Error(`Console errors detected:\n${errors.join('\n')}`)
  }
}
