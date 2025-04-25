-- Create database schema for pmo_office_db
USE pmo_office_db;

-- Contact table
CREATE TABLE Contact (
    ContactID INT PRIMARY KEY,
    Name VARCHAR(255),
    Email VARCHAR(255),
    Phone VARCHAR(255),
    Role VARCHAR(255),
    PartnerID INT,
    ProjectID INT,
    NULLABLE BOOLEAN
);

-- Partner table
CREATE TABLE Partner (
    PartnerID INT PRIMARY KEY,
    Name VARCHAR(255),
    Sector VARCHAR(255),
    Industry VARCHAR(255),
    Activity VARCHAR(255)
);

-- Class table
CREATE TABLE Class (
    ClassID INT PRIMARY KEY,
    ClassCode VARCHAR(255),
    Audit VARCHAR(255)
);

-- Staff table
CREATE TABLE Staff (
    StaffID INT PRIMARY KEY,
    Name VARCHAR(255),
    Role ENUM('admin'),
    Email VARCHAR(255)
);

-- Module table
CREATE TABLE Module (
    ModuleID INT PRIMARY KEY,
    Name VARCHAR(255),
    Course VARCHAR(255),
    Description VARCHAR(255),
    Period VARCHAR(255),
    ClassID INT,
    FOREIGN KEY (ClassID) REFERENCES Class(ClassID)
);

-- Agreement table
CREATE TABLE Agreement (
    AgreementID INT PRIMARY KEY,
    Sent BOOLEAN,
    Returned BOOLEAN,
    Signed BOOLEAN,
    Comments TEXT
);

-- TAPI table
CREATE TABLE TAPI (
    TapiID INT PRIMARY KEY,
    Sent BOOLEAN,
    Returned BOOLEAN,
    Signed BOOLEAN,
    Comments TEXT
);

-- Project table
CREATE TABLE Project (
    ProjectID INT PRIMARY KEY,
    Title VARCHAR(255),
    Description TEXT,
    Status VARCHAR(255),
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
    FOREIGN KEY (TapiID) REFERENCES TAPI(TapiID),
    FOREIGN KEY (AgreementID) REFERENCES Agreement(AgreementID)
);

-- ProjectGitHub table
CREATE TABLE ProjectGitHub (
    GitHubID INT PRIMARY KEY,
    ProjectID INT,
    Link VARCHAR(255),
    FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID)
);

-- Add foreign key constraints for Contact
ALTER TABLE Contact
ADD CONSTRAINT FK_Contact_Partner
FOREIGN KEY (PartnerID) REFERENCES Partner(PartnerID);

ALTER TABLE Contact
ADD CONSTRAINT FK_Contact_Project
FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID);
