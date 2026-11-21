import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 12);
  const investor = await prisma.user.upsert({
    where: { email: "investor@oilguard.local" },
    update: {},
    create: {
      name: "Jordan Adeyemi",
      email: "investor@oilguard.local",
      passwordHash,
      role: "INVESTOR",
      account: { create: { investmentCapital: 40000, projectedReturns: 640000 } }
    }
  });
  await prisma.user.upsert({
    where: { email: "analyst@oilguard.local" },
    update: {},
    create: { name: "Training Analyst", email: "analyst@oilguard.local", passwordHash, role: "ANALYST" }
  });

  const count = await prisma.activityEvent.count({ where: { userId: investor.id } });
  if (!count) {
    await prisma.activityEvent.createMany({
      data: [
        { userId: investor.id, type: "INVESTMENT", title: "Initial simulated investment", description: "Synthetic record representing fictional investment capital.", amount: 40000, status: "REVIEWED", riskScore: 5 },
        { userId: investor.id, type: "RETURN_PROJECTION", title: "Unusually high projected return", description: "A projected return of $640,000 against $40,000 capital is a major verification red flag.", amount: 640000, status: "OPEN", riskScore: 94 },
        { userId: investor.id, type: "WITHDRAWAL_FEE", title: "Advance-fee demand detected", description: "The scenario requests an upfront $25,000 payment before releasing fictional returns. No payment is collected.", amount: 25000, status: "OPEN", riskScore: 99 },
        { userId: investor.id, type: "DATA_REQUEST", title: "Sensitive banking data request risk", description: "Requests for account credentials, card data, PINs or OTPs must be treated as high risk. This application does not collect them.", status: "OPEN", riskScore: 100 }
      ]
    });
  }
  console.log("Seed complete. Demo password: DemoPass123!");
}

main().finally(() => prisma.$disconnect());
