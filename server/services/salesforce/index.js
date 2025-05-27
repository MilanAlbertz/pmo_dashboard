const fetch = require('node-fetch');
const { obterToken } = require('./auth');

class SalesforceService {
    constructor() {
        if (!process.env.SF_LOGIN_URL) {
            throw new Error('SF_LOGIN_URL environment variable is not set');
        }
        this.loginUrl = process.env.SF_LOGIN_URL;
        console.log('Initialized SalesforceService with URL:', this.loginUrl);
    }

    async query(soql) {
        try {
            console.log('Executing SOQL query:', soql);
            
            const token = await obterToken();
            if (!token) {
                throw new Error('Failed to obtain token');
            }
            console.log('Got valid token');
            
            const queryString = encodeURIComponent(soql);
            const url = `${this.loginUrl}/services/data/v57.0/query?q=${queryString}`;
            console.log('Making Salesforce API request to:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();
            console.log('Raw API response:', responseText);

            if (!response.ok) {
                console.error('Salesforce API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    response: responseText
                });
                throw new Error(`Salesforce query failed: ${response.statusText} - ${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse API response:', e);
                throw new Error('Invalid API response format');
            }

            if (!data.records) {
                console.error('No records array in response:', data);
                throw new Error('Invalid API response format - missing records array');
            }

            console.log('Query successful:', {
                totalSize: data.totalSize,
                done: data.done,
                recordCount: data.records.length
            });

            return data;
        } catch (error) {
            console.error('Error in query:', error);
            throw error;
        }
    }

    async getAccounts(limit = 10) {
        try {
            console.log('Getting accounts from Salesforce...');
            return await this.query(`SELECT Id, Name FROM Account LIMIT ${limit}`);
        } catch (error) {
            console.error('Error in getAccounts:', error);
            throw error;
        }
    }

    async getPartners() {
        try {
            console.log('Getting partners from Salesforce...');
            const query = `
                SELECT 
                    Id, 
                    Name,
                    Type,
                    Ramo__c,
                    Atividade__c,
                    Relacao__c
                FROM Account 
                WHERE Relacao__c INCLUDES ('Parceiro')
                LIMIT 2000

            `;
            console.log('Partners query:', query);
            const result = await this.query(query);
            console.log('Partners result:', {
                totalSize: result.totalSize,
                recordCount: result.records.length,
                firstRecord: result.records[0] ? JSON.stringify(result.records[0]) : null
            });
            return result;
        } catch (error) {
            console.error('Error in getPartners:', error);
            throw error;
        }
    }

    async getContacts() {
        try {
            console.log('Getting contacts from Salesforce...');
            const query = `
                SELECT 
                    Id,
                    Name,
                    Email,
                    Phone,
                    MobilePhone,
                    AccountId
                FROM Contact
                WHERE AccountId IN (
                    SELECT Id 
                    FROM Account 
                    WHERE Relacao__c INCLUDES ('Parceiro')
                )
            `;
            console.log('Contacts query:', query);
            const result = await this.query(query);
            console.log('Contacts result:', {
                totalSize: result.totalSize,
                recordCount: result.records.length,
                firstRecord: result.records[0] ? JSON.stringify(result.records[0]) : null
            });
            return result;
        } catch (error) {
            console.error('Error in getContacts:', error);
            throw error;
        }
    }

    async getProjects() {
        try {
            console.log('Getting projects from Salesforce...');
            const query = `
                SELECT 
                Id, 
                Name,
                AccountId,
                CodigoTurma__c,
                Curso__c,
                Modulo__c,
                StageName,
                Description,
                CoordenadorCurso__c,
                Orientador__c
                FROM Opportunity
                WHERE AccountId IN (
                    SELECT Id 
                    FROM Account 
                    WHERE Relacao__c INCLUDES ('Parceiro')
                ) AND Name != 'Doador-'
                LIMIT 2000
             `;
            console.log('Projects query:', query);
            const result = await this.query(query);
            
            // Add more detailed logging
            console.log('Projects query details:', {
                totalSize: result.totalSize,
                recordCount: result.records.length,
                done: result.done,
                nextRecordsUrl: result.nextRecordsUrl,
                firstRecord: result.records[0] ? JSON.stringify(result.records[0]) : null
            });

            if (result.totalSize > 2000) {
                console.warn('Warning: Query returned more than 2000 records. Some records may be missing.');
            }

            return result;
        } catch (error) {
            console.error('Error in getProjects:', error);
            // Add more detailed error information
            if (error.message.includes('timeout')) {
                console.error('Query timed out - consider implementing pagination');
            }
            throw error;
        }
    }

    async getLeads() {
        try {
            console.log('Getting leads from Salesforce...');
            const query = `
                SELECT 
                    Id,
                    Name,
                    Phone,
                    Email,
                    Company
                FROM Lead
                WHERE RecordTypeId = '012Hs000000yqRKIAY'
                LIMIT 2000
            `;
            console.log('Leads query:', query);
            const result = await this.query(query);
            console.log('Leads result:', {
                totalSize: result.totalSize,
                recordCount: result.records.length,
                firstRecord: result.records[0] ? JSON.stringify(result.records[0]) : null
            });
            return result;
        } catch (error) {
            console.error('Error in getLeads:', error);
            throw error;
        }
    }

    async getCourses() {
        try {
            console.log('Getting course picklist values from Salesforce...');
            const token = await obterToken();
            if (!token) {
                throw new Error('Failed to obtain token');
            }

            // Query the field metadata for Curso__c
            const url = `${this.loginUrl}/services/data/v57.0/sobjects/Opportunity/describe`;
            console.log('Making Salesforce API request to:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get field metadata: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Find the Curso__c field in the fields array
            const cursoField = data.fields.find(field => field.name === 'Curso__c');
            
            if (!cursoField) {
                throw new Error('Curso__c field not found in Opportunity object');
            }

            if (!cursoField.picklistValues) {
                throw new Error('Curso__c is not a picklist field');
            }

            // Extract the picklist values
            const picklistValues = cursoField.picklistValues.map(value => ({
                label: value.label,
                value: value.value,
                active: value.active,
                defaultValue: value.defaultValue
            }));

            console.log('Course picklist values:', {
                totalSize: picklistValues.length,
                values: picklistValues
            });

            return {
                totalSize: picklistValues.length,
                records: picklistValues
            };
        } catch (error) {
            console.error('Error in getCourses:', error);
            throw error;
        }
    }

    async getModuleNames(course = null) {
        try {
            console.log('Getting unique module names from Salesforce...', course ? `for course: ${course}` : 'for all courses');
            const query = `
                SELECT Modulo__c, Curso__c
                FROM Opportunity
                WHERE Modulo__c != null
                AND AccountId IN (
                    SELECT Id 
                    FROM Account 
                    WHERE Relacao__c INCLUDES ('Parceiro')
                )
                ${course ? `AND Curso__c = '${course.replace(/'/g, "\\'")}'` : ''}
                ORDER BY Modulo__c
            `;
            console.log('Module names query:', query);
            const result = await this.query(query);
            
            // Extract just the module names from the records and remove duplicates
            const moduleNames = [...new Set(result.records
                .map(record => record.Modulo__c)
                .filter(module => module))]; // Remove any null values
            
            console.log('Module names result:', {
                totalSize: moduleNames.length,
                moduleNames: moduleNames,
                course: course
            });
            
            return {
                totalSize: moduleNames.length,
                records: moduleNames,
                course: course
            };
        } catch (error) {
            console.error('Error in getModuleNames:', error);
            throw error;
        }
    }

    async getModulePicklistValues() {
        try {
            console.log('Getting module picklist values from Salesforce...');
            const token = await obterToken();
            if (!token) {
                throw new Error('Failed to obtain token');
            }

            // Query the field metadata for Modulo__c
            const url = `${this.loginUrl}/services/data/v57.0/sobjects/Opportunity/describe`;
            console.log('Making Salesforce API request to:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get field metadata: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Find the Modulo__c field in the fields array
            const moduloField = data.fields.find(field => field.name === 'Modulo__c');
            
            if (!moduloField) {
                throw new Error('Modulo__c field not found in Opportunity object');
            }

            if (!moduloField.picklistValues) {
                throw new Error('Modulo__c is not a picklist field');
            }

            // Extract the picklist values
            const picklistValues = moduloField.picklistValues.map(value => ({
                label: value.label,
                value: value.value,
                active: value.active,
                defaultValue: value.defaultValue
            }));

            console.log('Module picklist values:', {
                totalSize: picklistValues.length,
                values: picklistValues
            });

            return {
                totalSize: picklistValues.length,
                records: picklistValues
            };
        } catch (error) {
            console.error('Error in getModulePicklistValues:', error);
            throw error;
        }
    }

    // Add more Salesforce-specific methods here
}

// Create instance only if environment variables are set
let salesforceService = null;
try {
    salesforceService = new SalesforceService();
} catch (error) {
    console.error('Failed to initialize Salesforce service:', error.message);
}

module.exports = salesforceService; 