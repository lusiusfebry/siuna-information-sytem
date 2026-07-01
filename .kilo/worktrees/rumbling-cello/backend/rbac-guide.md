# Role-Based Access Control (RBAC) System Guide - Backend

## Overview

The RBAC system effectively manages user access to resources based on assigned roles and granular permissions.

## Database Schema

- **Roles**: Defines the roles available (e.g., `admin`, `manager`, `employee`).
- **Permissions**: Defines specific actions on resources (e.g., `employees.create`, `master_data.read`).
- **RolePermissions**: Junction table linking Roles and Permissions.
- **Users**: Users are assigned a `role_id`.

## Core Components

### 1. Models
- `Role.ts`: Role definitions.
- `Permission.ts`: Permission definitions.
- `User.ts`: Enhanced with `roleDetails` association.

### 2. Services
- `PermissionService`: Handles permission checks (`hasPermission`) and data access logic (`canAccessEmployee`).
- `AuthService`: Authenticates users and loads their role/permissions.

### 3. Middleware
- `checkPermission(resource, action)`: Verifies if the user has the required permission.
- `checkDepartmentAccess`: Sets `req.departmentFilter` for Managers to restrict data scope.
- `checkResourceOwnership(resourceType)`: Ensures users only access their own data (Employee role) or their department's data (Manager role).

## Usage in Routes

```typescript
router.get(
    '/', 
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ), 
    checkDepartmentAccess, 
    employeeController.getAll
);

router.get(
    '/:id', 
    checkPermission(RESOURCES.EMPLOYEES, ACTIONS.READ), 
    checkResourceOwnership('employee'), 
    employeeController.getOne
);
```

## Adding New Permissions
1. Add constant in `shared/constants/permissions.ts`.
2. Add to seed file `database/seeds/rbac-seed.ts`.
3. Run seed.

