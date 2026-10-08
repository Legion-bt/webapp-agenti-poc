export type UserRole = 'HQ_SUPERADMIN' | 'ORG_ADMIN' | 'AGENT';

/** A login account as returned by the admin-users Edge Function. */
export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | null;
  orgId: string | null;
  agentId: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  disabled: boolean;
}

export interface ManagedUserInput {
  email?: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId: string | null;
  agentId: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId: string;
  agentId?: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  code: string;
  name: string;
  legalName: string;
  vatNumber: string;
  taxCode: string;
  address: string;
  city: string;
  province: string;
  erpConnectorType: 'APRA_ERP' | 'SAP_BUSINESS_ONE' | 'ZUCCHETTI_AD HOC' | 'GENERIC_REST';
  erpEndpoint: string;
  erpStatus: 'CONNECTED' | 'SYNCING' | 'ERROR' | 'OFFLINE';
  erpLastSync: string;
  agentsCount: number;
  customersCount: number;
  active: boolean;
  createdAt: string;
}

export interface SalesAgent {
  id: string;
  orgId: string;
  profileId: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  commissionRate: number; // e.g. 5.5%
  monthlyTarget: number;
  yearlyTarget: number;
  active: boolean;
}

export interface Customer {
  id: string;
  orgId: string;
  code: string; // e.g. '000030'
  businessName: string; // e.g. 'ROSSI VALENTINO SPA'
  vatNumber: string;
  taxCode: string;
  sdiCode: string; // e.g. '0000000'
  email: string;
  pec: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  area: string;
  salesAgentId: string;
  salesAgentName: string;
  priceListId: string;
  priceListName: string;
  paymentTerm: string; // e.g. 'Bonifico bancario 30 - 60 - 90 gg. d.f.'
  iban: string;
  bankName: string;
  deliveryNotes: string;
  creditLimit: number; // Fido concesso
  currentExposure: number; // Esposizione attuale
  overdueAmount: number; // Scaduto insoluto
  status: 'ACTIVE' | 'BLOCKED' | 'POTENTIAL' | 'INACTIVE';
  category: string;
  notes?: string;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSuspendedItem {
  id: string;
  customerId: string;
  docNumber: string; // e.g. '2026-RFN-0000079'
  internalRef: string; // e.g. '470/1'
  docDate: string;
  type: string; // 'BON', 'RB', 'RD'
  matchTitle: string; // 'Ns. Fattura RB30: R.B. 30 gg. d.f.m.'
  dueDate: string;
  balance: number;
  amount: number;
  toCollect: number;
  isPaid: boolean;
  notes?: string;
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
}

export interface Product {
  id: string;
  orgId: string;
  code: string; // e.g. 'SAGR075'
  barcode: string;
  name: string; // e.g. 'SAGRANTINO DI MONTEFALCO X 0,75'
  description: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  unit: string; // 'BT', 'ST', 'PZ', 'LT'
  packInfo: string; // '12 BT x CA12', '1 ST x BT'
  basePrice: number;
  costPrice: number;
  defaultDiscount1: number;
  defaultDiscount2: number;
  defaultDiscount3: number;
  imageUrl: string;
  active: boolean;
  isPromo: boolean;
  vintageYear?: string;
  alcoholPercentage?: string;
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  quantityOnHand: number;
  quantityCommitted: number;
  quantityAvailable: number;
  nextArrivalDate?: string;
  nextArrivalQty?: number;
}

export interface PriceList {
  id: string;
  orgId: string;
  code: string;
  name: string;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  price: number;
  discount1: number;
  discount2: number;
}

export interface CustomerProductPrice {
  id: string;
  customerId: string;
  productId: string;
  price: number;
  discount1: number;
  discount2: number;
  validFrom: string;
  validTo: string;
}

export interface PricingResult {
  listPrice: number;
  priceListCode: string;
  discount1: number;
  discount2: number;
  specialPrice: number | null;
  netPrice: number;
  lineTotal: number;
  reason: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'INVOICED'
  | 'CANCELLED'
  | 'BLOCKED';

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  productCode: string;
  productName: string;
  packInfo: string;
  unit: string;
  quantity: number;
  quantityShipped?: number;
  listPrice: number;
  discount1: number;
  discount2: number;
  unitPrice: number; // Net unit price
  lineTotal: number;
  notes?: string;
  availableStock?: number;
}

export interface Order {
  id: string;
  orgId: string;
  number: string; // e.g. '2026-OV-0000036'
  customerId: string;
  customerCode: string;
  customerName: string;
  salesAgentId: string;
  salesAgentName: string;
  quoteId?: string;
  status: OrderStatus;
  orderDate: string;
  requestedDeliveryDate: string;
  paymentTerm: string;
  causal: string; // e.g. 'OV - ORDINI CLIENTI'
  notes: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  residualTotal: number;
  backOrder: boolean;
  blockReason?: string;
  erpSyncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  erpDocNumber?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export interface QuoteItem {
  id: string;
  quoteId?: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  listPrice: number;
  discount1: number;
  discount2: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export interface Quote {
  id: string;
  orgId: string;
  number: string; // e.g. '2026-PREV-00012'
  customerId: string;
  customerName: string;
  salesAgentId: string;
  salesAgentName: string;
  status: QuoteStatus;
  quoteDate: string;
  validUntil: string;
  paymentTerm: string;
  notes: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  convertedOrderId?: string;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  orgId: string;
  customerId: string;
  customerName: string;
  customerCity: string;
  salesAgentId: string;
  visitDate: string;
  type: 'VISIT' | 'CALL' | 'EMAIL' | 'VIDEO_CALL' | 'OTHER';
  outcome: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'FOLLOW_UP_REQUIRED';
  notes: string;
  followUpDate?: string;
  orderGeneratedId?: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  orgId: string;
  salesAgentId: string;
  agentName: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  baseAmount: number;
  percentage: number;
  amount: number;
  status: 'ACCRUED' | 'PAYABLE' | 'PAID';
  accruedDate: string;
  paidDate?: string;
}

export interface ErpSyncLog {
  id: string;
  orgId: string;
  timestamp: string;
  entityType: 'CUSTOMERS' | 'ORDERS' | 'PRODUCTS' | 'STOCK' | 'OVERDUES';
  direction: 'ERP_TO_APP' | 'APP_TO_ERP';
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  recordsCount: number;
  message: string;
  durationMs: number;
}

export interface CustomerDocument {
  id: string;
  customerId: string;
  fileName: string;
  storagePath: string;
  sizeBytes: number;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
}
