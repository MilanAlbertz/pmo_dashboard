-- Create database schema for pmo_office_db
CREATE DATABASE IF NOT EXISTS pmo_office_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE pmo_office_db;

-- Partner table
CREATE TABLE Partner (
    PartnerID VARCHAR(20) PRIMARY KEY,
    Name VARCHAR(255),
    Sector VARCHAR(255),
    Industry VARCHAR(255),
    Activity VARCHAR(255)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Class table
CREATE TABLE Class (
    ClassID INT AUTO_INCREMENT PRIMARY KEY,
    ClassCode VARCHAR(255),
    Classroom VARCHAR(255)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Staff table
CREATE TABLE Staff (
    StaffID INT PRIMARY KEY,
    Name VARCHAR(255),
    Role VARCHAR(255),  -- Changed from ENUM to VARCHAR to match ERD
    Email VARCHAR(255)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Module table
CREATE TABLE Module (
    ModuleID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Course VARCHAR(100),
    Description TEXT,
    Period VARCHAR(10),
    ClassID INT,
    FieldOfStudy VARCHAR(100),
    FOREIGN KEY (ClassID) REFERENCES Class(ClassID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Agreement table
CREATE TABLE Agreement (
    AgreementID INT PRIMARY KEY,
    Sent BOOLEAN,
    Returned BOOLEAN,
    Signed BOOLEAN,
    Comments TEXT
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- TAPI table
CREATE TABLE TAPI (
    TapiID INT PRIMARY KEY,
    Sent BOOLEAN,
    Returned BOOLEAN,
    Signed BOOLEAN,
    Comments TEXT
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Contact table - removed ProjectID to avoid circular dependency
CREATE TABLE Contact (
    ContactID VARCHAR(18) PRIMARY KEY,
    Name VARCHAR(255),
    Email VARCHAR(255),
    Phone VARCHAR(255),
    Role VARCHAR(255),
    PartnerID VARCHAR(18),
    FOREIGN KEY (PartnerID) REFERENCES Partner(PartnerID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Project table
CREATE TABLE Project (
    ProjectID VARCHAR(20) PRIMARY KEY,
    Title VARCHAR(255),
    Description TEXT,
    Status VARCHAR(100) DEFAULT 'Open for partners',
    Comment VARCHAR(255),
    Quarter INT,
    Year INT,
    NumPrototypes INT,
    PartnerID VARCHAR(20),
    ModuleID INT NOT NULL,
    CoordinatorID VARCHAR(18),
    AdvisorID VARCHAR(18),
    TapiID INT,
    AgreementID INT,
    FOREIGN KEY (PartnerID) REFERENCES Partner(PartnerID),
    FOREIGN KEY (ModuleID) REFERENCES Module(ModuleID),
    FOREIGN KEY (CoordinatorID) REFERENCES Contact(ContactID),
    FOREIGN KEY (AdvisorID) REFERENCES Contact(ContactID),
    FOREIGN KEY (TapiID) REFERENCES TAPI(TapiID),
    FOREIGN KEY (AgreementID) REFERENCES Agreement(AgreementID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ProjectGitHub table
CREATE TABLE ProjectGitHub (
    GitHubID INT PRIMARY KEY,
    ProjectID VARCHAR(20),
    Link VARCHAR(255),
    FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Junction table for Contact-Project relationship
-- This resolves the "belongs to" relationship shown in the ERD without creating a circular dependency
CREATE TABLE ProjectContact (
    ProjectID VARCHAR(20),
    ContactID VARCHAR(18),
    Role VARCHAR(255),
    PRIMARY KEY (ProjectID, ContactID),
    FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID),
    FOREIGN KEY (ContactID) REFERENCES Contact(ContactID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Leads table
CREATE TABLE Leads (
    LeadID VARCHAR(20) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Phone VARCHAR(50),
    Email VARCHAR(255),
    Company VARCHAR(255)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ProspectionCards table
CREATE TABLE ProspectionCards (
    ProspectionCardID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Course VARCHAR(255) NOT NULL,
    Description TEXT,
    Year INT NOT NULL,
    Period INT NOT NULL,
    ClassCode VARCHAR(50),
    Status ENUM('Open for partners', 'Pending', 'Confirmed') NOT NULL DEFAULT 'Open for partners',
    Advisor VARCHAR(255),
    Classroom VARCHAR(10)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Junction table for ProspectionCards-Partner relationship
CREATE TABLE ProspectionCardPartner (
    ProspectionCardID INT,
    PartnerID VARCHAR(20),
    PRIMARY KEY (ProspectionCardID, PartnerID),
    FOREIGN KEY (ProspectionCardID) REFERENCES ProspectionCards(ProspectionCardID),
    FOREIGN KEY (PartnerID) REFERENCES Partner(PartnerID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;