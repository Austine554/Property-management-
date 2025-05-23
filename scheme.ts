import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const propertyTypeEnum = pgEnum('property_type', ['apartment', 'house', 'condo', 'commercial']);
export const propertyStatusEnum = pgEnum('property_status', ['for_rent', 'for_sale', 'rented', 'sold']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['pending', 'in_progress', 'completed', 'canceled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue', 'partial']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'property_manager', 'landlord', 'realtor', 'tenant']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('tenant'),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  county: text("county").notNull(),
  postalCode: text("postal_code").notNull(),
  neighborhood: text("neighborhood"),
  type: propertyTypeEnum("type").notNull(),
  status: propertyStatusEnum("status").notNull(),
  price: numeric("price").notNull(),
  currencySymbol: text("currency_symbol").default("KSh").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  squareMeters: numeric("square_meters"),
  yearBuilt: integer("year_built"),
  features: text("features"),
  imageUrl: text("image_url"),
  additionalImages: text("additional_images").array(),
  ownerId: integer("owner_id").references(() => users.id),
  managerId: integer("manager_id").references(() => users.id),
  listingAgentId: integer("listing_agent_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Units table (for multi-unit properties)
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  unitNumber: text("unit_number").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: numeric("bathrooms").notNull(),
  squareFeet: numeric("square_feet").notNull(),
  rent: numeric("rent").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tenants table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  unitId: integer("unit_id").references(() => units.id),
  leaseStart: timestamp("lease_start").notNull(),
  leaseEnd: timestamp("lease_end").notNull(),
  rentAmount: numeric("rent_amount").notNull(),
  securityDeposit: numeric("security_deposit").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// M-Pesa transaction types
export const mpesaTransactionTypeEnum = pgEnum('mpesa_transaction_type', [
  'customer_paybill', 
  'customer_buygoods', 
  'business_payment',
  'business_transfer'
]);

// M-Pesa transactions table
export const mpesaTransactions = pgTable("mpesa_transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  transactionType: mpesaTransactionTypeEnum("transaction_type").notNull(),
  phoneNumber: text("phone_number").notNull(),
  amount: numeric("amount").notNull(),
  reference: text("reference"),
  description: text("description"),
  paymentId: integer("payment_id").references(() => payments.id),
  status: text("status").notNull(),
  responseCode: text("response_code"),
  responseDescription: text("response_description"),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  amount: numeric("amount").notNull(),
  currencySymbol: text("currency_symbol").default("KSh").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: paymentStatusEnum("status").notNull(),
  paymentMethod: text("payment_method").notNull(),
  mpesaTransactionId: text("mpesa_transaction_id"),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  receivedById: integer("received_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  amount: numeric("amount").notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Maintenance requests table
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  unitId: integer("unit_id").references(() => units.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  status: maintenanceStatusEnum("status").notNull().default('pending'),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

// Define Zod schemas for inserts
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true, submittedAt: true, completedAt: true });

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
