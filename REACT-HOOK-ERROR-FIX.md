
# Fixing "Invalid Hook Call" Error in GenX Panel

This document provides a comprehensive guide to fixing the common "Invalid Hook Call" error that occurs in the GenX Panel application.

## The Problem

The error message "Cannot read properties of null (reading 'useState')" typically occurs when:

1. There are multiple instances of React in the application
2. React hooks are being used outside of React components
3. There's a mismatch between the React versions used in different parts of the application

## Quick Fix Instructions

Run the provided script to automatically attempt to fix the React dependency issues:

```bash
node scripts/fix-react-deps.js
```

This script will:
1. Check for multiple React instances
2. Run `npm dedupe` to deduplicate dependencies
3. Update package.json to ensure consistent React versions
4. Install dependencies with the correct configuration

## Manual Fix Steps

If the script doesn't work, follow these steps manually:

### 1. Fix Duplicate React Instances

```bash
npm dedupe
npm ls react
```

### 2. Ensure Components Are Used Correctly

1. Make sure `AuthProvider` is always inside `BrowserRouter`
2. Verify all hooks follow React's rules of hooks
3. Check that components using `useNavigate` are always within the Router context

### 3. Check Component Order

The correct wrapping order for providers should be:

```jsx
<QueryClientProvider>
  <BrowserRouter>
    <AuthProvider>
      <Other providers...>
        <App />
      </Other providers...>
    </AuthProvider>
  </BrowserRouter>
</QueryClientProvider>
```

### 4. Check for Circular Dependencies

Look for any circular imports in your files, especially between context providers.

## Changes Made in This Fix

1. Updated `AuthContext.tsx` to ensure correct hook usage and proper TypeScript typing
2. Modified `App.tsx` to ensure proper provider nesting order
3. Updated `main.tsx` to correctly render the app
4. Fixed `ProtectedRoute` and `RoleProtectedRoute` components
5. Updated `AthleteCard` component to use proper navigation
6. Fixed merge conflicts in ranking components

## Additional Resources

If you're still experiencing issues:

1. [React Hooks Rules](https://reactjs.org/docs/hooks-rules.html)
2. [React Router documentation](https://reactrouter.com/en/main)
3. [Dealing with dependencies in React](https://reactjs.org/blog/2020/02/14/how-does-setstate-know-what-to-do.html)

## Prevention Tips

1. Always make sure the `BrowserRouter` wraps any component using navigation hooks
2. Use consistent versions of React across your application
3. When updating dependencies, check for potential version conflicts
4. Use error boundaries to catch and display errors gracefully
