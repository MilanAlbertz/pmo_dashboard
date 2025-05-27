-- Migration to increase PartnerID column length
ALTER TABLE Partner MODIFY COLUMN PartnerID VARCHAR(20);
ALTER TABLE Contact MODIFY COLUMN PartnerID VARCHAR(20);
ALTER TABLE Project MODIFY COLUMN PartnerID VARCHAR(20); 