const { test, expect } = require('@playwright/test');

test.describe('Payment System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('[name="email"]', 'customer@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should process successful payment', async ({ page }) => {
    // Navigate to a service and book it
    await page.goto('/services/1/book');
    
    // Complete booking steps
    await page.click('[data-testid="date-picker"]');
    await page.click('text=Tomorrow');
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('text=Next');
    
    await page.fill('[name="customerName"]', 'John Customer');
    await page.fill('[name="customerEmail"]', 'customer@example.com');
    await page.click('text=Next');
    
    await page.click('text=Confirm Booking');
    
    // Should redirect to payment page
    await expect(page).toHaveURL(/\/payment/);
    
    // Mock Stripe Elements
    await page.addInitScript(() => {
      window.Stripe = () => ({
        elements: () => ({
          create: () => ({
            mount: () => {},
            on: () => {},
            destroy: () => {}
          })
        }),
        confirmCardPayment: () => Promise.resolve({
          paymentIntent: { status: 'succeeded' }
        })
      });
    });
    
    // Fill payment form
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    await page.click('text=Pay Now');
    
    // Should show success message
    await expect(page.locator('text=Payment Successful')).toBeVisible();
  });

  test('should handle payment failure', async ({ page }) => {
    await page.goto('/services/1/book');
    
    // Complete booking flow to payment
    await page.click('[data-testid="date-picker"]');
    await page.click('text=Tomorrow');
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('text=Next');
    
    await page.fill('[name="customerName"]', 'John Customer');
    await page.fill('[name="customerEmail"]', 'customer@example.com');
    await page.click('text=Next');
    await page.click('text=Confirm Booking');
    
    // Mock failed payment
    await page.addInitScript(() => {
      window.Stripe = () => ({
        elements: () => ({
          create: () => ({
            mount: () => {},
            on: () => {},
            destroy: () => {}
          })
        }),
        confirmCardPayment: () => Promise.resolve({
          error: { message: 'Your card was declined.' }
        })
      });
    });
    
    await page.fill('[data-testid="card-number"]', '4000000000000002');
    await page.click('text=Pay Now');
    
    await expect(page.locator('text=Your card was declined')).toBeVisible();
  });

  test('should view payment history', async ({ page }) => {
    await page.goto('/dashboard/payments');
    
    // Should see payment dashboard
    await expect(page.locator('text=Payment History')).toBeVisible();
    
    // Should see payment cards
    await expect(page.locator('[data-testid="payment-card"]')).toHaveCount.greaterThan(0);
    
    // Test payment filter
    await page.selectOption('[data-testid="status-filter"]', 'completed');
    await expect(page.locator('text=Completed')).toBeVisible();
  });

  test('should request refund', async ({ page }) => {
    await page.goto('/dashboard/payments');
    
    // Click refund on first payment
    await page.click('[data-testid="request-refund"]:first-child');
    
    await page.fill('[data-testid="refund-reason"]', 'Service was cancelled');
    await page.click('text=Submit Refund Request');
    
    await expect(page.locator('text=Refund request submitted')).toBeVisible();
  });

  test('should export payment data', async ({ page }) => {
    await page.goto('/dashboard/payments');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-payments"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('payments');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should validate payment form', async ({ page }) => {
    await page.goto('/services/1/book');
    
    // Navigate to payment
    await page.click('[data-testid="date-picker"]');
    await page.click('text=Tomorrow');
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('text=Next');
    
    await page.fill('[name="customerName"]', 'John Customer');
    await page.fill('[name="customerEmail"]', 'customer@example.com');
    await page.click('text=Next');
    await page.click('text=Confirm Booking');
    
    // Try to submit without card details
    await page.click('text=Pay Now');
    
    await expect(page.locator('text=Please complete your card details')).toBeVisible();
  });

  test('should handle subscription payments', async ({ page }) => {
    await page.goto('/dashboard/subscription');
    
    // Upgrade to premium
    await page.click('text=Upgrade to Premium');
    
    await expect(page.locator('text=Premium Subscription')).toBeVisible();
    
    // Fill payment details
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    await page.click('text=Subscribe');
    
    await expect(page.locator('text=Subscription activated')).toBeVisible();
  });
});
