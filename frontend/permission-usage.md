# Permission System Usage - Frontend

## Overview

The frontend RBAC system utilizes a Zustand store (`authStore`) to manage user permissions and provided hooks/components for access control.

## Types
Defined in `src/types/permission.ts`:
- `Role`: { name, permissions[] }
- `Permission`: { resource, action }

## Hooks

### `usePermission()`
Provides helper functions to check access.

```typescript
const { can, is } = usePermission();

if (can(RESOURCES.EMPLOYEES, ACTIONS.CREATE)) {
    // Show create button
}

if (is('admin')) {
    // Admin specific logic
}
```

## Components

### `<PermissionGuard>`
Conditionally renders children based on permission.

```tsx
<PermissionGuard resource={RESOURCES.EMPLOYEES} action={ACTIONS.DELETE}>
    <DeleteButton />
</PermissionGuard>
```

### `<RoleGuard>`
Conditionally renders children based on role name (use sparingly, prefer permissions).

```tsx
<RoleGuard roles={['admin', 'manager']}>
    <AdminPanel />
</RoleGuard>
```

## Route Protection
Routes are protected in `App.tsx` using `PermissionGuard` with `redirectTo="/403"`.

## Store Integration
`useAuthStore` loads `user.roleDetails` upon login. `hasPermission` selector logic checks against loaded permissions.
