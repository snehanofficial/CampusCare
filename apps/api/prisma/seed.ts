import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import { ROLE_SEED_DATA, PERMISSION_REGISTRY } from "@campuscare/constants";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting comprehensive database seed...");

  // 1. Seed Permissions
  console.log("Seeding permissions...");
  for (const perm of PERMISSION_REGISTRY) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
        groupLabel: perm.groupLabel,
      },
      create: {
        code: perm.code,
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
        groupLabel: perm.groupLabel,
      },
    });
  }
  console.log(`✓ Seeded ${PERMISSION_REGISTRY.length} permissions.`);

  // 2. Seed Roles and Role-Permission Joins
  console.log("Seeding roles and mapping permissions...");
  for (const roleData of ROLE_SEED_DATA) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
      },
    });

    // Resolve permission IDs for this role
    const permissions = await prisma.permission.findMany({
      where: {
        code: { in: roleData.permissions },
      },
    });

    // Delete existing mappings
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Insert new mappings
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });

    console.log(`  ✓ Role "${role.name}" map: ${permissions.length} permissions.`);
  }

  // 3. Seed Departments
  console.log("Seeding departments...");
  const departments = [
    { code: "IT", name: "IT Support Department", description: "Campus Central IT and Systems Support" },
    { code: "FAC", name: "Facilities Management", description: "Campus buildings, infrastructure, and physical maintenance" },
    { code: "ACAD", name: "Academic Affairs", description: "Academic technology support, faculty assistance" },
    { code: "STUD", name: "Student Services", description: "Student housing, affairs, and registrar services" },
    { code: "ADMIN", name: "Central Administration", description: "Finance, Human Resources, and executive offices" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        description: dept.description,
      },
      create: {
        code: dept.code,
        name: dept.name,
        description: dept.description,
      },
    });
  }
  console.log(`✓ Seeded ${departments.length} departments.`);

  // 4. Seed Categories
  console.log("Seeding categories...");
  const categories = [
    { name: "Software & Access", description: "Software installation, login issues, license requests", icon: "Monitor", color: "#3B82F6", sortOrder: 1 },
    { name: "Hardware & Devices", description: "Desktop, laptop, printer issues, physical setups", icon: "Laptop", color: "#10B981", sortOrder: 2 },
    { name: "Network & Connectivity", description: "Wi-Fi, Ethernet, VPN, internet access issues", icon: "Wifi", color: "#F59E0B", sortOrder: 3 },
    { name: "Classroom Technology", description: "Projectors, smartboards, audio visual equipment", icon: "Tv", color: "#8B5CF6", sortOrder: 4 },
    { name: "Accounts & ID Cards", description: "Password resets, card replacement, email setups", icon: "UserCheck", color: "#EC4899", sortOrder: 5 },
    { name: "Facilities & Maintenance", description: "Lights, air conditioning, keys, physical damage", icon: "Wrench", color: "#64748B", sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
      create: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log(`✓ Seeded ${categories.length} categories.`);

  // 5. Seed SLA Policies
  console.log("Seeding SLA Policies...");
  const slaPolicies = [
    { priority: "LOW", displayName: "Low Priority", responseTimeLimit: 1440, resolveTimeLimit: 4320, color: "#64748B" },
    { priority: "MEDIUM", displayName: "Medium Priority", responseTimeLimit: 480, resolveTimeLimit: 1440, color: "#3B82F6" },
    { priority: "HIGH", displayName: "High Priority", responseTimeLimit: 120, resolveTimeLimit: 480, color: "#F59E0B" },
    { priority: "CRITICAL", displayName: "Critical Priority", responseTimeLimit: 15, resolveTimeLimit: 120, color: "#EF4444" },
  ];

  for (const sla of slaPolicies) {
    await prisma.slaPolicy.upsert({
      where: { priority: sla.priority },
      update: {
        displayName: sla.displayName,
        responseTimeLimit: sla.responseTimeLimit,
        resolveTimeLimit: sla.resolveTimeLimit,
        color: sla.color,
      },
      create: {
        priority: sla.priority,
        displayName: sla.displayName,
        responseTimeLimit: sla.responseTimeLimit,
        resolveTimeLimit: sla.resolveTimeLimit,
        color: sla.color,
      },
    });
  }
  console.log(`✓ Seeded ${slaPolicies.length} SLA Policies.`);

  // 6. Seed Services
  console.log("Seeding Campus Services...");
  const services = [
    { name: "Campus Wi-Fi", category: "Infrastructure", status: "OPERATIONAL", description: "Campus-wide wireless connectivity", icon: "Wifi" },
    { name: "Active Directory Identity Service", category: "Infrastructure", status: "OPERATIONAL", description: "Authentication and single sign-on", icon: "Shield" },
    { name: "LMS Canvas", category: "Applications", status: "OPERATIONAL", description: "Learning Management System portal", icon: "BookOpen" },
    { name: "Student Info System SIS", category: "Applications", status: "OPERATIONAL", description: "Grades, registry, and courses portal", icon: "GraduationCap" },
    { name: "Campus Email System", category: "Applications", status: "OPERATIONAL", description: "Microsoft 365 / Gmail exchange server", icon: "Mail" },
    { name: "Library Workstations", category: "Infrastructure", status: "OPERATIONAL", description: "Public computers and printing services", icon: "Monitor" },
  ];

  for (const srv of services) {
    const service = await prisma.service.upsert({
      where: { name: srv.name },
      update: {
        category: srv.category,
        status: srv.status,
        description: srv.description,
        icon: srv.icon,
      },
      create: {
        name: srv.name,
        category: srv.category,
        status: srv.status,
        description: srv.description,
        icon: srv.icon,
      },
    });

    // Create an initial status history log if it doesn't exist
    const historyCount = await prisma.serviceStatusHistory.count({
      where: { serviceId: service.id },
    });
    if (historyCount === 0) {
      await prisma.serviceStatusHistory.create({
        data: {
          serviceId: service.id,
          previousStatus: "OPERATIONAL",
          newStatus: "OPERATIONAL",
          reason: "Initial system registration during seeding",
          changedBy: "SYSTEM",
        },
      });
    }
  }
  console.log(`✓ Seeded ${services.length} Campus Services and histories.`);

  // 7. Seed Default System Admin User
  console.log("Seeding Default System Admin User...");
  const adminRole = await prisma.role.findUnique({ where: { name: "SYSTEM_ADMIN" } });
  const itDept = await prisma.department.findUnique({ where: { code: "IT" } });

  if (adminRole && itDept) {
    const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 12);
    await prisma.user.upsert({
      where: { email: "admin@campuscare.edu" },
      update: {
        firstName: "System",
        lastName: "Administrator",
        passwordHash: adminPasswordHash,
        roleId: adminRole.id,
        departmentId: itDept.id,
        isActive: true,
      },
      create: {
        email: "admin@campuscare.edu",
        firstName: "System",
        lastName: "Administrator",
        passwordHash: adminPasswordHash,
        roleId: adminRole.id,
        departmentId: itDept.id,
        isActive: true,
      },
    });
    console.log("✓ Created system admin: admin@campuscare.edu / AdminPassword123!");
  } else {
    console.warn("⚠️ SYSTEM_ADMIN role or IT department missing. Admin user could not be seeded.");
  }

  // 8. Seed Default Student User
  const studentRole = await prisma.role.findUnique({ where: { name: "STUDENT" } });
  const studDept = await prisma.department.findUnique({ where: { code: "STUD" } });
  if (studentRole && studDept) {
    const studentPasswordHash = await bcrypt.hash("StudentPassword123!", 12);
    await prisma.user.upsert({
      where: { email: "student@campuscare.edu" },
      update: {
        firstName: "Jane",
        lastName: "Doe",
        passwordHash: studentPasswordHash,
        roleId: studentRole.id,
        departmentId: studDept.id,
        isActive: true,
      },
      create: {
        email: "student@campuscare.edu",
        firstName: "Jane",
        lastName: "Doe",
        passwordHash: studentPasswordHash,
        roleId: studentRole.id,
        departmentId: studDept.id,
        isActive: true,
      },
    });
    console.log("✓ Created student user: student@campuscare.edu / StudentPassword123!");
  }

  // 9. Seed Default Technician User
  const techRole = await prisma.role.findUnique({ where: { name: "TECHNICIAN" } });
  if (techRole && itDept) {
    const techPasswordHash = await bcrypt.hash("TechPassword123!", 12);
    await prisma.user.upsert({
      where: { email: "tech@campuscare.edu" },
      update: {
        firstName: "John",
        lastName: "Tech",
        passwordHash: techPasswordHash,
        roleId: techRole.id,
        departmentId: itDept.id,
        isActive: true,
      },
      create: {
        email: "tech@campuscare.edu",
        firstName: "John",
        lastName: "Tech",
        passwordHash: techPasswordHash,
        roleId: techRole.id,
        departmentId: itDept.id,
        isActive: true,
      },
    });
    console.log("✓ Created technician user: tech@campuscare.edu / TechPassword123!");
  }

  // 10. Seed GTPE (Granular Temporary Privilege Escalation) permissions
  // Additive: these are upserted after the role mappings above so the existing
  // ROLE_SEED_DATA-driven sync is untouched.
  console.log("Seeding GTPE privilege permissions...");
  const gtpePermissions = [
    {
      code: "privileges:request",
      displayName: "Request Temporary Access",
      description: "Submit a request for time-boxed elevated permissions",
      category: "Privileges",
      groupLabel: "Access Governance",
    },
    {
      code: "privileges:approve",
      displayName: "Approve Temporary Access",
      description: "Review, approve or reject temporary access requests",
      category: "Privileges",
      groupLabel: "Access Governance",
    },
    {
      code: "privileges:grant",
      displayName: "Grant Temporary Access",
      description: "Directly grant and revoke time-boxed permissions",
      category: "Privileges",
      groupLabel: "Access Governance",
    },
    {
      code: "privileges:manage",
      displayName: "Manage Privilege Policies",
      description: "Manage permission templates and approval policies",
      category: "Privileges",
      groupLabel: "Access Governance",
    },
  ];

  for (const perm of gtpePermissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
        groupLabel: perm.groupLabel,
      },
      create: perm,
    });
  }

  // Map GTPE permissions onto roles (additive; existing mappings preserved).
  const gtpeRoleMap: Record<string, string[]> = {
    SYSTEM_ADMIN: ["privileges:request", "privileges:approve", "privileges:grant", "privileges:manage"],
    DEPT_ADMIN: ["privileges:request", "privileges:approve", "privileges:grant"],
    TECHNICIAN: ["privileges:request"],
    FACULTY: ["privileges:request"],
    STUDENT: ["privileges:request"],
  };

  for (const [roleName, codes] of Object.entries(gtpeRoleMap)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    const perms = await prisma.permission.findMany({ where: { code: { in: codes } } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  console.log(`✓ Seeded ${gtpePermissions.length} GTPE permissions and role mappings.`);

  // 11. Seed default approval policies (one per permission category)
  console.log("Seeding GTPE approval policies...");
  const approvalPolicies = [
    { permissionCategory: "Tickets", approvalLevel: "LOW", approverRole: "DEPT_ADMIN", maxDurationMinutes: 480 },
    { permissionCategory: "Assets", approvalLevel: "MEDIUM", approverRole: "DEPT_ADMIN", maxDurationMinutes: 240 },
    { permissionCategory: "Inventory", approvalLevel: "MEDIUM", approverRole: "DEPT_ADMIN", maxDurationMinutes: 240 },
    { permissionCategory: "Users", approvalLevel: "HIGH", approverRole: "SYSTEM_ADMIN", maxDurationMinutes: 120 },
    { permissionCategory: "Roles", approvalLevel: "CRITICAL", approverRole: "SYSTEM_ADMIN", maxDurationMinutes: 60 },
    { permissionCategory: "Privileges", approvalLevel: "CRITICAL", approverRole: "SYSTEM_ADMIN", maxDurationMinutes: 60 },
    { permissionCategory: "Settings", approvalLevel: "CRITICAL", approverRole: "SYSTEM_ADMIN", maxDurationMinutes: 60 },
    { permissionCategory: "Reports", approvalLevel: "LOW", approverRole: "DEPT_ADMIN", maxDurationMinutes: 480 },
    { permissionCategory: "Analytics", approvalLevel: "LOW", approverRole: "DEPT_ADMIN", maxDurationMinutes: 480 },
  ];

  for (const policy of approvalPolicies) {
    await prisma.approvalPolicy.upsert({
      where: { permissionCategory: policy.permissionCategory },
      update: {
        approvalLevel: policy.approvalLevel,
        approverRole: policy.approverRole,
        maxDurationMinutes: policy.maxDurationMinutes,
      },
      create: { ...policy, autoApprove: false, isActive: true },
    });
  }
  console.log(`✓ Seeded ${approvalPolicies.length} approval policies.`);

  // 12. Seed example permission templates
  console.log("Seeding GTPE permission templates...");
  const templates = [
    {
      name: "Emergency Ticket Escalation",
      description: "Full ticket queue control for handling a live incident",
      defaultDurationMinutes: 120,
      permissionCodes: ["tickets:read_all", "tickets:update_all", "tickets:assign"],
    },
    {
      name: "Temporary Asset Auditor",
      description: "Read-only access to the asset and inventory registers for an audit window",
      defaultDurationMinutes: 480,
      permissionCodes: ["assets:read", "inventory:read", "reports:read"],
    },
  ];

  for (const template of templates) {
    const perms = await prisma.permission.findMany({
      where: { code: { in: template.permissionCodes } },
    });
    if (perms.length === 0) {
      console.warn(`  ⚠️ Template "${template.name}" skipped: no matching permissions found.`);
      continue;
    }
    const created = await prisma.permissionTemplate.upsert({
      where: { name: template.name },
      update: {
        description: template.description,
        defaultDurationMinutes: template.defaultDurationMinutes,
        isActive: true,
      },
      create: {
        name: template.name,
        description: template.description,
        defaultDurationMinutes: template.defaultDurationMinutes,
        isActive: true,
      },
    });
    await prisma.permissionTemplateItem.createMany({
      data: perms.map((p) => ({ templateId: created.id, permissionId: p.id })),
      skipDuplicates: true,
    });
    console.log(`  ✓ Template "${created.name}": ${perms.length} permissions.`);
  }

  console.log("🌱 Database seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
