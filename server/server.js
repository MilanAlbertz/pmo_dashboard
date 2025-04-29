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

// Add new endpoint for fetching projects
app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.ProjectID as id,
        p.Title as title,
        p.Description as description,
        p.Comment as comment,
        p.Period as period,
        p.Year as year,
        p.NumPrototypes as numPrototypes,
        p.Quarter as quarter,
        m.Name as module,
        m.Course as course,
        m.Description as moduleDescription,
        pa.Name as partner,
        pa.Sector as sector,
        pa.Industry as industry,
        pa.Activity as activity,
        c.ClassCode as classCode,
        c.Classroom as classroom,
        s1.Name as coordinator,
        s1.Email as coordinatorEmail,
        s2.Name as advisor,
        s2.Email as advisorEmail,
        a.Sent as agreementSent,
        a.Returned as agreementReturned,
        a.Signed as agreementSigned,
        a.Comments as agreementComments,
        t.Sent as tapiSent,
        t.Returned as tapiReturned,
        t.Signed as tapiSigned,
        t.Comments as tapiComments,
        pg.Link as githubLink
      FROM Project p
      LEFT JOIN Module m ON p.ModuleID = m.ModuleID
      LEFT JOIN Partner pa ON p.PartnerID = pa.PartnerID
      LEFT JOIN Class c ON m.ClassID = c.ClassID
      LEFT JOIN Staff s1 ON p.CoordinatorID = s1.StaffID
      LEFT JOIN Staff s2 ON p.AdvisorID = s2.StaffID
      LEFT JOIN Agreement a ON p.AgreementID = a.AgreementID
      LEFT JOIN TAPI t ON p.TapiID = t.TapiID
      LEFT JOIN ProjectGitHub pg ON p.ProjectID = pg.ProjectID
      ORDER BY p.Year DESC, p.Period DESC
    `);
    
    console.log('Database rows:', rows); // Debug log
    
    const projects = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      comment: row.comment,
      period: row.period,
      year: row.year,
      numPrototypes: row.numPrototypes,
      quarter: row.quarter,
      module: row.module,
      course: row.course,
      moduleDescription: row.moduleDescription,
      partner: row.partner,
      sector: row.sector,
      industry: row.industry,
      activity: row.activity,
      classCode: row.classCode,
      classroom: row.classroom,
      coordinator: row.coordinator,
      coordinatorEmail: row.coordinatorEmail,
      advisor: row.advisor,
      advisorEmail: row.advisorEmail,
      agreementSent: row.agreementSent,
      agreementReturned: row.agreementReturned,
      agreementSigned: row.agreementSigned,
      agreementComments: row.agreementComments,
      tapiSent: row.tapiSent,
      tapiReturned: row.tapiReturned,
      tapiSigned: row.tapiSigned,
      tapiComments: row.tapiComments,
      githubLink: row.githubLink
    }));
    
    console.log('Processed projects:', projects); // Debug log
    
    res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new endpoint for fetching project details
app.get('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Fetch project details with all related information
    const [projectRows] = await pool.query(`
      SELECT 
        p.ProjectID as id,
        p.Title as title,
        p.Description as description,
        p.Comment as comment,
        p.Period as period,
        p.Year as year,
        p.NumPrototypes as numPrototypes,
        p.Quarter as quarter,
        m.Name as module,
        m.Course as course,
        m.Description as moduleDescription,
        pa.Name as partner,
        pa.Sector as sector,
        pa.Industry as industry,
        pa.Activity as activity,
        c.ClassCode as classCode,
        c.Classroom as classroom,
        s1.Name as coordinator,
        s1.Email as coordinatorEmail,
        s2.Name as advisor,
        s2.Email as advisorEmail,
        a.Sent as agreementSent,
        a.Returned as agreementReturned,
        a.Signed as agreementSigned,
        a.Comments as agreementComments,
        t.Sent as tapiSent,
        t.Returned as tapiReturned,
        t.Signed as tapiSigned,
        t.Comments as tapiComments,
        pg.Link as githubLink
      FROM Project p
      LEFT JOIN Module m ON p.ModuleID = m.ModuleID
      LEFT JOIN Partner pa ON p.PartnerID = pa.PartnerID
      LEFT JOIN Class c ON m.ClassID = c.ClassID
      LEFT JOIN Staff s1 ON p.CoordinatorID = s1.StaffID
      LEFT JOIN Staff s2 ON p.AdvisorID = s2.StaffID
      LEFT JOIN Agreement a ON p.AgreementID = a.AgreementID
      LEFT JOIN TAPI t ON p.TapiID = t.TapiID
      LEFT JOIN ProjectGitHub pg ON p.ProjectID = pg.ProjectID
      WHERE p.ProjectID = ?
    `, [projectId]);
    
    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectRows[0];

    // Fetch project contacts
    const [contactRows] = await pool.query(`
      SELECT 
        c.Name as name,
        c.Email as email,
        c.Phone as phone,
        c.Role as role,
        pc.Role as projectRole
      FROM ProjectContact pc
      JOIN Contact c ON pc.ContactID = c.ContactID
      WHERE pc.ProjectID = ?
    `, [projectId]);

    // Format the response
    const response = {
      project: {
        ...project,
        contacts: contactRows,
        terms: {
          sent: project.agreementSent,
          returned: project.agreementReturned,
          signed: project.agreementSigned,
          comment: project.agreementComments
        },
        tapi: {
          sent: project.tapiSent,
          returned: project.tapiReturned,
          aligned: project.tapiSigned,
          comment: project.tapiComments
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to get partners from local database
app.get('/api/partners', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Partner');
    res.json({ partners: rows });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch partners',
      error: error.message 
    });
  }
});

app.listen(5001, () => { console.log("Server started on port 5001")})