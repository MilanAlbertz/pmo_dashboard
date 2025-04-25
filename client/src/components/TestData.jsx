import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TestData.css';

const TestData = () => {
    const [project, setProject] = useState(null);
    const [contact, setContact] = useState(null);
    const [staff, setStaff] = useState(null);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectRes, contactRes, staffRes, partnersRes] = await Promise.all([
                    axios.get('/api/test/projects'),
                    axios.get('/api/test/contacts'),
                    axios.get('/api/test/staff'),
                    axios.get('/api/salesforce/partners')
                ]);

                // Detailed logging
                console.log('Raw Project Response:', projectRes);
                console.log('Raw Contact Response:', contactRes);
                console.log('Raw Staff Response:', staffRes);
                console.log('Raw Partners Response:', partnersRes);

                // Check if data exists and log it
                if (projectRes.data && projectRes.data.length > 0) {
                    console.log('Project Data Found:', projectRes.data[0]);
                    setProject(projectRes.data[0]);
                } else {
                    console.log('No Project Data Found');
                }

                if (contactRes.data && contactRes.data.length > 0) {
                    console.log('Contact Data Found:', contactRes.data[0]);
                    setContact(contactRes.data[0]);
                } else {
                    console.log('No Contact Data Found');
                }

                if (staffRes.data && staffRes.data.length > 0) {
                    console.log('Staff Data Found:', staffRes.data[0]);
                    setStaff(staffRes.data[0]);
                } else {
                    console.log('No Staff Data Found');
                }

                if (partnersRes.data && partnersRes.data.records) {
                    console.log('Partners Data Found:', partnersRes.data.records);
                    setPartners(partnersRes.data.records);
                } else {
                    console.log('No Partners Data Found');
                }

                setLoading(false);
            } catch (err) {
                setError('Failed to fetch test data');
                setLoading(false);
                console.error('Error fetching test data:', err);
                console.error('Error details:', err.response?.data);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) return <div>Loading test data...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="test-data-container">
            <h2>Test Data from Database</h2>
            
            <div className="data-section">
                <h3>Project</h3>
                {project ? (
                    <div>
                        <p><strong>ProjectID:</strong> {project.ProjectID}</p>
                        <p><strong>Title:</strong> {project.Title}</p>
                        <p><strong>Description:</strong> {project.Description}</p>
                        <p><strong>Status:</strong> {project.Status}</p>
                        <p><strong>Period:</strong> {project.Period}</p>
                        <p><strong>Year:</strong> {project.Year}</p>
                    </div>
                ) : (
                    <p>No project data available</p>
                )}
            </div>

            <div className="data-section">
                <h3>Contact</h3>
                {contact ? (
                    <div>
                        <p><strong>ContactID:</strong> {contact.ContactID}</p>
                        <p><strong>Name:</strong> {contact.Name}</p>
                        <p><strong>Email:</strong> {contact.Email}</p>
                        <p><strong>Role:</strong> {contact.Role}</p>
                        <p><strong>Phone:</strong> {contact.Phone}</p>
                    </div>
                ) : (
                    <p>No contact data available</p>
                )}
            </div>

            <div className="data-section">
                <h3>Staff</h3>
                {staff ? (
                    <div>
                        <p><strong>StaffID:</strong> {staff.StaffID}</p>
                        <p><strong>Name:</strong> {staff.Name}</p>
                        <p><strong>Role:</strong> {staff.Role}</p>
                        <p><strong>Email:</strong> {staff.Email}</p>
                    </div>
                ) : (
                    <p>No staff data available</p>
                )}
            </div>

            <div className="data-section">
                <h3>Salesforce Partners</h3>
                {partners.length > 0 ? (
                    <table className="partners-table">
                        <thead>
                            <tr>
                                <th>Partner ID</th>
                                <th>Name</th>
                                <th>Sector</th>
                                <th>Industry</th>
                                <th>Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partners.map((partner) => (
                                <tr key={partner.Id}>
                                    <td>{partner.Id}</td>
                                    <td>{partner.Name}</td>
                                    <td>{partner.Sector__c || 'N/A'}</td>
                                    <td>{partner.Industry || 'N/A'}</td>
                                    <td>{partner.Activity__c || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No partners data available</p>
                )}
            </div>
        </div>
    );
};

export default TestData; 