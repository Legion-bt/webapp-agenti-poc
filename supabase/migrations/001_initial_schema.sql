-- =====================================================================
-- MIGRATION: 001_initial_schema.sql
-- ERP Sales Agent WebApp Multi-tenant SaaS Database Schema
-- Compatible with Supabase PostgreSQL & Row Level Security (RLS)
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS (Multi-tenant B2B Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    vat_number VARCHAR(50),
    tax_code VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(50),
    erp_connector_type VARCHAR(50) DEFAULT 'APRA_ERP',
    erp_endpoint TEXT,
    erp_status VARCHAR(20) DEFAULT 'CONNECTED',
    erp_last_sync TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('HQ_SUPERADMIN', 'ORG_ADMIN', 'AGENT')),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SALES AGENTS
CREATE TABLE IF NOT EXISTS sales_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    area VARCHAR(100),
    commission_rate NUMERIC(5,2) DEFAULT 5.00,
    monthly_target NUMERIC(12,2) DEFAULT 25000.00,
    yearly_target NUMERIC(12,2) DEFAULT 300000.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 4. PRICE LISTS
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    active BOOLEAN DEFAULT TRUE,
    UNIQUE(org_id, code)
);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    tax_code VARCHAR(50),
    sdi_code VARCHAR(20) DEFAULT '0000000',
    email VARCHAR(255),
    pec VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'ITALIA',
    area VARCHAR(100),
    sales_agent_id UUID REFERENCES sales_agents(id) ON DELETE SET NULL,
    price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL,
    payment_term VARCHAR(255) DEFAULT 'Bonifico 30/60 gg d.f.',
    iban VARCHAR(50),
    bank_name VARCHAR(100),
    delivery_notes TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 20000.00,
    current_exposure NUMERIC(12,2) DEFAULT 0.00,
    overdue_amount NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    category VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 6. CUSTOMER SUSPENDED INVOICES / OVERDUES (Sospesi / Partite Aperte)
CREATE TABLE IF NOT EXISTS customer_suspended_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    doc_number VARCHAR(100) NOT NULL,
    internal_ref VARCHAR(50),
    doc_date DATE NOT NULL,
    doc_type VARCHAR(20) NOT NULL,
    match_title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    balance NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    to_collect NUMERIC(12,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL
);

-- 8. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'PZ',
    pack_info VARCHAR(100),
    base_price NUMERIC(12,2) NOT NULL,
    cost_price NUMERIC(12,2),
    default_discount1 NUMERIC(5,2) DEFAULT 0,
    default_discount2 NUMERIC(5,2) DEFAULT 0,
    default_discount3 NUMERIC(5,2) DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    is_promo BOOLEAN DEFAULT FALSE,
    vintage_year VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, code)
);

-- 9. WAREHOUSES & STOCK
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_on_hand INT DEFAULT 0,
    quantity_committed INT DEFAULT 0,
    quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
    next_arrival_date DATE,
    next_arrival_qty INT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id)
);

-- 10. PRICE LIST ITEMS & CUSTOMER SPECIAL PRICES
CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(12,2) NOT NULL,
    discount1 NUMERIC(5,2) DEFAULT 0,
    discount2 NUMERIC(5,2) DEFAULT 0,
    UNIQUE(price_list_id, product_id)
);

CREATE TABLE IF NOT EXISTS customer_product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(12,2) NOT NULL,
    discount1 NUMERIC(5,2) DEFAULT 0,
    discount2 NUMERIC(5,2) DEFAULT 0,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    UNIQUE(customer_id, product_id)
);

-- 11. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    sales_agent_id UUID NOT NULL REFERENCES sales_agents(id),
    quote_id UUID,
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    order_date DATE DEFAULT CURRENT_DATE,
    requested_delivery_date DATE,
    payment_term VARCHAR(255),
    causal VARCHAR(100) DEFAULT 'OV - ORDINI CLIENTI',
    notes TEXT,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_total NUMERIC(12,2) DEFAULT 0,
    tax_total NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    residual_total NUMERIC(12,2) DEFAULT 0,
    back_order BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    erp_sync_status VARCHAR(50) DEFAULT 'SYNCED',
    erp_doc_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, number)
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    quantity_shipped INT DEFAULT 0,
    list_price NUMERIC(12,2) NOT NULL,
    discount1 NUMERIC(5,2) DEFAULT 0,
    discount2 NUMERIC(5,2) DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    notes TEXT
);

-- 12. QUOTES & QUOTE ITEMS
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    sales_agent_id UUID NOT NULL REFERENCES sales_agents(id),
    status VARCHAR(50) DEFAULT 'SENT',
    quote_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    payment_term VARCHAR(255),
    notes TEXT,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_total NUMERIC(12,2) DEFAULT 0,
    tax_total NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, number)
);

CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    list_price NUMERIC(12,2) NOT NULL,
    discount1 NUMERIC(5,2) DEFAULT 0,
    discount2 NUMERIC(5,2) DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    notes TEXT
);

-- 13. VISITS & COMMERCIAL CRM
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sales_agent_id UUID NOT NULL REFERENCES sales_agents(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'VISIT',
    outcome VARCHAR(50) DEFAULT 'POSITIVE',
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. COMMISSIONS
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sales_agent_id UUID NOT NULL REFERENCES sales_agents(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_number VARCHAR(100),
    customer_name VARCHAR(255),
    base_amount NUMERIC(12,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACCRUED',
    accrued_date DATE DEFAULT CURRENT_DATE,
    paid_date DATE
);

-- 15. ERP SYNC LOGS
CREATE TABLE IF NOT EXISTS erp_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    entity_type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_count INT DEFAULT 0,
    message TEXT,
    duration_ms INT DEFAULT 0
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_suspended_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY price_lists_read ON price_lists FOR SELECT USING (true);
CREATE POLICY product_categories_read ON product_categories FOR SELECT USING (true);
CREATE POLICY products_read ON products FOR SELECT USING (true);
CREATE POLICY sales_agents_read ON sales_agents FOR SELECT USING (true);

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (role VARCHAR, org_id UUID, agent_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT p.role, p.org_id, a.id AS agent_id
    FROM profiles p
    LEFT JOIN sales_agents a ON a.profile_id = p.id
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Superadmins have full access
CREATE POLICY superadmin_all_organizations ON organizations
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'HQ_SUPERADMIN'));

-- Org Admins can read their organization
CREATE POLICY org_admin_read_org ON organizations
    FOR SELECT USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Customers RLS:
-- HQ: all
-- ORG_ADMIN: all in their organization
-- AGENT: only customers where sales_agent_id matches their agent id
CREATE POLICY customers_agent_access ON customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            LEFT JOIN sales_agents a ON a.profile_id = p.id
            WHERE p.id = auth.uid() AND (
                p.role = 'HQ_SUPERADMIN'
                OR (p.role = 'ORG_ADMIN' AND p.org_id = customers.org_id)
                OR (p.role = 'AGENT' AND customers.sales_agent_id = a.id)
            )
        )
    );

-- Orders RLS:
CREATE POLICY orders_agent_access ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            LEFT JOIN sales_agents a ON a.profile_id = p.id
            WHERE p.id = auth.uid() AND (
                p.role = 'HQ_SUPERADMIN'
                OR (p.role = 'ORG_ADMIN' AND p.org_id = orders.org_id)
                OR (p.role = 'AGENT' AND orders.sales_agent_id = a.id)
            )
        )
    );
