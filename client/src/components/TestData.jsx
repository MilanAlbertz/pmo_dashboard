import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Alert, Collapse, IconButton, Tabs, Tab } from '@mui/material';
import { Sync as SyncIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import './TestData.css';

const TestData = () => {
    const [partners, setPartners] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [errorTab, setErrorTab] = useState(0);
    const [mainTab, setMainTab] = useState(0);

    const fetchDbData = async () => {
        try {
            console.log('Fetching data from database...');
            const [partnersRes, contactsRes, projectsRes, leadsRes] = await Promise.all([
                axios.get('/api/partners'),
                axios.get('/api/contacts'),
                axios.get('/api/projects'),
                axios.get('/api/leads')
            ]);
            console.log('Partners response:', partnersRes.data);
            console.log('Contacts response:', contactsRes.data);
            console.log('Projects response:', projectsRes.data);
            console.log('Leads response:', leadsRes.data);
            setPartners(partnersRes.data.partners || []);
            setContacts(contactsRes.data || []);
            setProjects(projectsRes.data || []);
            setLeads(leadsRes.data || []);
        } catch (error) {
            console.error('Error fetching database data:', error);
        }
    };

    const handleSync = async () => {
        try {
            setLoading(true);
            setSyncStatus(null);
            const response = await axios.post('/api/sync/salesforce');
            setSyncStatus({
                type: 'success',
                message: `Sync successful!`,
                details: response.data
            });
            await fetchDbData(); // Refresh database data after sync
        } catch (error) {
            setSyncStatus({
                type: 'error',
                message: `Sync failed: ${error.response?.data?.error || error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDbData();
    }, []);

    const renderErrorDetails = (errors) => {
        if (!errors || errors.length === 0) return null;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" color="error" gutterBottom>
                    Error Details
                </Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Partner</TableCell>
                                <TableCell>Error</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {errors.map((error) => (
                                <TableRow key={error.id}>
                                    <TableCell>{error.name}</TableCell>
                                    <TableCell>{error.email || 'N/A'}</TableCell>
                                    <TableCell>{error.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                        {error.partnerName ? (
                                            <>
                                                {error.partnerName}
                                                <Typography variant="caption" display="block" color="textSecondary">
                                                    ID: {error.partnerId}
                                                </Typography>
                                            </>
                                        ) : (
                                            `Unknown (ID: ${error.partnerId})`
                                        )}
                                    </TableCell>
                                    <TableCell>{error.error}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const renderSyncDetails = () => {
        if (!syncStatus?.details) return null;

        const { stats, changes } = syncStatus.details;
        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Sync Details
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Inserted</TableCell>
                                <TableCell>Updated</TableCell>
                                <TableCell>Errors</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Partners</TableCell>
                                <TableCell>{stats.partners.total}</TableCell>
                                <TableCell>{stats.partners.inserted}</TableCell>
                                <TableCell>{stats.partners.updated}</TableCell>
                                <TableCell>{stats.partners.errors}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Contacts</TableCell>
                                <TableCell>{stats.contacts.total}</TableCell>
                                <TableCell>{stats.contacts.inserted}</TableCell>
                                <TableCell>{stats.contacts.updated}</TableCell>
                                <TableCell>{stats.contacts.errors}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Projects</TableCell>
                                <TableCell>{stats.projects.total}</TableCell>
                                <TableCell>{stats.projects.inserted}</TableCell>
                                <TableCell>{stats.projects.updated}</TableCell>
                                <TableCell>{stats.projects.errors}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Leads</TableCell>
                                <TableCell>{stats.leads.total}</TableCell>
                                <TableCell>{stats.leads.inserted}</TableCell>
                                <TableCell>{stats.leads.updated}</TableCell>
                                <TableCell>{stats.leads.errors}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {showDetails && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Detailed Changes
                        </Typography>
                        
                        <Tabs value={errorTab} onChange={(e, newValue) => setErrorTab(newValue)} sx={{ mb: 2 }}>
                            <Tab label="Partners" />
                            <Tab label="Contacts" />
                            <Tab label="Projects" />
                            <Tab label="Leads" />
                            <Tab label="Errors" />
                        </Tabs>

                        {errorTab === 0 && (
                            <>
                                {changes.partners.inserted.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">New Partners:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>ID</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.partners.inserted.map(partner => (
                                                        <TableRow key={partner.id}>
                                                            <TableCell>{partner.name}</TableCell>
                                                            <TableCell>{partner.id}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {changes.partners.updated.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">Updated Partners:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>ID</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.partners.updated.map(partner => (
                                                        <TableRow key={partner.id}>
                                                            <TableCell>{partner.name}</TableCell>
                                                            <TableCell>{partner.id}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </>
                        )}

                        {errorTab === 1 && (
                            <>
                                {changes.contacts.inserted.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">New Contacts:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Email</TableCell>
                                                        <TableCell>Phone</TableCell>
                                                        <TableCell>Partner</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.contacts.inserted.map(contact => (
                                                        <TableRow key={contact.id}>
                                                            <TableCell>{contact.name}</TableCell>
                                                            <TableCell>{contact.email || 'N/A'}</TableCell>
                                                            <TableCell>{contact.phone || 'N/A'}</TableCell>
                                                            <TableCell>{contact.partnerName}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {changes.contacts.updated.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">Updated Contacts:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Email</TableCell>
                                                        <TableCell>Phone</TableCell>
                                                        <TableCell>Partner</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.contacts.updated.map(contact => (
                                                        <TableRow key={contact.id}>
                                                            <TableCell>{contact.name}</TableCell>
                                                            <TableCell>{contact.email || 'N/A'}</TableCell>
                                                            <TableCell>{contact.phone || 'N/A'}</TableCell>
                                                            <TableCell>{contact.partnerName}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </>
                        )}

                        {errorTab === 2 && (
                            <>
                                {changes.projects.inserted.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">New Projects:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>ID</TableCell>
                                                        <TableCell>Partner</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.projects.inserted.map(project => (
                                                        <TableRow key={project.id}>
                                                            <TableCell>{project.name}</TableCell>
                                                            <TableCell>{project.id}</TableCell>
                                                            <TableCell>{project.partnerName}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {changes.projects.updated.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">Updated Projects:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>ID</TableCell>
                                                        <TableCell>Partner</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.projects.updated.map(project => (
                                                        <TableRow key={project.id}>
                                                            <TableCell>{project.name}</TableCell>
                                                            <TableCell>{project.id}</TableCell>
                                                            <TableCell>{project.partnerName}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </>
                        )}

                        {errorTab === 3 && (
                            <>
                                {changes.leads.inserted.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">New Leads:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Email</TableCell>
                                                        <TableCell>Phone</TableCell>
                                                        <TableCell>Company</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.leads.inserted.map(lead => (
                                                        <TableRow key={lead.id}>
                                                            <TableCell>{lead.name}</TableCell>
                                                            <TableCell>{lead.email || 'N/A'}</TableCell>
                                                            <TableCell>{lead.phone || 'N/A'}</TableCell>
                                                            <TableCell>{lead.company || 'N/A'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                                {changes.leads.updated.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1">Updated Leads:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Email</TableCell>
                                                        <TableCell>Phone</TableCell>
                                                        <TableCell>Company</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.leads.updated.map(lead => (
                                                        <TableRow key={lead.id}>
                                                            <TableCell>{lead.name}</TableCell>
                                                            <TableCell>{lead.email || 'N/A'}</TableCell>
                                                            <TableCell>{lead.phone || 'N/A'}</TableCell>
                                                            <TableCell>{lead.company || 'N/A'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </>
                        )}

                        {errorTab === 4 && (
                            <>
                                {changes.partners.errors.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" color="error">Partner Errors:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>ID</TableCell>
                                                        <TableCell>Error</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.partners.errors.map(partner => (
                                                        <TableRow key={partner.id}>
                                                            <TableCell>{partner.name}</TableCell>
                                                            <TableCell>{partner.id}</TableCell>
                                                            <TableCell>{partner.error}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {changes.contacts.errors.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" color="error">Contact Errors:</Typography>
                                        {renderErrorDetails(changes.contacts.errors)}
                                    </Box>
                                )}

                                {changes.projects.errors.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" color="error">Project Errors:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>ID</TableCell>
                                                        <TableCell>Partner</TableCell>
                                                        <TableCell>Error</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.projects.errors.map(project => (
                                                        <TableRow key={project.id}>
                                                            <TableCell>{project.name}</TableCell>
                                                            <TableCell>{project.id}</TableCell>
                                                            <TableCell>
                                                                {project.partnerName ? (
                                                                    <>
                                                                        {project.partnerName}
                                                                        <Typography variant="caption" display="block" color="textSecondary">
                                                                            ID: {project.partnerId}
                                                                        </Typography>
                                                                    </>
                                                                ) : (
                                                                    `Unknown (ID: ${project.partnerId})`
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{project.error}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {changes.leads.errors.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" color="error">Lead Errors:</Typography>
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Email</TableCell>
                                                        <TableCell>Phone</TableCell>
                                                        <TableCell>Company</TableCell>
                                                        <TableCell>Error</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {changes.leads.errors.map(lead => (
                                                        <TableRow key={lead.id}>
                                                            <TableCell>{lead.name}</TableCell>
                                                            <TableCell>{lead.email || 'N/A'}</TableCell>
                                                            <TableCell>{lead.phone || 'N/A'}</TableCell>
                                                            <TableCell>{lead.company || 'N/A'}</TableCell>
                                                            <TableCell>{lead.error}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" component="h2">
                            Test Data
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SyncIcon />}
                            onClick={handleSync}
                            disabled={loading}
                        >
                            {loading ? 'Syncing...' : 'Sync with Salesforce'}
                        </Button>
                    </Box>

                    {syncStatus && (
                        <Alert 
                            severity={syncStatus.type} 
                            sx={{ mb: 2 }}
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={() => setShowDetails(!showDetails)}
                                >
                                    {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            }
                        >
                            {syncStatus.message}
                        </Alert>
                    )}

                    {showDetails && renderSyncDetails()}

                    <Tabs value={mainTab} onChange={(e, newValue) => setMainTab(newValue)} sx={{ mb: 2 }}>
                        <Tab label="Partners" />
                        <Tab label="Projects" />
                    </Tabs>

                    {mainTab === 0 && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Sector</TableCell>
                                        <TableCell>Industry</TableCell>
                                        <TableCell>Activity</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {partners.map((partner) => (
                                        <TableRow key={partner.PartnerID}>
                                            <TableCell>{partner.PartnerID}</TableCell>
                                            <TableCell>{partner.Name}</TableCell>
                                            <TableCell>{partner.Sector}</TableCell>
                                            <TableCell>{partner.Industry}</TableCell>
                                            <TableCell>{partner.Activity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {mainTab === 1 && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Account ID</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {projects.map((project) => (
                                        <TableRow key={project.Id}>
                                            <TableCell>{project.Id}</TableCell>
                                            <TableCell>{project.Name}</TableCell>
                                            <TableCell>{project.AccountId}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6">Leads</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Company</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell>{lead.name}</TableCell>
                                            <TableCell>{lead.phone}</TableCell>
                                            <TableCell>{lead.email}</TableCell>
                                            <TableCell>{lead.company}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" color="error">Lead Errors</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell>Company</TableCell>
                                        <TableCell>Error</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {syncStatus?.details?.changes?.leads?.errors?.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell>{lead.name}</TableCell>
                                            <TableCell>{lead.email || 'N/A'}</TableCell>
                                            <TableCell>{lead.phone || 'N/A'}</TableCell>
                                            <TableCell>{lead.company || 'N/A'}</TableCell>
                                            <TableCell>{lead.error}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default TestData; 