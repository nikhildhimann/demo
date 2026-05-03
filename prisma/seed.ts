import "dotenv/config";
import { PrismaClient, UserRole, PropertyStatus, PropertyType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

// Test basic PostgreSQL connection first
import pg from "pg";

async function testConnection() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ Missing DIRECT_URL or DATABASE_URL in environment");
    return false;
  }

  const pool = new pg.Pool({ 
    connectionString
  });
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : String(error));
    await pool.end();
    return false;
  }
}

const prismaConnectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!prismaConnectionString) {
  throw new Error("Missing DATABASE_URL or DIRECT_URL in environment");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(new pg.Pool({ connectionString: prismaConnectionString })),
  log: ["query", "info", "warn", "error"],
});

async function main() {
  // Test database connection first
  console.log('🔍 Testing database connection...');
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Cannot proceed with seeding due to database connection failure');
    process.exit(1);
  }

  // 1. Create Admin
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      name: "Admin User",
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log({ admin });

  // 2. Sample Properties
  const properties = [
    {
      title: "Modern Apartment – Sydney CBD",
      description: "Stunning modern apartment in the heart of Sydney CBD with city views and premium amenities.",
      price: 850,
      status: PropertyStatus.AVAILABLE,
      type: PropertyType.APARTMENT,
      bedrooms: 2,
      bathrooms: 2,
      area: 120,
      address: "100 George Street",
      city: "Sydney",
      state: "NSW",
      zip: "2000",
      country: "Australia",
      amenities: ["City Views", "Gym", "Secure Parking", "Air Conditioning"],
      featured: true,
      agentName: "TOTTO Living",
      agentEmail: "info@tottoliving.com.au",
      agentPhone: "+61 435 938 455"
    },
    {
      title: "Luxury Rental – Darling Harbour",
      description: "Luxurious waterfront apartment with spectacular harbour views and world-class facilities.",
      price: 1500,
      status: PropertyStatus.AVAILABLE,
      type: PropertyType.APARTMENT,
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      address: "45 Darling Drive",
      city: "Sydney",
      state: "NSW",
      zip: "2000",
      country: "Australia",
      amenities: ["Harbour Views", "Pool", "Concierge", "Balcony"],
      featured: true,
      agentName: "TOTTO Living",
      agentEmail: "info@tottoliving.com.au",
      agentPhone: "+61 435 938 455"
    },
    {
      title: "Family Home – Inner West Sydney",
      description: "Perfect family home in the desirable Inner West with spacious living and great schools nearby.",
      price: 1200,
      status: PropertyStatus.AVAILABLE,
      type: PropertyType.HOUSE,
      bedrooms: 4,
      bathrooms: 2,
      area: 250,
      address: "123 Parramatta Road",
      city: "Sydney",
      state: "NSW",
      zip: "2040",
      country: "Australia",
      amenities: ["Garden", "Garage", "Modern Kitchen", "Close to Schools"],
      featured: true,
      agentName: "TOTTO Living",
      agentEmail: "info@tottoliving.com.au",
      agentPhone: "+61 435 938 455"
    }
  ];

  for (const p of properties) {
    const slug = p.title.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(7);
    
    await prisma.property.create({
      data: {
        ...p,
        slug,
        authorId: admin.id,
        images: {
          create: [
            {
              url: `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200`,
              publicId: `seed-${Math.random()}`,
              order: 0
            }
          ]
        }
      }
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
