import { expect, test } from '@playwright/test'

const publicRoutes = [
  { path: '/', name: 'landing' },
  { path: '/explore', name: 'explore' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/forgot-password', name: 'forgot password' },
  { path: '/docs', name: 'docs' },
  { path: '/pricing', name: 'pricing' },
  { path: '/privacy', name: 'privacy' },
]

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await test.step('install console error guard', async () => {
    test.info().attachments.push({
      name: 'console-error-guard',
      contentType: 'text/plain',
      body: Buffer.from('Fails on uncaught page errors and browser console errors.'),
    })
  })

  test.info().annotations.push({ type: 'consoleErrors', description: String(consoleErrors.length) })
})

for (const route of publicRoutes) {
  test(`public ${route.name} route loads`, async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => consoleErrors.push(error.message))

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    expect(response?.status(), `${route.path} should not return an HTTP error`).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveTitle(/devLog/i)

    expect(consoleErrors, `console/page errors on ${route.path}`).toEqual([])
  })
}

test('protected project routes show an auth boundary when logged out', async ({ page }) => {
  await page.goto('/projects/new', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/login(?:$|[?#])/)
  await expect(page.locator('body')).toContainText(/sign in|login|email/i)
})

test('authenticated Plan smoke is opt-in until safe test credentials exist', async ({ page }) => {
  const email = process.env.DEVLOG_E2E_EMAIL
  const password = process.env.DEVLOG_E2E_PASSWORD
  const projectId = process.env.DEVLOG_E2E_PROJECT_ID

  test.skip(!email || !password || !projectId, 'Set DEVLOG_E2E_EMAIL, DEVLOG_E2E_PASSWORD, and DEVLOG_E2E_PROJECT_ID to run authenticated Plan smoke tests.')

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email!)
  await page.getByLabel(/password/i).fill(password!)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await expect(page).not.toHaveURL(/\/login(?:$|[?#])/, { timeout: 15_000 })

  await page.goto(`/projects/${projectId}`)
  await expect(page.locator('body')).toContainText(/plan|roadmap|todo/i)
})
