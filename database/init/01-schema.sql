-- Create database schema for pmo_office_db
CREATE DATABASE IF NOT EXISTS pmo_office_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE pmo_office_db;

-- Partner table
CREATE TABLE Partner (
    PartnerID INT PRIMARY KEY,
    Name VARCHAR(255),
    Sector VARCHAR(255),
    Industry VARCHAR(255),
    Activity VARCHAR(255)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Class table
CREATE TABLE Class (
    ClassID INT PRIMARY KEY,
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
    ModuleID INT PRIMARY KEY,
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
    ContactID INT PRIMARY KEY,
    Name VARCHAR(255),
    Email VARCHAR(255),
    Phone VARCHAR(255),
    Role VARCHAR(255),
    PartnerID INT,
    FOREIGN KEY (PartnerID) REFERENCES Partner(PartnerID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Project table
CREATE TABLE Project (
    ProjectID INT PRIMARY KEY,
    Title VARCHAR(255),
    Description TEXT,
    Status VARCHAR(20) DEFAULT 'Open for partners',
    Comment VARCHAR(255),
    Period VARCHAR(255),
    Quarter INT,
    Year INT,
    NumPrototypes INT,
    PartnerID INT,
    ModuleID INT,
    CoordinatorID INT,
    AdvisorID INT,
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
    ProjectID INT,
    Link VARCHAR(255),
    FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Junction table for Contact-Project relationship
-- This resolves the "belongs to" relationship shown in the ERD without creating a circular dependency
CREATE TABLE ProjectContact (
    ProjectID INT,
    ContactID INT,
    Role VARCHAR(255),
    PRIMARY KEY (ProjectID, ContactID),
    FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID),
    FOREIGN KEY (ContactID) REFERENCES Contact(ContactID)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;