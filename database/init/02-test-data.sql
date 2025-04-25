-- Insert test data into the database
INSERT INTO Project (ProjectID, Title, Description, Status, Period, Year, NumPrototypes)
VALUES (1, 'Test Project', 'This is a test project created during initialization', 
        'Active', 'Q1', 2024, 1);

-- Insert test data into Contact
INSERT INTO Contact (ContactID, Name, Email, Phone, Role)
VALUES (1, 'Test User', 'test.user@example.com', '1234567890', 'Developer');

-- Insert test data into Staff
INSERT INTO Staff (StaffID, Name, Email, Role)
VALUES (1, 'Staff Member', 'staff.member@example.com', 'admin'); 