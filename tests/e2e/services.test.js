const { test, expect } = require('@playwright/test');

test.describe('Services Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as service provider
    await page.goto('/login');
    await page.fill('[name="email"]', 'provider@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new service', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.click('text=Add New Service');

    // Fill service form
    await page.fill('[name="serviceName"]', 'Web Development Consultation');
    await page.selectOption('[name="serviceCategory"]', 'Technology');
    await page.fill('[name="description"]', 'Professional web development consultation service');
    await page.fill('[name="price"]', '150');
    await page.fill('[name="duration"]', '60');

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Service created successfully')).toBeVisible();
    
    // Should redirect to services list
    await expect(page).toHaveURL('/dashboard/services');
    
    // Should see new service in list
    await expect(page.locator('text=Web Development Consultation')).toBeVisible();
  });

  test('should edit existing service', async ({ page }) => {
    await page.goto('/dashboard/services');
    
    // Click edit on first service
    await page.click('[data-testid="edit-service"]:first-child');
    
    // Update service details
    await page.fill('[name="price"]', '200');
    await page.fill('[name="description"]', 'Updated description for the service');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Service updated successfully')).toBeVisible();
  });

  test('should browse services as customer', async ({ page }) => {
    // Logout and login as customer
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    await page.goto('/login');
    await page.fill('[name="email"]', 'customer@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Navigate to services
    await page.goto('/services');
    
    // Should see services list
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount.greaterThan(0);
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'web development');
    await expect(page.locator('text=Web Development')).toBeVisible();
    
    // Test category filter
    await page.click('text=Technology');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount.greaterThan(0);
  });

  test('should view service details', async ({ page }) => {
    await page.goto('/services');
    
    // Click on first service
    await page.click('[data-testid="service-card"]:first-child');
    
    // Should navigate to service detail page
    await expect(page).toHaveURL(/\/services\/\d+/);
    
    // Should see service information
    await expect(page.locator('[data-testid="service-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-description"]')).toBeVisible();
    
    // Should see book button
    await expect(page.locator('text=Book Now')).toBeVisible();
  });

  test('should handle service booking flow', async ({ page }) => {
    await page.goto('/services');
    await page.click('[data-testid="service-card"]:first-child');
    
    // Start booking process
    await page.click('text=Book Now');
    
    // Should navigate to booking page
    await expect(page).toHaveURL(/\/services\/\d+\/book/);
    
    // Step 1: Select date and time
    await page.click('[data-testid="date-picker"]');
    await page.click('text=Tomorrow'); // Select tomorrow's date
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('text=Next');
    
    // Step 2: Fill customer details
    await page.fill('[name="customerName"]', 'John Customer');
    await page.fill('[name="customerEmail"]', 'customer@example.com');
    await page.fill('[name="customerPhone"]', '+1234567890');
    await page.click('text=Next');
    
    // Step 3: Review and confirm
    await expect(page.locator('text=Review & Confirm')).toBeVisible();
    await page.click('text=Confirm Booking');
    
    // Should show success confirmation
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });

  test('should validate service form inputs', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.click('text=Add New Service');

    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Service name is required')).toBeVisible();
    await expect(page.locator('text=Category is required')).toBeVisible();
    await expect(page.locator('text=Price is required')).toBeVisible();
    
    // Test invalid price
    await page.fill('[name="price"]', '-50');
    await page.blur('[name="price"]');
    await expect(page.locator('text=Price must be positive')).toBeVisible();
  });

  test('should handle service availability', async ({ page }) => {
    await page.goto('/services/1/book');
    
    // Select a date
    await page.click('[data-testid="date-picker"]');
    await page.click('text=Tomorrow');
    
    // Should load available time slots
    await expect(page.locator('[data-testid="time-slot"]')).toHaveCount.greaterThan(0);
    
    // Mock unavailable slots
    await page.route('**/bookings/availability/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          availableSlots: ['09:00', '14:00', '16:00']
        })
      });
    });
    
    await page.reload();
    await page.click('[data-testid="date-picker"]');
    await page.click('text=Tomorrow');
    
    // Should only show available slots
    await expect(page.locator('[data-testid="time-slot"]')).toHaveCount(3);
  });
});
