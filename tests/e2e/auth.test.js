const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Navigate to signup page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL('/signup');

    // Fill registration form
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="confirmPassword"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or verification page
    await expect(page).toHaveURL(/\/(dashboard|verify)/);
  });

  test('should login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    await expect(page).toHaveURL('/login');

    // Fill login form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should see user name in header
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Login');
    
    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should see login/signup buttons again
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/signup');
    
    // Test weak password
    await page.fill('[name="password"]', '123');
    await page.blur('[name="password"]');
    
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    
    // Test password mismatch
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPassword');
    await page.blur('[name="confirmPassword"]');
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should handle Google OAuth flow', async ({ page }) => {
    await page.goto('/login');
    
    // Mock Google OAuth response
    await page.route('**/auth/google', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token',
          user: { id: 1, email: 'test@gmail.com', firstName: 'John' }
        })
      });
    });

    await page.click('text=Continue with Google');
    
    // Should redirect to dashboard after OAuth
    await expect(page).toHaveURL('/dashboard');
  });
});
