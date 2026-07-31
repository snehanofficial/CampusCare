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

  // 6. Seed Service Statuses
  console.log("Seeding Service Statuses...");
  const serviceStatuses = [
    { name: "Campus Wi-Fi", category: "Infrastructure", status: "OPERATIONAL", description: "Campus-wide wireless connectivity", sortOrder: 1 },
    { name: "Active Directory Identity Service", category: "Infrastructure", status: "OPERATIONAL", description: "Authentication and single sign-on", sortOrder: 2 },
    { name: "LMS Canvas", category: "Applications", status: "OPERATIONAL", description: "Learning Management System portal", sortOrder: 3 },
    { name: "Student Info System SIS", category: "Applications", status: "OPERATIONAL", description: "Grades, registry, and courses portal", sortOrder: 4 },
    { name: "Campus Email System", category: "Applications", status: "OPERATIONAL", description: "Microsoft 365 / Gmail exchange server", sortOrder: 5 },
    { name: "Library Workstations", category: "Infrastructure", status: "OPERATIONAL", description: "Public computers and printing services", sortOrder: 6 },
  ];

  for (const service of serviceStatuses) {
    await prisma.serviceStatus.upsert({
      where: { name: service.name },
      update: {
        category: service.category,
        status: service.status,
        description: service.description,
        sortOrder: service.sortOrder,
      },
      create: {
        name: service.name,
        category: service.category,
        status: service.status,
        description: service.description,
        sortOrder: service.sortOrder,
      },
    });
  }
  console.log(`✓ Seeded ${serviceStatuses.length} Service Statuses.`);

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
