debugger; // First line breakpoint
require('dotenv').config();
const express = require('express')
// const jsforce = require('jsforce');
const axios = require('axios');
const app = express()
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const salesforceService = require('./services/salesforce/index');

// MySQL connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'Milan',
  password: process.env.DB_PASSWORD || 'B@iley2003',
  database: process.env.DB_NAME || 'pmo_office_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// Set charset for every new connection
pool.on('connection', (connection) => {
  connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Salesforce configuration
const sfConfig = {
  loginUrl: process.env.SF_LOGIN_URL || 'https://test.salesforce.com',
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET
};

const fetch = require('node-fetch');

// Add token cache
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

async function obterToken() {
  // Check if we have a valid cached token
  if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }
  console.log('Fetching token...');
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', sfConfig.clientId);
  params.append('client_secret', sfConfig.clientSecret);
  console.log('Params:', params);

  try {
    const response = await fetch(`${sfConfig.loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to obtain token');
    }

    // Cache the token with expiration
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - 60000 // Subtract 1 minute for safety
    };

    return data.access_token;
  } catch (error) {
    console.error('Error obtaining token:', error);
    throw error;
  }
}

// Keep the connection status variable
let sfConnected = true;

// Comment out the connectToSalesforce function
/*
const connectToSalesforce = async () => {
  try {
    console.log('\n=== Salesforce Connection Details ===');
    console.log(`Login URL: ${oauth2.loginUrl}`);
    console.log(`Client ID: ${sfConfig.clientId ? '✓ Present' : '✗ Missing'}`);
    console.log(`Client Secret: ${sfConfig.clientSecret ? '✓ Present' : '✗ Missing'}`);
    console.log(`Redirect URI: ${oauth2.redirectUri}`);
    console.log('===================================\n');

    try {
        // Get the authorization URL
        const authUrl = oauth2.getAuthorizationUrl({});
        console.log('Authorization URL:', authUrl);
        
        // You'll need to handle the OAuth callback
        app.get('/oauth/callback', async (req, res) => {
            const code = req.query.code;
            console.log(code);
            try {
                const accessToken = await oauth2.requestToken(code);
                console.log(accessToken);
                conn.accessToken = accessToken;
                sfConnected = true;
                res.send('Connected to Salesforce successfully!');
            } catch (error) {
                console.error('Error getting access token:', error);
                res.status(500).send('Failed to connect to Salesforce');
            }
        });

        console.log('OAuth setup completed successfully');
        return true;
    } catch (error) {
        console.log('Authentication setup failed with error:', error.message);
        throw error;
    }
  } catch (err) {
    console.error('\n❌ Salesforce connection error:', err.message);
    sfConnected = false;
    return false;
  }
};
*/

// Comment out token refresh
/*
const refreshSalesforceToken = async () => {
  console.log('Refreshing Salesforce token...');
  return connectToSalesforce();
};

// Initialize Salesforce connection
connectToSalesforce();
*/

// Comment out or simplify the connection check middleware
const checkSalesforceConnection = (req, res, next) => {
  if (!sfConnected) {
    return res.status(503).json({ 
      error: 'Salesforce connection not established',
      message: 'The server is not connected to Salesforce. Please check server logs.'
    });
  }
  next();
};

// Add CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:9995'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Content-Type', 'application/json; charset=utf-8');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Add this line to parse JSON bodies
app.use(express.json());

// Initialize empty prospections array
let prospections = [];

app.get("/api", (req, res) => {
    res.json({"users": ["userOne", "userTwo", "userThree"]})
})

// Check if user is authenticated
app.get('/api/auth/check', (req, res) => {
  const token = req.cookies.authToken;
  if (token === 'test-token') {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Simple check for test credentials
  if (email === 'test.test@test.nl' && password === 'test123') {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true });
});

// Prospection endpoints
// Get all prospections
app.get('/api/prospections', (req, res) => {
  res.json(prospections);
});

// Create new prospection
app.post('/api/prospections', (req, res) => {
  try {
    const {
      fieldOfStudy,
      classcode,
      partner,
      year,
      module,
      period,
      atelie,
      supervisor,
      comment
    } = req.body;

    // Create new prospection ID based on the pattern in your mock data
    const newId = `${year || new Date().getFullYear()}-${(fieldOfStudy || '').replace(' ', '')}-T${String(prospections.length + 1).padStart(2, '0')}`;

    const newProspection = {
      id: newId,
      fieldOfStudy: fieldOfStudy || '',
      classcode: classcode || '',
      partner: partner || '',
      year: year || '',
      module: module || '',
      period: period || '',
      atelie: atelie || '',
      supervisor: supervisor || '',
      comment: comment || ''
    };

    // Add to prospections array
    prospections.push(newProspection);

    res.status(201).json({
      success: true,
      data: newProspection
    });
  } catch (error) {
    console.error('Error creating prospection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prospection'
    });
  }
});

// Get specific prospection
app.get('/api/prospections/:id', (req, res) => {
  const prospection = prospections.find(p => p.id === req.params.id);
  if (!prospection) {
    return res.status(404).json({ message: 'Prospection not found' });
  }
  res.json(prospection);
});

// Update prospection
app.put('/api/prospections/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  console.log('Received update request for ID:', id);
  console.log('Update data:', updateData);

  try {
    // Find the prospection to update
    const index = prospections.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Prospection not found' 
      });
    }

    // Update the prospection
    prospections[index] = {
      ...prospections[index],
      ...updateData
    };

    res.json({
      success: true,
      data: prospections[index]
    });
  } catch (error) {
    console.error('Error updating prospection:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update prospection',
      error: error.message 
    });
  }
});

// Salesforce endpoints
app.get('/api/salesforce/accounts', async (req, res) => {
  try {
    if (!salesforceService) {
      return res.status(503).json({ 
        error: 'Salesforce service is not available',
        message: 'The Salesforce service is not properly configured. Please check your environment variables.'
      });
    }
    const result = await salesforceService.getAccounts();
    res.json({
      success: true,
      count: result.totalSize,
      records: result.records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salesforce/partners', async (req, res) => {
  try {
    if (!salesforceService) {
      return res.status(503).json({ 
        error: 'Salesforce service is not available',
        message: 'The Salesforce service is not properly configured. Please check your environment variables.'
      });
    }
    const result = await salesforceService.getPartners();
    res.json({
      success: true,
      count: result.totalSize,
      records: result.records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salesforce/contacts', async (req, res) => {
  try {
    if (!salesforceService) {
      return res.status(503).json({ 
        error: 'Salesforce service is not available',
        message: 'The Salesforce service is not properly configured. Please check your environment variables.'
      });
    }
    const result = await salesforceService.getContacts();
    res.json({
      success: true,
      count: result.totalSize,
      records: result.records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salesforce/projects', async (req, res) => {
  try {
    console.log('Received request for Salesforce projects');
    
    if (!salesforceService) {
      console.error('Salesforce service is not available');
      return res.status(503).json({ 
        error: 'Salesforce service is not available',
        message: 'The Salesforce service is not properly configured. Please check your environment variables.'
      });
    }
    
    console.log('Fetching projects from Salesforce...');
    const result = await salesforceService.getProjects();
    
    console.log('Received projects from Salesforce:', {
      totalSize: result.totalSize,
      recordCount: result.records.length,
      firstRecord: result.records[0] ? JSON.stringify(result.records[0]) : null,
      lastRecord: result.records[result.records.length - 1] ? JSON.stringify(result.records[result.records.length - 1]) : null
    });

    const response = {
      success: true,
      count: result.totalSize,
      records: result.records
    };
    
    console.log('Sending response to client:', {
      success: response.success,
      count: response.count,
      recordCount: response.records.length
    });
    
    res.json(response);
  } catch (err) {
    console.error('Error in /api/salesforce/projects:', err);
    res.status(500).json({ error: err.message });
  }
});

// Modify the status endpoint to be simpler
app.get('/api/salesforce/status', (req, res) => {
  res.json({
    connected: sfConnected
  });
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      title,
      description,
      status,
      period,
      quarter,
      year,
      numPrototypes,
      partnerId,
      moduleId,
      advisorId,
      comment,
      partner,
      sector
    } = req.body;

    console.log('Received update request:', {
      projectId,
      partnerId,
      status,
      title,
      moduleId,
      advisorId,
      partner,
      sector
    });

    // First, get the current project data
    const [currentProject] = await pool.query(
      'SELECT * FROM Project WHERE ProjectID = ?',
      [projectId]
    );

    if (!currentProject.length) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only update partner-related fields if partner is being changed
    const isPartnerChange = partnerId !== undefined && partnerId !== currentProject[0].PartnerID;

    // Prepare update values - keep existing values for non-partner fields if not explicitly provided
    const updateValues = [
      title !== undefined ? title : currentProject[0].Title,
      description !== undefined ? description : currentProject[0].Description,
      status !== undefined ? status : currentProject[0].Status,
      period !== undefined ? period : currentProject[0].Period,
      quarter !== undefined ? quarter : currentProject[0].Quarter,
      year !== undefined ? year : currentProject[0].Year,
      numPrototypes !== undefined ? numPrototypes : currentProject[0].NumPrototypes,
      partnerId !== undefined ? partnerId : currentProject[0].PartnerID,
      moduleId !== undefined ? moduleId : currentProject[0].ModuleID,
      advisorId !== undefined ? advisorId : currentProject[0].AdvisorID,
      comment !== undefined ? comment : currentProject[0].Comment,
      projectId
    ];

    console.log('Update values:', updateValues);

    const [result] = await pool.execute(
      `UPDATE Project 
       SET Title = ?, Description = ?, Status = ?, Period = ?, Quarter = ?, Year = ?, 
           NumPrototypes = ?, PartnerID = ?, ModuleID = ?, AdvisorID = ?, Comment = ?
       WHERE ProjectID = ?`,
      updateValues
    );

    console.log('Update result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// Update module endpoint
app.put('/api/modules/:id', async (req, res) => {
  try {
    const moduleId = req.params.id;
    const updateData = req.body;
    
    // Update the module in the database
    const [result] = await pool.query(
      `UPDATE Module 
       SET Name = ?, 
           Course = ?, 
           Description = ?, 
           Period = ?, 
           ClassID = ?, 
           FieldOfStudy = ?
       WHERE ModuleID = ?`,
      [
        updateData.name,
        updateData.course,
        updateData.description,
        updateData.period,
        updateData.classId,
        updateData.fieldOfStudy,
        moduleId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found' 
      });
    }

    res.json({
      success: true,
      message: 'Module updated successfully'
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update module',
      error: error.message 
    });
  }
});

// Update test endpoints to use the correct column names
app.get('/api/test/projects', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Project ORDER BY ProjectID DESC LIMIT 1');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching test project:', error);
        res.status(500).json({ error: 'Failed to fetch test project' });
    }
});

app.get('/api/test/contacts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Contact ORDER BY ContactID DESC LIMIT 1');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching test contact:', error);
        res.status(500).json({ error: 'Failed to fetch test contact' });
    }
});

app.get('/api/test/staff', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Staff ORDER BY StaffID DESC LIMIT 1');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching test staff:', error);
        res.status(500).json({ error: 'Failed to fetch test staff' });
    }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.ProjectID as Id,
                p.Title as Name,
                p.Status,
                p.PartnerID as AccountId,
                pt.Name as partnerName,
                p.Year as year,
                p.Quarter as quarter,
                CASE 
                    WHEN p.Year IS NOT NULL AND p.Quarter IS NOT NULL 
                    THEN CONCAT(p.Year, '.', p.Quarter)
                    ELSE NULL 
                END as Period,
                c.ClassCode as classCode,
                m.Name as module,
                m.Course as course,
                p.Description,
                p.Comment,
                p.NumPrototypes,
                p.CoordinatorID,
                p.AdvisorID
            FROM Project p
            LEFT JOIN Partner pt ON p.PartnerID = pt.PartnerID
            LEFT JOIN Module m ON p.ModuleID = m.ModuleID
            LEFT JOIN Class c ON m.ClassID = c.ClassID
            ORDER BY p.Year DESC, p.Quarter DESC, p.Title ASC
        `);
        
        console.log('Fetched projects:', {
            count: rows.length,
            firstRecord: rows[0] ? JSON.stringify(rows[0]) : null
        });
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get project statistics
app.get('/api/statistics', async (req, res) => {
    try {
        // Total projects (Projeto, Envio de protótipos, Concluido)
        const [totalProjects] = await pool.query(`
            SELECT COUNT(*) as count FROM Project WHERE Status IN ('Projeto', 'Envio de protótipos', 'Concluido')
        `);

        // Current projects (only Projeto)
        const [currentProjects] = await pool.query(`
            SELECT COUNT(*) as count FROM Project WHERE Status = 'Projeto'
        `);

        // Projects in QA (Envio de protótipos)
        const [projectsInQA] = await pool.query(`
            SELECT COUNT(*) as count FROM Project WHERE Status = 'Envio de protótipos'
        `);

        // Total amount of project partners (distinct PartnerID linked to a project)
        const [totalProjectPartners] = await pool.query(`
            SELECT COUNT(DISTINCT PartnerID) as count FROM Project WHERE PartnerID IS NOT NULL
        `);

        // Pre-approved projects (Envio dos documentos, TAPI, Pré Projeto)
        const [preApprovedProjects] = await pool.query(`
            SELECT COUNT(*) as count FROM Project WHERE Status IN ('Envio dos documentos', 'TAPI', 'Pré Projeto')
        `);

        // Initiatives (Pré seleção EP, Pré análise de aderência docentes)
        const [initiatives] = await pool.query(`
            SELECT COUNT(*) as count FROM Project WHERE Status IN ('Pré seleção EP', 'Pré análise de aderência docentes')
        `);

        // Total partners (all in Partner table)
        const [totalPartners] = await pool.query(`
            SELECT COUNT(*) as count FROM Partner
        `);

        // Total leads (all in Leads table)
        const [totalLeads] = await pool.query(`
            SELECT COUNT(*) as count FROM Leads
        `);

        res.json({
            totalProjects: totalProjects[0].count,
            currentProjects: currentProjects[0].count,
            projectsInQA: projectsInQA[0].count,
            totalProjectPartners: totalProjectPartners[0].count,
            preApprovedProjects: preApprovedProjects[0].count,
            initiatives: initiatives[0].count,
            totalPartners: totalPartners[0].count,
            totalLeads: totalLeads[0].count
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
    }
});

// Get partners from database
app.get('/api/partners', async (req, res) => {
    try {
        const [partners] = await pool.query('SELECT * FROM Partner');
        res.json({ partners });
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

// Get contacts from database
app.get('/api/contacts', async (req, res) => {
    try {
        const [contacts] = await pool.query('SELECT * FROM Contact');
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Sync Salesforce data to database
app.post('/api/sync/salesforce', async (req, res) => {
    try {
        if (!salesforceService) {
            console.error('Salesforce service is not available');
            return res.status(503).json({ 
                error: 'Salesforce service is not available',
                message: 'The Salesforce service is not properly configured.'
            });
        }

        console.log('Starting Salesforce sync...');

        // Get data from Salesforce
        console.log('Fetching partners from Salesforce...');
        const partnersResult = await salesforceService.getPartners();
        console.log('Partners fetched:', partnersResult.records.length);

        console.log('Fetching contacts from Salesforce...');
        const contactsResult = await salesforceService.getContacts();
        console.log('Contacts fetched:', contactsResult.records.length);

        console.log('Fetching projects from Salesforce...');
        const projectsResult = await salesforceService.getProjects();
        console.log('Projects fetched:', projectsResult.records.length);

        console.log('Fetching leads from Salesforce...');
        const leadsResult = await salesforceService.getLeads();
        console.log('Leads fetched:', leadsResult.records.length);

        const partners = partnersResult.records;
        const contacts = contactsResult.records;
        const projects = projectsResult.records;
        const leads = leadsResult.records;

        // Start a transaction
        console.log('Starting database transaction...');
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Track changes
            const changes = {
                partners: {
                    inserted: [],
                    updated: [],
                    errors: []
                },
                contacts: {
                    inserted: [],
                    updated: [],
                    errors: []
                },
                projects: {
                    inserted: [],
                    updated: [],
                    errors: []
                },
                leads: {
                    inserted: [],
                    updated: [],
                    errors: []
                }
            };

            // First, insert all partners
            console.log('Inserting partners...');
            for (const partner of partners) {
                try {
                    console.log('Processing partner:', partner.Id, partner.Name);
                    // Check if partner exists and get current data
                    const [existingPartner] = await connection.query(
                        'SELECT PartnerID, Name, Sector, Industry, Activity FROM Partner WHERE PartnerID = ?',
                        [partner.Id]
                    );

                    const isNew = existingPartner.length === 0;
                    const hasChanges = isNew || 
                        existingPartner[0].Name !== partner.Name ||
                        existingPartner[0].Sector !== partner.Type ||
                        existingPartner[0].Industry !== partner.Ramo__c ||
                        existingPartner[0].Activity !== partner.Atividade__c;

                    if (hasChanges) {
                        await connection.query(
                            'INSERT INTO Partner (PartnerID, Name, Sector, Industry, Activity) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Name = VALUES(Name), Sector = VALUES(Sector), Industry = VALUES(Industry), Activity = VALUES(Activity)',
                            [
                                partner.Id,
                                partner.Name,
                                partner.Type,
                                partner.Ramo__c,
                                partner.Atividade__c
                            ]
                        );

                        if (isNew) {
                            changes.partners.inserted.push({
                                id: partner.Id,
                                name: partner.Name
                            });
                        } else {
                            changes.partners.updated.push({
                                id: partner.Id,
                                name: partner.Name
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing partner ${partner.Id}:`, error);
                    changes.partners.errors.push({
                        id: partner.Id,
                        name: partner.Name,
                        error: error.message
                    });
                }
            }

            // Then, insert contacts with error handling for foreign key constraints
            console.log('Inserting contacts...');
            for (const contact of contacts) {
                try {
                    console.log('Processing contact:', contact.Id, contact.Name);
                    // First check if the partner exists
                    const [partnerRows] = await connection.query(
                        'SELECT PartnerID, Name FROM Partner WHERE PartnerID = ?',
                        [contact.AccountId]
                    );

                    if (partnerRows.length === 0) {
                        console.warn(`Partner ${contact.AccountId} not found for contact ${contact.Id}`);
                        // Try to find the partner in the Salesforce data
                        const partner = partners.find(p => p.Id === contact.AccountId);
                        changes.contacts.errors.push({
                            id: contact.Id,
                            name: contact.Name,
                            error: 'Partner not found',
                            partnerId: contact.AccountId,
                            partnerName: partner ? partner.Name : 'Unknown',
                            email: contact.Email,
                            phone: contact.Phone || contact.MobilePhone
                        });
                        continue;
                    }

                    // Check if contact exists and get current data
                    const [existingContact] = await connection.query(
                        'SELECT ContactID, Name, Email, Phone, Role, PartnerID FROM Contact WHERE ContactID = ?',
                        [contact.Id]
                    );

                    const isNew = existingContact.length === 0;
                    const hasChanges = isNew || 
                        existingContact[0].Name !== contact.Name ||
                        existingContact[0].Email !== contact.Email ||
                        existingContact[0].Phone !== (contact.Phone || contact.MobilePhone) ||
                        existingContact[0].PartnerID !== contact.AccountId;

                    if (hasChanges) {
                        await connection.query(
                            'INSERT INTO Contact (ContactID, Name, Email, Phone, Role, PartnerID) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Name = VALUES(Name), Email = VALUES(Email), Phone = VALUES(Phone), Role = VALUES(Role), PartnerID = VALUES(PartnerID)',
                            [
                                contact.Id,
                                contact.Name,
                                contact.Email,
                                contact.Phone || contact.MobilePhone,
                                'Partner',
                                contact.AccountId
                            ]
                        );

                        if (isNew) {
                            changes.contacts.inserted.push({
                                id: contact.Id,
                                name: contact.Name,
                                email: contact.Email,
                                phone: contact.Phone || contact.MobilePhone,
                                partnerId: contact.AccountId,
                                partnerName: partnerRows[0].Name
                            });
                        } else {
                            changes.contacts.updated.push({
                                id: contact.Id,
                                name: contact.Name,
                                email: contact.Email,
                                phone: contact.Phone || contact.MobilePhone,
                                partnerId: contact.AccountId,
                                partnerName: partnerRows[0].Name
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing contact ${contact.Id}:`, error);
                    changes.contacts.errors.push({
                        id: contact.Id,
                        name: contact.Name,
                        error: error.message,
                        email: contact.Email,
                        phone: contact.Phone || contact.MobilePhone,
                        partnerId: contact.AccountId
                    });
                }
            }

            // Finally, insert projects
            console.log('Inserting projects...');
            for (const project of projects) {
                try {
                    console.log('Processing project:', project.Id, project.Name);
                    // First check if the partner exists
                    const [partnerRows] = await connection.query(
                        'SELECT PartnerID, Name FROM Partner WHERE PartnerID = ?',
                        [project.AccountId]
                    );

                    if (partnerRows.length === 0) {
                        console.warn(`Partner ${project.AccountId} not found for project ${project.Id}`);
                        // Try to find the partner in the Salesforce data
                        const partner = partners.find(p => p.Id === project.AccountId);
                        changes.projects.errors.push({
                            id: project.Id,
                            name: project.Name,
                            error: 'Partner not found',
                            partnerId: project.AccountId,
                            partnerName: partner ? partner.Name : 'Unknown'
                        });
                        continue;
                    }

                    // Check if project exists and get current data
                    const [existingProject] = await connection.query(
                        'SELECT ProjectID, Title, PartnerID, Description, Quarter, Year, ModuleID, Status FROM Project WHERE ProjectID = ?',
                        [project.Id]
                    );

                    // Extract year and quarter from class code
                    let year = null;
                    let quarter = null;
                    let classCode = project.CodigoTurma__c || null;
                    if (classCode) {
                        const match = classCode.match(/^(\d{4})-(\d)([AB])-T\d+$/);
                        if (match) {
                            year = parseInt(match[1]);
                            const semester = match[2];
                            const part = match[3];
                            // Convert semester and part to quarter (1A=1, 1B=2, 2A=3, 2B=4)
                            quarter = (parseInt(semester) - 1) * 2 + (part === 'A' ? 1 : 2);
                        }
                    }

                    // Get or create module
                    let moduleId = null;
                    if (project.Modulo__c) {
                        // Extract period from class code (e.g., "2024-1A-T08" -> "2024.1")
                        let modulePeriod = null;
                        if (classCode) {
                            const match = classCode.match(/^(\d{4})-(\d)([AB])-T\d+$/);
                            if (match) {
                                const year = match[1];
                                const semester = match[2];
                                modulePeriod = `${year}.${semester}`;
                            }
                        }

                        // First, get or create the Class record
                        let classId = null;
                        if (classCode) {
                            const [existingClass] = await connection.query(
                                'SELECT ClassID FROM Class WHERE ClassCode = ?',
                                [classCode]
                            );

                            if (existingClass.length > 0) {
                                classId = existingClass[0].ClassID;
                            } else {
                                // Create new class if it doesn't exist
                                const [newClass] = await connection.query(
                                    'INSERT INTO Class (ClassCode) VALUES (?)',
                                    [classCode]
                                );
                                classId = newClass.insertId;
                            }
                        }

                        // Then check if module exists with both name and period
                        const [existingModule] = await connection.query(
                            'SELECT ModuleID, ClassID, Course FROM Module WHERE Name = ? AND Period = ?',
                            [project.Modulo__c, modulePeriod]
                        );

                        if (existingModule.length > 0) {
                            moduleId = existingModule[0].ModuleID;
                            // Only update the module's ClassID and Course if they have changed
                            if (existingModule[0].ClassID !== classId || existingModule[0].Course !== project.Curso__c) {
                                await connection.query(
                                    'UPDATE Module SET ClassID = ?, Course = ? WHERE ModuleID = ?',
                                    [classId, project.Curso__c, moduleId]
                                );
                            }
                        } else {
                            // Create new module if it doesn't exist
                            const [newModule] = await connection.query(
                                'INSERT INTO Module (Name, Period, ClassID, Course) VALUES (?, ?, ?, ?)',
                                [project.Modulo__c, modulePeriod, classId, project.Curso__c]
                            );
                            moduleId = newModule.insertId;
                        }
                    } else {
                        // Create a default module for projects without a module
                        const defaultModuleName = 'Default Module';
                        const [existingDefaultModule] = await connection.query(
                            'SELECT ModuleID FROM Module WHERE Name = ? AND Period IS NULL',
                            [defaultModuleName]
                        );

                        if (existingDefaultModule.length > 0) {
                            moduleId = existingDefaultModule[0].ModuleID;
                        } else {
                            // Create new default module if it doesn't exist
                            const [newModule] = await connection.query(
                                'INSERT INTO Module (Name, Period) VALUES (?, ?)',
                                [defaultModuleName, null]
                            );
                            moduleId = newModule.insertId;
                        }
                    }

                    // Clean up project name by removing 'Parceiro Projeto-' prefix if present
                    let projectName = project.Name || '';
                    if (projectName.startsWith('Parceiro Projeto-')) {
                        projectName = projectName.replace(/^Parceiro Projeto-/, '').trim();
                    }

                    const isNew = existingProject.length === 0;
                    const hasChanges = isNew || 
                        existingProject[0].Title !== projectName ||
                        existingProject[0].PartnerID !== project.AccountId ||
                        existingProject[0].Description !== (project.Description || '') ||
                        existingProject[0].Quarter !== quarter ||
                        existingProject[0].Year !== year ||
                        existingProject[0].Status !== (project.StageName || '');

                    if (hasChanges) {
                        console.log(`Project ${project.Id} changes:`, {
                            title: { old: existingProject[0]?.Title, new: projectName, changed: existingProject[0]?.Title !== projectName },
                            partnerId: { old: existingProject[0]?.PartnerID, new: project.AccountId, changed: existingProject[0]?.PartnerID !== project.AccountId },
                            description: { old: existingProject[0]?.Description, new: project.Description || '', changed: existingProject[0]?.Description !== (project.Description || '') },
                            quarter: { old: existingProject[0]?.Quarter, new: quarter, changed: existingProject[0]?.Quarter !== quarter },
                            year: { old: existingProject[0]?.Year, new: year, changed: existingProject[0]?.Year !== year },
                            status: { old: existingProject[0]?.Status, new: project.StageName || '', changed: existingProject[0]?.Status !== (project.StageName || '') }
                        });

                        // Insert or update project
                        await connection.query(
                            'INSERT INTO Project (ProjectID, Title, PartnerID, Description, Quarter, Year, ModuleID, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Title = VALUES(Title), PartnerID = VALUES(PartnerID), Description = VALUES(Description), Quarter = VALUES(Quarter), Year = VALUES(Year), ModuleID = VALUES(ModuleID), Status = VALUES(Status)',
                            [
                                project.Id,
                                projectName,
                                project.AccountId,
                                project.Description || '',
                                quarter,
                                year,
                                moduleId,
                                project.StageName || ''
                            ]
                        );

                        if (isNew) {
                            changes.projects.inserted.push({
                                id: project.Id,
                                name: project.Name,
                                partnerId: project.AccountId,
                                partnerName: partnerRows[0].Name,
                                classCode: project.CodigoTurma__c,
                                year: year,
                                quarter: quarter
                            });
                        } else {
                            changes.projects.updated.push({
                                id: project.Id,
                                name: project.Name,
                                partnerId: project.AccountId,
                                partnerName: partnerRows[0].Name,
                                classCode: project.CodigoTurma__c,
                                year: year,
                                quarter: quarter
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing project ${project.Id}:`, error);
                    changes.projects.errors.push({
                        id: project.Id,
                        name: project.Name,
                        error: error.message,
                        partnerId: project.AccountId
                    });
                }
            }

            // Insert leads
            console.log('Inserting leads...');
            for (const lead of leads) {
                try {
                    const [existingLead] = await connection.query(
                        'SELECT Name, Phone, Email, Company FROM Leads WHERE LeadID = ?',
                        [lead.Id]
                    );
                    const isNew = existingLead.length === 0;
                    let hasChanges = isNew;
                    if (!isNew) {
                        hasChanges = existingLead[0].Name !== lead.Name ||
                            existingLead[0].Phone !== lead.Phone ||
                            existingLead[0].Email !== lead.Email ||
                            existingLead[0].Company !== lead.Company;
                    }
                    if (hasChanges) {
                        await connection.query(
                            'INSERT INTO Leads (LeadID, Name, Phone, Email, Company) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Name = VALUES(Name), Phone = VALUES(Phone), Email = VALUES(Email), Company = VALUES(Company)',
                            [
                                lead.Id,
                                lead.Name,
                                lead.Phone,
                                lead.Email,
                                lead.Company
                            ]
                        );
                        if (isNew) {
                            changes.leads.inserted.push({
                                id: lead.Id,
                                name: lead.Name,
                                phone: lead.Phone,
                                email: lead.Email,
                                company: lead.Company
                            });
                        } else {
                            changes.leads.updated.push({
                                id: lead.Id,
                                name: lead.Name,
                                phone: lead.Phone,
                                email: lead.Email,
                                company: lead.Company
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing lead ${lead.Id}:`, error);
                    changes.leads.errors.push({
                        id: lead.Id,
                        name: lead.Name,
                        phone: lead.Phone,
                        email: lead.Email,
                        company: lead.Company,
                        error: error.message
                    });
                }
            }

            // Commit the transaction
            console.log('Committing transaction...');
            await connection.commit();
            connection.release();

            console.log('Sync completed successfully');
            res.json({
                success: true,
                stats: {
                    partners: {
                        total: partners.length,
                        inserted: changes.partners.inserted.length,
                        updated: changes.partners.updated.length,
                        errors: changes.partners.errors.length
                    },
                    contacts: {
                        total: contacts.length,
                        inserted: changes.contacts.inserted.length,
                        updated: changes.contacts.updated.length,
                        errors: changes.contacts.errors.length
                    },
                    projects: {
                        total: projects.length,
                        inserted: changes.projects.inserted.length,
                        updated: changes.projects.updated.length,
                        errors: changes.projects.errors.length
                    },
                    leads: {
                        total: leads.length,
                        inserted: changes.leads.inserted.length,
                        updated: changes.leads.updated.length,
                        errors: changes.leads.errors.length
                    }
                },
                changes
            });
        } catch (error) {
            // Rollback in case of error
            console.error('Error during database operations:', error);
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error syncing Salesforce data:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            error: 'Failed to sync Salesforce data',
            message: error.message,
            details: error.stack
        });
    }
});

// Get single project details
app.get('/api/projects/:id', async (req, res) => {
  try {
    console.log('Fetching project details for ID:', req.params.id);
    
    const [rows] = await pool.query(`
      SELECT 
        p.ProjectID as Id,
        p.Title,
        p.Status,
        p.PartnerID as AccountId,
        pt.Name as partnerName,
        pt.Sector as sector,
        pt.Industry as industry,
        pt.Activity as activity,
        p.Year as year,
        p.Quarter as quarter,
        CASE 
          WHEN p.Year IS NOT NULL AND p.Quarter IS NOT NULL 
          THEN CONCAT(p.Year, '.', p.Quarter)
          ELSE NULL 
        END as Period,
        c.ClassCode as classCode,
        m.Name as module,
        m.Course as course,
        p.Description,
        p.Comment,
        p.NumPrototypes,
        p.CoordinatorID,
        p.AdvisorID
      FROM Project p
      LEFT JOIN Partner pt ON p.PartnerID = pt.PartnerID
      LEFT JOIN Module m ON p.ModuleID = m.ModuleID
      LEFT JOIN Class c ON m.ClassID = c.ClassID
      WHERE p.ProjectID = ?
    `, [req.params.id]);

    console.log('Query result:', {
      found: rows.length > 0,
      projectId: req.params.id,
      firstRow: rows[0] ? JSON.stringify(rows[0]) : null
    });

    if (rows.length === 0) {
      console.log('No project found with ID:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = rows[0];

    // Fetch contacts for this partner
    const [contacts] = await pool.query(
      'SELECT Name as name, Email as email, Phone as phone FROM Contact WHERE PartnerID = ?',
      [project.AccountId]
    );
    project.contacts = contacts;

    res.json(project);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Add endpoint to get leads from Salesforce
app.get('/api/salesforce/leads', async (req, res) => {
    try {
        if (!salesforceService) {
            return res.status(503).json({
                error: 'Salesforce service is not available',
                message: 'The Salesforce service is not properly configured. Please check your environment variables.'
            });
        }
        const result = await salesforceService.getLeads();
        res.json({
            success: true,
            count: result.totalSize,
            records: result.records
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add endpoint to get leads from the database
app.get('/api/leads', async (req, res) => {
    try {
        const [leads] = await pool.query('SELECT * FROM Leads');
        res.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Get all prospection cards
app.get('/api/prospection-cards', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ProspectionCardID,
        Name,
        Course,
        Description,
        Year,
        Period,
        ClassCode,
        Status,
        Advisor,
        Classroom,
        PartnerName
      FROM ProspectionCards
      ORDER BY Year DESC, Period ASC, Course ASC
    `);
    
    console.log('Fetched prospection cards:', {
      count: rows.length,
      firstRecord: rows[0] ? JSON.stringify(rows[0]) : null
    });
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching prospection cards:', error);
    res.status(500).json({ error: 'Failed to fetch prospection cards' });
  }
});

// Add endpoint to get course picklist values from Salesforce
app.get('/api/salesforce/courses', async (req, res) => {
  try {
    if (!salesforceService) {
      return res.status(500).json({ error: 'Salesforce service is not available' });
    }
    const result = await salesforceService.getCourses();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course picklist values' });
  }
});

// Add endpoint to get module names from Salesforce
app.get('/api/salesforce/modules', async (req, res) => {
  try {
    if (!salesforceService) {
      return res.status(500).json({ error: 'Salesforce service is not available' });
    }
    // Optionally accept a course query param
    const course = req.query.course || null;
    const result = await salesforceService.getModuleNames(course);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch module names' });
  }
});

// Add endpoint to get partners and leads for autocomplete
app.get('/api/partners-and-leads', async (req, res) => {
  try {
    // Get all partners
    const [partners] = await pool.query('SELECT Name FROM Partner');
    // Get all leads
    const [leads] = await pool.query('SELECT Company FROM Leads');

    // Map to unified format
    const partnerOptions = partners.map(p => ({ name: p.Name, type: 'Partner' }));
    const leadOptions = leads.map(l => ({ name: l.Company, type: 'Lead' }));

    // Combine and deduplicate by name (case-insensitive)
    const seen = new Set();
    const combined = [...partnerOptions, ...leadOptions].filter(opt => {
      const key = opt.name?.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json(combined);
  } catch (err) {
    console.error('Error fetching partners and leads:', err);
    res.status(500).json({ error: 'Failed to fetch partners and leads' });
  }
});

// Add endpoint to create a new prospection card
app.post('/api/prospection-cards', async (req, res) => {
  try {
    const {
      name,
      course,
      description,
      year,
      period,
      classCode,
      status,
      advisor,
      classroom,
      partnerName
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO ProspectionCards 
        (Name, Course, Description, Year, Period, ClassCode, Status, Advisor, Classroom, PartnerName)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, course, description, year, period, classCode, status, advisor, classroom, partnerName]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating prospection card:', error);
    res.status(500).json({ error: 'Failed to create prospection card' });
  }
});

// Add endpoint to update a prospection card
app.put('/api/prospection-cards/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      name,
      course,
      description,
      year,
      period,
      classCode,
      status,
      advisor,
      classroom,
      partnerName
    } = req.body;

    const [result] = await pool.query(
      `UPDATE ProspectionCards 
       SET Name = ?, Course = ?, Description = ?, Year = ?, Period = ?, ClassCode = ?, Status = ?, Advisor = ?, Classroom = ?, PartnerName = ?
       WHERE ProspectionCardID = ?`,
      [name, course, description, year, period, classCode, status, advisor, classroom, partnerName, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prospection card not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating prospection card:', error);
    res.status(500).json({ error: 'Failed to update prospection card' });
  }
});

app.listen(5001, () => { console.log("Server started on port 5001")})