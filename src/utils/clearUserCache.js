// Utility to clear cached user data and force fresh authentication
// Run this in browser console to clear stale user role data

function clearUserCache() {
  console.log('🔧 Clearing cached user data...');
  
  // Clear localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // Clear cookies
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  
  console.log('✅ User cache cleared. Please refresh the page and log in again.');
  
  // Optionally reload the page
  window.location.reload();
}

// Auto-execute if running in browser
if (typeof window !== 'undefined') {
  clearUserCache();
}
