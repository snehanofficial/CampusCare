export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface UserPermissionOverride {
  id: string;
  userId: string;
  permissionId: string;
  isGranted: boolean;
  expiresAt?: Date;
}
