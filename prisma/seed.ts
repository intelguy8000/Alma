import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("✅ Cleaned existing data");

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: "Medicina del Alma",
      slug: "medicina-del-alma",
      primaryColor: "#10B981",
    },
  });

  console.log("✅ Created organization:", organization.name);

  // Hash password
  const passwordHash = await bcrypt.hash("admin123", 12);

  // Create Users
  const julioUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: "intelguy093@gmail.com",
      passwordHash,
      fullName: "Julio Zapata",
      role: "admin",
      isActive: true,
    },
  });

  const jackelineUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: "300hbk117@gmail.com",
      passwordHash,
      fullName: "Jackeline",
      role: "admin",
      isActive: true,
    },
  });

  console.log("✅ Created users:", julioUser.fullName, ",", jackelineUser.fullName);

  // Create Patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        organizationId: organization.id,
        patientCode: "MDA-0001",
        fullName: "María García López",
        phone: "+57 300 123 4567",
        whatsapp: "+57 300 123 4567",
        email: "maria.garcia@email.com",
        isActive: true,
        firstAppointmentDate: subDays(new Date(), 30),
      },
    }),
    prisma.patient.create({
      data: {
        organizationId: organization.id,
        patientCode: "MDA-0002",
        fullName: "Pedro López Hernández",
        phone: "+57 301 234 5678",
        whatsapp: "+57 301 234 5678",
        email: "pedro.lopez@email.com",
        isActive: true,
        firstAppointmentDate: subDays(new Date(), 60),
      },
    }),
    prisma.patient.create({
      data: {
        organizationId: organization.id,
        patientCode: "MDA-0003",
        fullName: "Ana Martínez Rodríguez",
        phone: "+57 302 345 6789",
        whatsapp: "+57 302 345 6789",
        email: "ana.martinez@email.com",
        isActive: true,
        firstAppointmentDate: subDays(new Date(), 14),
      },
    }),
    prisma.patient.create({
      data: {
        organizationId: organization.id,
        patientCode: "MDA-0004",
        fullName: "Carlos Ruiz Torres",
        phone: "+57 303 456 7890",
        whatsapp: "+57 303 456 7890",
        email: "carlos.ruiz@email.com",
        isActive: true,
        firstAppointmentDate: subDays(new Date(), 7),
      },
    }),
    prisma.patient.create({
      data: {
        organizationId: organization.id,
        patientCode: "MDA-0005",
        fullName: "Laura Sánchez Pérez",
        phone: "+57 304 567 8901",
        whatsapp: "+57 304 567 8901",
        email: "laura.sanchez@email.com",
        isActive: true,
        firstAppointmentDate: subDays(new Date(), 3),
      },
    }),
  ]);

  console.log("✅ Created", patients.length, "patients");

  // Create Bank Account
  const bankAccount = await prisma.bankAccount.create({
    data: {
      organizationId: organization.id,
      alias: "Bancolombia Ahorros",
      accountNumber: "****1234",
      bankName: "Bancolombia",
      isActive: true,
    },
  });

  console.log("✅ Created bank account:", bankAccount.alias);

  // Helper to create date with time
  const createDateTime = (daysOffset: number, hour: number, minute: number = 0) => {
    const date = daysOffset >= 0 ? addDays(new Date(), daysOffset) : subDays(new Date(), Math.abs(daysOffset));
    return setMinutes(setHours(date, hour), minute);
  };

  // Create Appointments (mix of past and future)
  const appointments = await Promise.all([
    // Past appointments (completed)
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[0].id,
        date: createDateTime(-6, 0),
        startTime: createDateTime(-6, 9),
        endTime: createDateTime(-6, 10),
        type: "presencial",
        location: "Forum 1103",
        status: "completada",
        notes: "Primera consulta - Muy buena sesión",
      },
    }),
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[1].id,
        date: createDateTime(-5, 0),
        startTime: createDateTime(-5, 10),
        endTime: createDateTime(-5, 11),
        type: "virtual",
        location: "Virtual",
        status: "completada",
        notes: "Seguimiento quincenal",
      },
    }),
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[2].id,
        date: createDateTime(-4, 0),
        startTime: createDateTime(-4, 14),
        endTime: createDateTime(-4, 15),
        type: "terapia_choque",
        location: "La Ceja",
        status: "completada",
        notes: "Terapia de choque exitosa",
      },
    }),
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[3].id,
        date: createDateTime(-3, 0),
        startTime: createDateTime(-3, 11),
        endTime: createDateTime(-3, 12),
        type: "presencial",
        location: "Forum 1103",
        status: "completada",
        notes: "",
      },
    }),
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[4].id,
        date: createDateTime(-2, 0),
        startTime: createDateTime(-2, 16),
        endTime: createDateTime(-2, 17),
        type: "presencial",
        location: "Forum 1103",
        status: "completada",
        notes: "Paciente nuevo - muy receptiva",
      },
    }),
    // Recent / Today
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[0].id,
        date: createDateTime(-1, 0),
        startTime: createDateTime(-1, 9),
        endTime: createDateTime(-1, 10),
        type: "virtual",
        location: "Virtual",
        status: "cancelada",
        notes: "Canceló por viaje de trabajo",
      },
    }),
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[1].id,
        date: createDateTime(0, 0),
        startTime: createDateTime(0, 15),
        endTime: createDateTime(0, 16),
        type: "presencial",
        location: "Forum 1103",
        status: "confirmada",
        notes: "",
      },
    }),
    // Future appointments
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[2].id,
        date: createDateTime(1, 0),
        startTime: createDateTime(1, 10),
        endTime: createDateTime(1, 11),
        type: "presencial",
        location: "Forum 1103",
        status: "confirmada",
        notes: "Segunda sesión de terapia",
      },
    }),
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[3].id,
        date: createDateTime(2, 0),
        startTime: createDateTime(2, 14),
        endTime: createDateTime(2, 15),
        type: "virtual",
        location: "Virtual",
        status: "no_responde",
        notes: "Llamar para confirmar",
      },
    }),
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        patientId: patients[4].id,
        date: createDateTime(3, 0),
        startTime: createDateTime(3, 11),
        endTime: createDateTime(3, 12),
        type: "terapia_choque",
        location: "La Ceja",
        status: "confirmada",
        notes: "Primera terapia de choque",
      },
    }),
  ]);

  console.log("✅ Created", appointments.length, "appointments");

  // Create Sales for completed appointments
  const completedAppointments = appointments.filter((_, index) => index < 5);
  const sales = await Promise.all(
    completedAppointments.map((apt, index) =>
      prisma.sale.create({
        data: {
          organizationId: organization.id,
          appointmentId: apt.id,
          amount: 332000,
          paymentMethod: index % 2 === 0 ? "efectivo" : "transferencia",
          paymentNote: index % 2 === 0 ? "" : "Transferencia Bancolombia",
          bankAccountId: index % 2 === 1 ? bankAccount.id : null,
          date: apt.date,
          createdById: julioUser.id,
        },
      })
    )
  );

  console.log("✅ Created", sales.length, "sales");

  // Create Setting for default price
  await prisma.setting.create({
    data: {
      organizationId: organization.id,
      key: "appointment_default_price",
      value: "332000",
    },
  });

  console.log("✅ Created settings");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Test credentials:");
  console.log("   Email: intelguy093@gmail.com");
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
