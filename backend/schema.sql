-- GSDD Foundation - MySQL Database Schema
-- Database: gsdd_foundation_db

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL DEFAULT 'Administrator',
    email VARCHAR(150) NOT NULL DEFAULT 'admin@gsddfoundation.org',
    role VARCHAR(50) NOT NULL DEFAULT 'Super Administrator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    token_preview VARCHAR(64) DEFAULT NULL,
    revoked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_admin_sessions_username (username),
    INDEX idx_admin_sessions_revoked (revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(64) PRIMARY KEY,
    recipient VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    type VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    issue_date VARCHAR(64) NOT NULL,
    validity VARCHAR(100) NOT NULL DEFAULT 'Permanent Lifetime Credential',
    authority VARCHAR(150) NOT NULL,
    signatory_title VARCHAR(150) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    cin VARCHAR(50) NOT NULL,
    mca_reg VARCHAR(50) NOT NULL,
    pan VARCHAR(20) NOT NULL,
    tax_80g VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Authentic & Verified',
    is_original TINYINT(1) NOT NULL DEFAULT 1,
    verification_code VARCHAR(100) NOT NULL UNIQUE,
    hash VARCHAR(150) NOT NULL,
    email_delivered VARCHAR(64) DEFAULT NULL,
    email_subject VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cert_email (email),
    INDEX idx_cert_code (verification_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Active Member',
    membership_type VARCHAR(100) NOT NULL DEFAULT 'Annual Life Benefactor',
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    join_date VARCHAR(64) NOT NULL,
    fee_status VARCHAR(50) NOT NULL DEFAULT 'Paid',
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 1200.00,
    id_card_number VARCHAR(100) NOT NULL UNIQUE,
    blood_group VARCHAR(10) DEFAULT 'O+',
    district VARCHAR(100) DEFAULT 'Raniganj, Araria',
    state VARCHAR(100) DEFAULT 'Bihar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    pan VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    total_donations DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_donor_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donations (
    id VARCHAR(64) PRIMARY KEY,
    donor_id VARCHAR(64) DEFAULT NULL,
    donor_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    pan VARCHAR(20) DEFAULT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'UPI/QR',
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'Verified',
    is_recurring TINYINT(1) NOT NULL DEFAULT 0,
    frequency VARCHAR(50) DEFAULT 'one-time',
    receipt_80g_number VARCHAR(100) NOT NULL UNIQUE,
    certificate_id VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_donation_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(100) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    bio TEXT NOT NULL,
    photo_url VARCHAR(255) DEFAULT '/team-photo-default.jpg',
    responsibilities JSON DEFAULT NULL,
    notifications JSON DEFAULT NULL,
    certificates JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_items (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    date VARCHAR(64) NOT NULL,
    caption TEXT DEFAULT NULL,
    uploader VARCHAR(100) NOT NULL DEFAULT 'GSDD Media Wing',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'general', -- 'general', 'complaint', 'enquiry'
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(64) PRIMARY KEY,
    appointee_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    tenure VARCHAR(100) NOT NULL,
    reference_order VARCHAR(100) NOT NULL UNIQUE,
    qr_code VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active Order',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
