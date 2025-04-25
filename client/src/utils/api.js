export const fetchMockData = async () => {
  try {
    const response = await fetch('/api/mockData');
    if (!response.ok) {
      throw new Error('Failed to fetch mock data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching mock data:', error);
    throw error;
  }
};

export const updateModule = async (year, course, period, index, data) => {
  try {
    const response = await fetch(`/api/modules/${year}/${course}/${period}/${index}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update module');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating module:', error);
    throw error;
  }
};

export const fetchPartners = async () => {
  try {
    const response = await fetch('/api/salesforce/partners');
    if (!response.ok) {
      throw new Error('Failed to fetch partners');
    }
    const data = await response.json();
    return {
      companies: data.records.map(partner => ({
        name: partner.Name,
        type: partner.Type__c || 'Privado'
      }))
    };
  } catch (error) {
    console.error('Error fetching partners:', error);
    throw error;
  }
};

export const fetchHistory = async () => {
  try {
    const response = await fetch('/api/history');
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}; 