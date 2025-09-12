const { test, expect } = require('@playwright/test');

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@afroasiaconnect.com');
    await page.fill('[name="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should see admin dashboard
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Should see key metrics
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-services"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-bookings"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.click('text=Users');
    
    // Should see users list
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    
    // Test user search
    await page.fill('[data-testid="user-search"]', 'john');
    await expect(page.locator('text=John')).toBeVisible();
    
    // Test user actions
    await page.click('[data-testid="user-actions"]:first-child');
    await page.click('text=Deactivate');
    
    await expect(page.locator('text=User deactivated successfully')).toBeVisible();
  });

  test('should handle verification requests', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.click('text=Verification');
    
    // Should see verification requests
    await expect(page.locator('[data-testid="verification-requests"]')).toBeVisible();
    
    // Approve a verification request
    await page.click('[data-testid="approve-verification"]:first-child');
    
    await expect(page.locator('text=Verification approved')).toBeVisible();
    
    // Reject a verification request
    await page.click('[data-testid="reject-verification"]:first-child');
    await page.fill('[data-testid="rejection-reason"]', 'Insufficient documentation');
    await page.click('text=Confirm Rejection');
    
    await expect(page.locator('text=Verification rejected')).toBeVisible();
  });

  test('should view analytics', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.click('text=Analytics');
    
    // Should see analytics charts
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-trends-chart"]')).toBeVisible();
    
    // Test date range filter
    await page.click('[data-testid="date-range-picker"]');
    await page.click('text=Last 30 Days');
    
    // Charts should update
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });

  test('should export data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Test users export
    await page.click('text=Users');
    await page.click('[data-testid="export-users"]');
    
    // Should trigger download
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export CSV');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('users');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should manage system settings', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.click('text=Settings');
    
    // Should see system settings
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
    
    // Update a setting
    await page.fill('[name="platformFee"]', '5.5');
    await page.click('text=Save Settings');
    
    await expect(page.locator('text=Settings updated successfully')).toBeVisible();
  });

  test('should restrict non-admin access', async ({ page }) => {
    // Logout admin
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // Login as regular user
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Try to access admin panel
    await page.goto('/admin/dashboard');
    
    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('should handle bulk user operations', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.click('text=Users');
    
    // Select multiple users
    await page.check('[data-testid="user-checkbox"]:nth-child(1)');
    await page.check('[data-testid="user-checkbox"]:nth-child(2)');
    
    // Bulk action
    await page.click('[data-testid="bulk-actions"]');
    await page.click('text=Send Notification');
    
    await page.fill('[data-testid="notification-message"]', 'Important platform update');
    await page.click('text=Send');
    
    await expect(page.locator('text=Notifications sent successfully')).toBeVisible();
  });
});
