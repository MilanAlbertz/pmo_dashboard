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
                    Name
                FROM Account 
                WHERE Relacao__c = 'Parceiro'
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