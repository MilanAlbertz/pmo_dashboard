-- Insert mock data into Partner table
INSERT INTO Partner (PartnerID, Name, Sector, Industry, Activity) VALUES
(1, 'TechNova', 'Privado', 'Software', 'Application Development'),
(2, 'HealthFirst', 'GOV', 'Medical Devices', 'Research & Development'),
(3, 'EcoGreen', 'ONG', 'Renewable Energy', 'Sustainability Projects');

-- Insert mock data into Class table
INSERT INTO Class (ClassID, ClassCode, Classroom) VALUES
(1, 'CLS101', '01'),
(2, 'CLS102', '02');

-- Insert mock data into Staff table
INSERT INTO Staff (StaffID, Name, Role, Email) VALUES
(1, 'Alice Johnson', 'Coordinator', 'alice.johnson@example.com'),
(2, 'Bob Smith', 'Advisor', 'bob.smith@example.com'),
(3, 'Charlie Lee', 'Manager', 'charlie.lee@example.com');

-- Insert mock data into Module table
INSERT INTO Module (ModuleID, Name, Course, Description, Period, ClassID, FieldOfStudy) VALUES
(1, 'Innovation Lab', 'Ciência da Computação', 'Develop and prototype new technologies', '2025.1', 1, 'Ciência da Computação'),
(2, 'Healthcare Analytics', 'Sistemas de Informação', 'Analyze healthcare systems and data', '2025.4', 2, 'Sistemas de Informação');

-- Insert mock data into Agreement table
INSERT INTO Agreement (AgreementID, Sent, Returned, Signed, Comments) VALUES
(1, TRUE, TRUE, TRUE, 'Fully executed agreement.'),
(2, TRUE, FALSE, FALSE, 'Waiting for partner signature.');

-- Insert mock data into TAPI table
INSERT INTO TAPI (TapiID, Sent, Returned, Signed, Comments) VALUES
(1, TRUE, TRUE, TRUE, 'All TAPI documents signed.'),
(2, TRUE, TRUE, FALSE, 'Pending final signature.');

-- Insert mock data into Contact table
INSERT INTO Contact (ContactID, Name, Email, Phone, Role, PartnerID) VALUES
(1, 'Daniel Adams', 'daniel.adams@technova.com', '555-1234', 'Project Lead', 1),
(2, 'Emily Clark', 'emily.clark@healthfirst.com', '555-5678', 'Research Manager', 2),
(3, 'Frank Wright', 'frank.wright@ecogreen.com', '555-8765', 'Sustainability Officer', 3);

-- Insert mock data into Project table
INSERT INTO Project (ProjectID, Title, Description, Status, Comment, Period, Quarter, Year, NumPrototypes, PartnerID, ModuleID, CoordinatorID, AdvisorID, TapiID, AgreementID) VALUES
(1, 'Smart Home Automation', 'Developing AI-driven home devices', 'Confirmed', 'Project running smoothly', '2025.1', 1, 2025, 3, 1, 1, 1, 2, 1, 1),
(2, 'Remote Health Monitoring', 'IoT-based patient monitoring devices', 'Pending', 'Awaiting partner confirmation', '2025.4', 4, 2025, 2, 2, 2, 2, 3, 2, 2);

-- Insert mock data into ProjectGitHub table
INSERT INTO ProjectGitHub (GitHubID, ProjectID, Link) VALUES
(1, 1, 'https://github.com/technova/smart-home-automation'),
(2, 2, 'https://github.com/healthfirst/remote-health-monitoring');

-- Insert mock data into ProjectContact table
INSERT INTO ProjectContact (ProjectID, ContactID, Role) VALUES
(1, 1, 'Lead Engineer'),
(2, 2, 'Primary Researcher');
