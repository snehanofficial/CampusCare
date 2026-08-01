import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

faker.seed(42);

function pick<T>(arr: T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}
function pickSome<T>(arr: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max: Math.min(max, arr.length) });
  return faker.helpers.arrayElements(arr, count);
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

export async function seedDemoData(prisma: PrismaClient) {
  console.log("🌱 Seeding connected demo/dummy data...");

  const departments = await prisma.department.findMany();
  const categories = await prisma.category.findMany();
  const services = await prisma.service.findMany();
  const roles = await prisma.role.findMany();
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

  // ---------------------------------------------------------------
  // 1. Extra Users (students, faculty, technicians, dept admins)
  // ---------------------------------------------------------------
  console.log("Seeding demo users...");
  const demoPasswordHash = await bcrypt.hash("Demo@1234", 12);

  const usersToCreate: { role: string; count: number }[] = [
    { role: "STUDENT", count: 18 },
    { role: "FACULTY", count: 8 },
    { role: "TECHNICIAN", count: 6 },
    { role: "DEPT_ADMIN", count: 4 },
  ];

  const createdUsers: Record<string, any[]> = {};
  for (const { role, count } of usersToCreate) {
    const roleRow = roleByName[role];
    if (!roleRow) continue;
    createdUsers[role] = [];
    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet
        .email({ firstName, lastName, provider: "campuscare.edu" })
        .toLowerCase();
      const dept = pick(departments);
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName,
          lastName,
          passwordHash: demoPasswordHash,
          roleId: roleRow.id,
          departmentId: dept.id,
          phone: faker.phone.number({ style: "national" }),
          isActive: faker.datatype.boolean({ probability: 0.92 }),
          lastLoginAt: faker.date.recent({ days: 30 }),
        },
      });
      createdUsers[role].push(user);
    }
    console.log(`  ✓ Created ${count} ${role} users.`);
  }

  const allStaff = [...createdUsers.TECHNICIAN, ...createdUsers.DEPT_ADMIN];
  const allRequesters = [...createdUsers.STUDENT, ...createdUsers.FACULTY];
  const allUsers = [...createdUsers.STUDENT, ...createdUsers.FACULTY, ...createdUsers.TECHNICIAN, ...createdUsers.DEPT_ADMIN];

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@campuscare.edu" } });
  const grantors = adminUser ? [adminUser, ...createdUsers.DEPT_ADMIN] : createdUsers.DEPT_ADMIN;

  // ---------------------------------------------------------------
  // 2. Asset Categories + Assets
  // ---------------------------------------------------------------
  console.log("Seeding asset categories & assets...");
  const assetCategoryDefs = [
    { name: "Laptops", description: "Staff and student issued laptops" },
    { name: "Desktops", description: "Lab and office desktop workstations" },
    { name: "Projectors", description: "Classroom and auditorium projectors" },
    { name: "Networking Equipment", description: "Switches, routers, access points" },
    { name: "Printers", description: "Departmental and lab printers" },
  ];
  const assetCategories = [];
  for (const c of assetCategoryDefs) {
    assetCategories.push(
      await prisma.assetCategory.upsert({
        where: { name: c.name },
        update: {},
        create: c,
      })
    );
  }

  const assetStatuses = ["OPERATIONAL", "MAINTENANCE", "DECOMMISSIONED", "BROKEN"] as const;
  const lifecycleStages = ["PROCURED", "AVAILABLE", "ASSIGNED", "IN_USE", "MAINTENANCE", "RESERVED", "RETURNED", "RETIRED", "DISPOSED"] as const;
  const healthStatuses = ["HEALTHY", "MONITOR", "WARNING", "CRITICAL", "FAILING"] as const;
  const manufacturers = ["Dell", "HP", "Lenovo", "Apple", "Cisco", "Epson", "Canon", "TP-Link"];

  const assets = [];
  const existingAssetCount = await prisma.asset.count();
  if (existingAssetCount < 5) {
    for (let i = 0; i < 60; i++) {
      const cat = pick(assetCategories);
      const dept = pick(departments);
      const status = pick([...assetStatuses]);
      const manufacturer = pick(manufacturers);
      const idx = i + 1;
      const asset = await prisma.asset.create({
        data: {
          name: `${manufacturer} ${cat.name.slice(0, -1)} ${faker.string.alphanumeric(4).toUpperCase()}`,
          assetCode: `AST-${String(idx).padStart(5, "0")}`,
          tag: `TAG-${faker.string.alphanumeric(8).toUpperCase()}`,
          qrCodeId: `QR-${faker.string.alphanumeric(10).toUpperCase()}`,
          serialNumber: faker.string.alphanumeric(12).toUpperCase(),
          model: faker.commerce.productName(),
          manufacturer,
          status,
          lifecycleStage: pick([...lifecycleStages]),
          healthStatus: pick([...healthStatuses]),
          location: `${dept.code} Building`,
          building: `${dept.code} Building`,
          floor: String(faker.number.int({ min: 1, max: 5 })),
          room: `${faker.number.int({ min: 100, max: 499 })}`,
          purchaseOrderNumber: `PO-${faker.string.numeric(6)}`,
          purchasePrice: faker.commerce.price({ min: 200, max: 3500 }),
          purchaseDate: daysAgo(faker.number.int({ min: 60, max: 900 })),
          warrantyStart: daysAgo(faker.number.int({ min: 60, max: 900 })),
          warrantyExpiry: daysFromNow(faker.number.int({ min: -100, max: 700 })),
          departmentId: dept.id,
          categoryId: cat.id,
          healthScore: faker.number.int({ min: 40, max: 100 }),
        },
      });
      assets.push(asset);

      await prisma.assetHistory.create({
        data: {
          assetId: asset.id,
          actionType: "CREATED",
          notes: `Asset registered and added to ${dept.name} inventory.`,
          performedById: (adminUser ?? pick(allStaff)).id,
        },
      });
    }
    console.log(`  ✓ Created ${assets.length} assets.`);
  } else {
    assets.push(...(await prisma.asset.findMany({ take: 60 })));
    console.log("  ↷ Assets already present, skipping creation.");
  }

  // Asset assignments
  console.log("Seeding asset assignments...");
  for (const asset of faker.helpers.arrayElements(assets, Math.min(30, assets.length))) {
    const assignee = pick(allUsers);
    await prisma.assetAssignment.create({
      data: {
        assetId: asset.id,
        assigneeType: "USER",
        userId: assignee.id,
        location: asset.location,
        assignedAt: daysAgo(faker.number.int({ min: 5, max: 300 })),
        status: pick(["ACTIVE", "RETURNED", "TRANSFERRED"]),
        assignedById: pick(allStaff).id,
        notes: "Issued as part of routine departmental allocation.",
      },
    });
  }
  console.log("  ✓ Created asset assignments.");

  // ---------------------------------------------------------------
  // 3. Procurements
  // ---------------------------------------------------------------
  console.log("Seeding procurements...");
  const procurementStatuses = ["REQUESTED", "ORDERED", "RECEIVED", "REGISTERED"] as const;
  for (let i = 0; i < 15; i++) {
    const dept = pick(departments);
    const cat = pick(assetCategories);
    await prisma.procurement.create({
      data: {
        requestNumber: `PROC-${String(i + 1).padStart(5, "0")}`,
        purchaseOrderNumber: `PO-${faker.string.numeric(6)}`,
        purchaseCost: faker.commerce.price({ min: 1000, max: 25000 }),
        vendorReference: faker.company.name(),
        status: pick([...procurementStatuses]),
        assetName: `${pick(manufacturers)} ${cat.name.slice(0, -1)}`,
        model: faker.commerce.productName(),
        manufacturer: pick(manufacturers),
        categoryId: cat.id,
        departmentId: dept.id,
        quantity: faker.number.int({ min: 1, max: 20 }),
        registeredCount: faker.number.int({ min: 0, max: 5 }),
      },
    });
  }
  console.log("  ✓ Created 15 procurements.");

  // ---------------------------------------------------------------
  // 4. Tickets, Comments, Attachments
  // ---------------------------------------------------------------
  console.log("Seeding tickets...");
  const ticketStatuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const ticketTitles = [
    "Cannot connect to campus Wi-Fi",
    "Projector not turning on in lecture hall",
    "Password reset needed for student portal",
    "Laptop screen flickering intermittently",
    "Printer out of toner in library",
    "VPN access request for remote work",
    "Email account locked after failed logins",
    "Smartboard touch not responding",
    "Software installation request: MATLAB",
    "Network drive access denied",
    "Slow internet speed in dorm building",
    "ID card reader malfunctioning at gate",
  ];

  const tickets = [];
  for (let i = 0; i < 70; i++) {
    const creator = pick(allRequesters);
    const dept = pick(departments);
    const category = pick(categories);
    const status = pick(ticketStatuses);
    const priority = pick(priorities);
    const assignee = status === "OPEN" ? null : pick(allStaff);
    const createdAt = daysAgo(faker.number.int({ min: 0, max: 120 }));
    const isClosed = status === "CLOSED" || status === "RESOLVED";
    const asset = faker.datatype.boolean({ probability: 0.4 }) ? pick(assets) : null;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `INC-${String(1000 + i)}`,
        title: pick(ticketTitles),
        description: faker.lorem.paragraph(),
        status,
        priority,
        creatorId: creator.id,
        assigneeId: assignee?.id,
        categoryId: category.id,
        departmentId: dept.id,
        assetId: asset?.id,
        createdAt,
        resolvedAt: isClosed ? faker.date.between({ from: createdAt, to: new Date() }) : null,
        closedAt: status === "CLOSED" ? faker.date.between({ from: createdAt, to: new Date() }) : null,
        dueAt: daysFromNow(faker.number.int({ min: -5, max: 10 })),
      },
    });
    tickets.push(ticket);

    // Comments
    const commentCount = faker.number.int({ min: 0, max: 4 });
    for (let c = 0; c < commentCount; c++) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: pick([creator, ...(assignee ? [assignee] : allStaff)]).id,
          content: faker.lorem.sentences(2),
          isInternal: faker.datatype.boolean({ probability: 0.3 }),
          createdAt: faker.date.between({ from: createdAt, to: new Date() }),
        },
      });
    }

    // Attachments
    if (faker.datatype.boolean({ probability: 0.25 })) {
      await prisma.ticketAttachment.create({
        data: {
          ticketId: ticket.id,
          fileName: `screenshot-${faker.string.alphanumeric(6)}.png`,
          fileUrl: `https://storage.campuscare.edu/attachments/${faker.string.uuid()}.png`,
          fileType: "image/png",
          fileSize: faker.number.int({ min: 20_000, max: 4_000_000 }),
          uploadedById: creator.id,
        },
      });
    }
  }
  console.log(`  ✓ Created ${tickets.length} tickets with comments/attachments.`);

  // ---------------------------------------------------------------
  // 5. Incidents linked to tickets & services
  // ---------------------------------------------------------------
  console.log("Seeding incidents...");
  for (let i = 0; i < 8; i++) {
    const service = pick(services);
    const status = pick(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]);
    const incident = await prisma.incident.create({
      data: {
        title: `${service.name} disruption reported`,
        description: faker.lorem.paragraph(),
        status,
        severity: pick(priorities),
        serviceId: service.id,
        resolvedAt: status === "RESOLVED" ? faker.date.recent({ days: 20 }) : null,
      },
    });
    const linkedTickets = faker.helpers.arrayElements(tickets, faker.number.int({ min: 0, max: 3 }));
    for (const t of linkedTickets) {
      await prisma.incidentTicket.createMany({
        data: [{ incidentId: incident.id, ticketId: t.id }],
        skipDuplicates: true,
      });
    }
  }
  console.log("  ✓ Created 8 incidents.");

  // ---------------------------------------------------------------
  // 6. Inventory Items, Transactions, Allocations, Reservations
  // ---------------------------------------------------------------
  console.log("Seeding inventory items...");
  const inventoryCategories = ["SPARE_PART", "CONSUMABLE", "TOOL", "CABLE", "PERIPHERAL", "NETWORKING", "STORAGE", "POWER", "OTHER"] as const;
  const inventoryItems = [];
  for (let i = 0; i < 25; i++) {
    const category = pick([...inventoryCategories]);
    const currentStock = faker.number.int({ min: 0, max: 200 });
    const item = await prisma.inventoryItem.create({
      data: {
        itemCode: `INV-2026-${String(i + 1).padStart(4, "0")}`,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category,
        unit: pick(["pcs", "metres", "boxes", "units"]),
        manufacturer: pick(manufacturers),
        currentStock,
        reservedStock: faker.number.int({ min: 0, max: Math.min(currentStock, 15) }),
        minimumStock: 10,
        maximumStock: 250,
        reorderLevel: 20,
        unitCost: faker.commerce.price({ min: 2, max: 500 }),
        location: `Warehouse ${pick(["A", "B", "C"])}-${faker.number.int({ min: 1, max: 20 })}`,
      },
    });
    inventoryItems.push(item);

    await prisma.inventoryTransaction.create({
      data: {
        itemId: item.id,
        transactionType: "STOCK_IN",
        quantity: currentStock,
        previousStock: 0,
        newStock: currentStock,
        reason: "Initial stock load",
        performedById: pick(allStaff).id,
      },
    });
  }
  console.log(`  ✓ Created ${inventoryItems.length} inventory items with initial transactions.`);

  // ---------------------------------------------------------------
  // 7. Maintenance Schedules, Records, History, Allocations
  // ---------------------------------------------------------------
  console.log("Seeding maintenance schedules & records...");
  const maintenanceTypes = ["PREVENTIVE", "CORRECTIVE", "INSPECTION", "CALIBRATION", "SOFTWARE_UPDATE", "HARDWARE_REPAIR"] as const;
  const maintenanceRecurrences = ["ONE_TIME", "WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"] as const;
  const maintenanceStatuses = ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ARCHIVED"] as const;

  for (const asset of faker.helpers.arrayElements(assets, Math.min(25, assets.length))) {
    const technician = pick(createdUsers.TECHNICIAN);
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        assetId: asset.id,
        type: pick([...maintenanceTypes]),
        technicianId: technician.id,
        priority: pick(priorities) as any,
        recurrence: pick([...maintenanceRecurrences]),
        scheduledDate: daysFromNow(faker.number.int({ min: -10, max: 60 })),
        estimatedDuration: faker.number.int({ min: 30, max: 240 }),
        notes: faker.lorem.sentence(),
      },
    });

    const recordStatus = pick([...maintenanceStatuses]);
    const record = await prisma.maintenanceRecord.create({
      data: {
        assetId: asset.id,
        scheduleId: schedule.id,
        type: schedule.type,
        status: recordStatus,
        priority: schedule.priority,
        technicianId: technician.id,
        scheduledDate: schedule.scheduledDate,
        estimatedDuration: schedule.estimatedDuration,
        actualDuration: recordStatus === "COMPLETED" ? faker.number.int({ min: 20, max: 260 }) : null,
        outcome: recordStatus === "COMPLETED" ? pick(["SUCCESSFUL", "PARTIALLY_COMPLETED", "FAILED"]) : null,
        notes: faker.lorem.sentence(),
      },
    });

    await prisma.maintenanceHistory.create({
      data: {
        recordId: record.id,
        status: recordStatus,
        notes: `Status updated to ${recordStatus}.`,
        performedById: technician.id,
      },
    });

    // Random inventory allocation tied to this maintenance record
    if (faker.datatype.boolean({ probability: 0.5 })) {
      const item = pick(inventoryItems);
      await prisma.inventoryAllocation.create({
        data: {
          itemId: item.id,
          maintenanceRecordId: record.id,
          quantityRequested: faker.number.int({ min: 1, max: 5 }),
          status: pick(["PENDING", "CONSUMED", "RETURNED", "CANCELLED"]),
          allocatedById: technician.id,
        },
      });
    }
  }
  console.log("  ✓ Created maintenance schedules, records, history, and allocations.");

  // Inventory reservations
  for (let i = 0; i < 10; i++) {
    const item = pick(inventoryItems);
    await prisma.inventoryReservation.create({
      data: {
        itemId: item.id,
        quantity: faker.number.int({ min: 1, max: 10 }),
        status: pick(["ACTIVE", "RELEASED", "CONSUMED", "EXPIRED", "CANCELLED"]),
        requestedBy: pick(allStaff).id,
        moduleRef: "Maintenance",
        expiresAt: daysFromNow(faker.number.int({ min: 1, max: 30 })),
      },
    });
  }
  console.log("  ✓ Created 10 inventory reservations.");

  // ---------------------------------------------------------------
  // 8. Notifications & Preferences
  // ---------------------------------------------------------------
  console.log("Seeding notifications...");
  const notifTypes = ["INFO", "SUCCESS", "WARNING", "ERROR"];
  const notifCategories = ["TICKET", "ASSET", "SYSTEM", "MAINTENANCE"];
  for (const user of faker.helpers.arrayElements(allUsers, Math.min(25, allUsers.length))) {
    for (let i = 0; i < faker.number.int({ min: 1, max: 5 }); i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: faker.lorem.words(4),
          message: faker.lorem.sentence(),
          isRead: faker.datatype.boolean({ probability: 0.5 }),
          type: pick(notifTypes),
          category: pick(notifCategories),
        },
      });
    }
  }
  console.log("  ✓ Created notifications for demo users.");

  // ---------------------------------------------------------------
  // 9. Knowledge Base
  // ---------------------------------------------------------------
  console.log("Seeding knowledge base...");
  const kbCategoryDefs = ["Getting Started", "Network & Wi-Fi", "Accounts & Passwords", "Hardware Troubleshooting", "Classroom Tech"];
  const kbCategories = [];
  for (const name of kbCategoryDefs) {
    kbCategories.push(
      await prisma.knowledgeCategory.upsert({
        where: { name },
        update: {},
        create: { name, description: `Guides related to ${name.toLowerCase()}` },
      })
    );
  }

  const kbAuthor = adminUser ?? pick(allStaff);
  for (let i = 0; i < 15; i++) {
    const title = faker.lorem.sentence({ min: 4, max: 8 }).replace(/\.$/, "");
    const slug = faker.helpers.slugify(title).toLowerCase() + `-${i}`;
    const article = await prisma.knowledgeArticle.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        content: faker.lorem.paragraphs(4),
        summary: faker.lorem.sentence(),
        categoryId: pick(kbCategories).id,
        tags: faker.helpers.arrayElements(["wifi", "vpn", "password", "printer", "projector", "laptop", "email"], 3),
        status: pick(["DRAFT", "PUBLISHED"]),
        createdById: kbAuthor.id,
        viewCount: faker.number.int({ min: 0, max: 500 }),
      },
    });

    for (const user of faker.helpers.arrayElements(allUsers, faker.number.int({ min: 0, max: 4 }))) {
      await prisma.articleFeedback.upsert({
        where: { articleId_userId: { articleId: article.id, userId: user.id } },
        update: {},
        create: {
          articleId: article.id,
          userId: user.id,
          helpful: faker.datatype.boolean({ probability: 0.75 }),
          comment: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : null,
        },
      });
    }
  }
  console.log("  ✓ Created 15 knowledge base articles with feedback.");

  // ---------------------------------------------------------------
  // 10. Audit Logs
  // ---------------------------------------------------------------
  console.log("Seeding audit logs...");
  const auditActions = ["AUTH_LOGIN", "TICKET_UPDATE", "ASSET_CREATE", "USER_UPDATE", "PERMISSION_GRANT"];
  for (let i = 0; i < 40; i++) {
    const actor = pick([...allUsers, ...(adminUser ? [adminUser] : [])]);
    await prisma.auditLog.create({
      data: {
        action: pick(auditActions),
        targetTable: pick(["tickets", "assets", "users", "user_permissions"]),
        targetId: faker.string.uuid(),
        performedById: actor.id,
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        createdAt: daysAgo(faker.number.int({ min: 0, max: 90 })),
      },
    });
  }
  console.log("  ✓ Created 40 audit log entries.");

  // ---------------------------------------------------------------
  // 11. GTPE: Temporary Permission Requests
  // ---------------------------------------------------------------
  console.log("Seeding GTPE temporary permission requests...");
  const gtpePerms = await prisma.permission.findMany({
    where: { category: { in: ["Tickets", "Assets", "Inventory"] } },
    take: 12,
  });
  if (gtpePerms.length > 0) {
    for (let i = 0; i < 12; i++) {
      const requester = pick(allRequesters);
      const status = pick(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "EXPIRED"]);
      const reviewer = status === "PENDING" ? null : pick(grantors);
      const request = await prisma.temporaryPermissionRequest.create({
        data: {
          requesterId: requester.id,
          reason: faker.lorem.sentence(),
          durationMinutes: pick([60, 120, 240, 480]),
          status,
          approvalLevel: pick(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
          requiredRole: pick(["DEPT_ADMIN", "SYSTEM_ADMIN"]),
          departmentId: requester.departmentId,
          reviewedById: reviewer?.id,
          reviewedAt: reviewer ? faker.date.recent({ days: 10 }) : null,
          reviewNote: reviewer ? faker.lorem.sentence() : null,
          activatedAt: status === "APPROVED" ? faker.date.recent({ days: 5 }) : null,
          expiresAt: status === "APPROVED" ? daysFromNow(1) : null,
        },
      });
      const items = faker.helpers.arrayElements(gtpePerms, faker.number.int({ min: 1, max: 3 }));
      await prisma.temporaryPermissionRequestItem.createMany({
        data: items.map((p) => ({ requestId: request.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
    console.log("  ✓ Created 12 GTPE temporary permission requests.");
  }

  console.log("🌱 Demo/dummy data seeding complete!");
}
