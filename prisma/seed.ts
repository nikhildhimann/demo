import "dotenv/config";
import {
  LeadPriority,
  LeadStatus,
  PrismaClient,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaConnectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!prismaConnectionString) {
  throw new Error("Missing DATABASE_URL or DIRECT_URL in environment");
}

const pool = new pg.Pool({ connectionString: prismaConnectionString, max: 1 });

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ["warn", "error"],
});

async function main() {
  console.log("Starting seeding...");

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@gmail.com" },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      email: process.env.SEED_ADMIN_EMAIL || "admin@gmail.com",
      name: "Admin User",
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "Demo Realty",
      tagline: "Reusable real estate growth website",
      phone: "+1 555 010 1000",
      whatsappNumber: "15550101000",
      email: "hello@demo-realty.example",
      address: "100 Market Street",
      city: "Demo City",
      state: "Demo State",
      country: "Demo Country",
      primaryDomain: "https://demo-realty.example",
      facebookUrl: "https://facebook.com",
      twitterUrl: "https://twitter.com",
      instagramUrl: "https://instagram.com",
      linkedinUrl: "https://linkedin.com",
      defaultSeoTitle: "Demo Realty | Properties for Buy, Rent and Sell",
      defaultSeoDescription: "A reusable real estate website and lead growth system for agencies and developers.",
    },
  });

  const properties = [
    {
      title: "Modern City Apartment",
      slug: "modern-city-apartment",
      description: "A bright apartment close to business districts, transit, shops, and daily conveniences.",
      price: 450000,
      purpose: PropertyPurpose.BUY,
      status: PropertyStatus.AVAILABLE,
      type: PropertyType.APARTMENT,
      bedrooms: 2,
      bathrooms: 2,
      area: 980,
      size: 980,
      location: "Central District",
      suburb: "Central",
      address: "100 Market Street",
      city: "Demo City",
      state: "Demo State",
      zip: "10001",
      zipCode: "10001",
      country: "Demo Country",
      amenities: ["Transit Access", "Gym", "Secure Parking", "Balcony"],
      featured: true,
    },
    {
      title: "Family Townhouse Near Schools",
      slug: "family-townhouse-near-schools",
      description: "A spacious townhouse with flexible rooms, private outdoor space, and nearby schools.",
      price: 3200,
      purpose: PropertyPurpose.RENT,
      status: PropertyStatus.AVAILABLE,
      type: PropertyType.TOWNHOUSE,
      bedrooms: 4,
      bathrooms: 3,
      area: 1850,
      size: 1850,
      location: "Green Park",
      suburb: "Green Park",
      address: "45 Garden Avenue",
      city: "Demo City",
      state: "Demo State",
      zip: "10002",
      zipCode: "10002",
      country: "Demo Country",
      amenities: ["Garden", "Garage", "Modern Kitchen", "Pet Friendly"],
      featured: true,
    },
    {
      title: "Commercial Showroom Plot",
      slug: "commercial-showroom-plot",
      description: "A high-visibility land parcel suited for a showroom, retail outlet, or commercial development.",
      price: 900000,
      purpose: PropertyPurpose.SELL,
      status: PropertyStatus.AVAILABLE,
      type: PropertyType.PLOT,
      bedrooms: 0,
      bathrooms: 0,
      area: 5000,
      size: 5000,
      location: "Highway Corridor",
      suburb: "North Gateway",
      address: "12 Highway Link Road",
      city: "Demo City",
      state: "Demo State",
      zip: "10003",
      zipCode: "10003",
      country: "Demo Country",
      amenities: ["Main Road", "Commercial Zoning", "Corner Plot", "Utility Access"],
      featured: true,
    },
  ];

  for (const property of properties) {
    await prisma.property.upsert({
      where: { slug: property.slug },
      update: {
        ...property,
        authorId: admin.id,
      },
      create: {
        ...property,
        authorId: admin.id,
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200",
              publicId: "demo-image-" + property.slug,
              order: 0,
            },
          ],
        },
      },
    });
  }

  await prisma.enquiry.deleteMany({
    where: { 
      source: { in: ["website", "chatbot", "seller_appraisal", "Demo Seed"] }
    },
  });

  await prisma.enquiry.createMany({
    data: [
      {
        name: "Demo Buyer",
        email: "buyer@example.com",
        phone: "+1 555 010 2000",
        status: LeadStatus.NEW,
        priority: LeadPriority.HOT,
        source: "website",
        budget: "450000",
        preferredLocation: "Central District",
        preferredType: "APARTMENT",
        interestType: "BUY",
        preferredContactTime: "Morning",
        message: "I am interested in buying an apartment near transit.",
        notes: "Follow up quickly, highly interested.",
        followUpDate: new Date(Date.now() + 86400000), // Tomorrow
      },
      {
        name: "Demo Tenant",
        email: "tenant@example.com",
        phone: "+1 555 010 3000",
        status: LeadStatus.CONTACTED,
        priority: LeadPriority.WARM,
        source: "chatbot",
        budget: "3000-3500",
        preferredLocation: "Green Park",
        preferredType: "TOWNHOUSE",
        interestType: "RENT",
        interestLocation: "Green Park",
        interestBudget: "3000-3500",
        interestPropertyType: "TOWNHOUSE",
        preferredContactTime: "1-3 Months",
        message: "Chatbot requirement - Type: Rent | Location: Green Park | Budget: 3000-3500 | Property Type: Townhouse | Bedrooms: 3 | Timeline: 1-3 Months",
      },
      {
        name: "Demo Seller",
        email: "seller@example.com",
        phone: "+1 555 010 4000",
        status: LeadStatus.NEW,
        priority: LeadPriority.HOT,
        source: "seller_appraisal",
        budget: "850000",
        preferredLocation: "Downtown Avenue",
        preferredType: "VILLA",
        interestType: "SELL",
        preferredContactTime: "Immediately",
        message: "Seller Appraisal Request\nProperty Address: Downtown Avenue\nProperty Type: Villa\nExpected Price: 850000\nTimeline: Immediately\n\nAdditional Details: Looking to sell my property fast.",
      },
    ],
  });

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
