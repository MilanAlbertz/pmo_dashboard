const fetch = require('node-fetch');

// Token cache
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

async function obterToken() {
    try {
        // Check if we have a valid cached token
        if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
            console.log('Using cached token');
            return tokenCache.accessToken;
        }

        console.log('Fetching Salesforce token...');
        
        if (!process.env.SF_LOGIN_URL) {
            throw new Error('SF_LOGIN_URL environment variable is not set');
        }
        
        const loginUrl = process.env.SF_LOGIN_URL;
        console.log('Using SF_LOGIN_URL:', loginUrl);

        if (!process.env.SF_CLIENT_ID || !process.env.SF_CLIENT_SECRET) {
            throw new Error('SF_CLIENT_ID and SF_CLIENT_SECRET environment variables must be set');
        }

        // Create form data
        const formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        formData.append('client_id', process.env.SF_CLIENT_ID);
        formData.append('client_secret', process.env.SF_CLIENT_SECRET);

        const url = `${loginUrl}/services/oauth2/token`;
        console.log('Token request URL:', url);
        console.log('Request body:', formData.toString());

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: formData.toString()
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                throw new Error(`Token request failed: ${response.status} ${response.statusText} - ${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            if (!data.access_token) {
                throw new Error(`No access_token in response: ${JSON.stringify(data)}`);
            }

            // Cache the token with expiration
            tokenCache = {
                accessToken: data.access_token,
                expiresAt: Date.now() + ((data.expires_in || 7200) * 1000) - 60000 // Subtract 1 minute for safety
            };

            console.log('Token obtained successfully');
            return data.access_token;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in obterToken:', error);
        throw error;
    }
}

module.exports = {
    obterToken
}; 