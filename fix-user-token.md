# JWT Token Role Issue Fix

## Problem
The JWT token contains outdated role information (`customer`) while the database shows the user has role `SUPPLIER`. The backend receives `currentRole: 'customer'` from the token instead of the current database role.

## Solution
The user needs to **log out and log back in** to get a fresh JWT token with the updated role information.

## Steps to Fix:
1. Click "Logout" in the top navigation
2. Log back in with your credentials
3. Try creating a listing again

## Why This Happens:
- JWT tokens contain role information at the time they were issued
- When a user's role is updated in the database, existing tokens still contain the old role
- A fresh login generates a new token with current database role information

## Alternative Fix (if logout/login doesn't work):
If the issue persists, the user's role in the database may need to be verified and updated to ensure it's properly set to `SUPPLIER`.
