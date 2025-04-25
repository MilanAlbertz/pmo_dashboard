debugger; // First line breakpoint
require('dotenv').config({ path: './salesforce.env' });
const express = require('express')
// const jsforce = require('jsforce');
const axios = require('axios');
const app = express()
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// MySQL connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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

app.get('/api/salesforce/accounts', async (req, res) => {
  try {
    const token = await obterToken();
    const queryString = encodeURIComponent('SELECT Id, Name FROM Account LIMIT 10');
    const sfResponse = await fetch(
      `${sfConfig.loginUrl}/services/data/v57.0/query?q=${queryString}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    const result = await sfResponse.json();
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
    const token = await obterToken();
    const queryString = encodeURIComponent("SELECT Id, Name FROM Account WHERE Relacao__c = 'Parceiro'");
    const sfResponse = await fetch(
      `${sfConfig.loginUrl}/services/data/v57.0/query?q=${queryString}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    const result = await sfResponse.json();
    console.log(result);
    res.json({
      success: true,
      count: result.totalSize,
      records: result.records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
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
  res.header('Access-Control-Allow-Origin', 'http://localhost:9995');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
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

// Comment out or modify Salesforce endpoints

// app.get('/api/salesforce/accounts', checkSalesforceConnection, async (req, res) => {
//   try {
//     const records = await conn.query('SELECT Id, Name FROM Account LIMIT 10');
//     res.json({
//       success: true,
//       count: records.totalSize,
//       records: records.records
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Modify the status endpoint to be simpler
app.get('/api/salesforce/status', (req, res) => {
  res.json({
    connected: sfConnected
  });
});

// Update modules endpoint to not use mockData
app.put('/api/modules/:year/:course/:period/:index', (req, res) => {
  const { year, course, period, index } = req.params;
  const updateData = req.body;
  
  try {
    // For now, just return the update data
    res.json({
      success: true,
      data: updateData
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

app.listen(5001, () => { console.log("Server started on port 5001")})