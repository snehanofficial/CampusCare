import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  DEPT_ADMIN: "DEPT_ADMIN",
  TECHNICIAN: "TECHNICIAN",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT"
} as const;

const PERMISSIONS = [
  // Ticket permissions
  { name: "tickets:create", description: "Create a support ticket" },
  { name: "tickets:read_own", description: "Read own tickets" },
  { name: "tickets:read_all", description: "Read all tickets" },
  { name: "tickets:update_own", description: "Update own tickets" },
  { name: "tickets:update_all", description: "Update all tickets" },
  { name: "tickets:delete", description: "Delete tickets" },
  { name: "tickets:assign", description: "Assign tickets to technicians" },
  { name: "tickets:resolve", description: "Mark tickets as resolved" },

  // Asset permissions
  { name: "assets:create", description: "Create assets" },
  { name: "assets:read", description: "Read assets" },
  { name: "assets:update", description: "Update assets" },
  { name: "assets:delete", description: "Delete assets" },

  // Inventory permissions
  { name: "inventory:read", description: "Read inventory items" },
  { name: "inventory:update", description: "Update inventory levels" },

  // User management
  { name: "users:read", description: "Read user accounts" },
  { name: "users:update", description: "Update user accounts" },

  // Audit logs
  { name: "audit:read", description: "Read system audit logs" }
];

async function main() {
  console.log("Seeding started...");

  // 1. Create Permissions
  console.log("Seeding permissions...");
  const dbPermissions = [];
  for (const perm of PERMISSIONS) {
    const dbPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: { name: perm.name, description: perm.description }
    });
    dbPermissions.push(dbPerm);
  }

  // Helper map for permissions name -> id
  const permMap = new Map(dbPermissions.map(p => [p.name, p.id]));

  // 2. Create Roles
  console.log("Seeding roles...");
  const roleInstances: Record<string, any> = {};
  const rolesInfo = [
    { name: ROLES.SYSTEM_ADMIN, description: "System Administrator with full access" },
    { name: ROLES.DEPT_ADMIN, description: "Department Administrator" },
    { name: ROLES.TECHNICIAN, description: "Support Technician" },
    { name: ROLES.FACULTY, description: "Faculty Member" },
    { name: ROLES.STUDENT, description: "Student Requestor" }
  ];

  for (const r of rolesInfo) {
    const dbRole = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description }
    });
    roleInstances[r.name] = dbRole;
  }

  // 3. Map Permissions to Roles
  console.log("Mapping permissions to roles...");
  const rolePermissionsMap: Record<string, string[]> = {
    [ROLES.SYSTEM_ADMIN]: PERMISSIONS.map(p => p.name),
    [ROLES.DEPT_ADMIN]: [
      "tickets:create", "tickets:read_all", "tickets:update_all", "tickets:delete", "tickets:assign", "tickets:resolve",
      "assets:create", "assets:read", "assets:update", "assets:delete",
      "inventory:read", "inventory:update",
      "users:read", "users:update",
      "audit:read"
    ],
    [ROLES.TECHNICIAN]: [
      "tickets:read_all", "tickets:update_all", "tickets:assign", "tickets:resolve",
      "assets:read", "assets:update",
      "inventory:read"
    ],
    [ROLES.FACULTY]: [
      "tickets:create", "tickets:read_own", "tickets:update_own",
      "assets:read"
    ],
    [ROLES.STUDENT]: [
      "tickets:create", "tickets:read_own", "tickets:update_own"
    ]
  };

  for (const roleName of Object.keys(rolePermissionsMap)) {
    const roleId = roleInstances[roleName].id;
    const permissionsToAssign = rolePermissionsMap[roleName];

    for (const permName of permissionsToAssign) {
      const permissionId = permMap.get(permName);
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId }
          },
          update: {},
          create: { roleId, permissionId }
        });
      }
    }
  }

  // 4. Create Departments
  console.log("Seeding departments...");
  const departments = [
    { name: "IT Support", description: "Information Technology & Systems Support" },
    { name: "Facilities", description: "Campus Infrastructure & Maintenance" },
    { name: "Academic Affairs", description: "Academic & Classroom Support" }
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: { description: dept.description },
      create: { name: dept.name, description: dept.description }
    });
  }

  // 5. Create Categories
  console.log("Seeding categories...");
  const categories = [
    { name: "Software Issue", description: "Operating system, application, or website issues" },
    { name: "Hardware Repair", description: "Broken components, screens, devices" },
    { name: "Network & Wifi", description: "Connectivity, access point, router issues" },
    { name: "Access & Account", description: "Password resets, IAM issues, group access permissions" },
    { name: "Plumbing", description: "Leaks, water supply, restrooms" },
    { name: "Electrical", description: "Lights, power outlets, wiring" },
    { name: "Heating & AC", description: "Climate control, HVAC unit servicing" }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { name: cat.name, description: cat.description }
    });
  }

  // 6. Create default admin user
  console.log("Seeding default admin...");
  const adminRoleId = roleInstances[ROLES.SYSTEM_ADMIN].id;
  const passwordHash = await bcrypt.hash("AdminPassword123!", 10);
  
  await prisma.user.upsert({
    where: { email: "admin@campuscare.edu" },
    update: {
      passwordHash,
      roleId: adminRoleId,
      isActive: true
    },
    create: {
      email: "admin@campuscare.edu",
      passwordHash,
      firstName: "CampusCare",
      lastName: "Admin",
      roleId: adminRoleId,
      isActive: true
    }
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
