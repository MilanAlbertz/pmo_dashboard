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

export const fetchProjects = async () => {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    const data = await response.json();
    console.log('API response:', data);
    return data;  // Return the array directly since it's from the database
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const createModule = async (moduleData) => {
  try {
    const response = await fetch('/api/modules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moduleData),
    });
    if (!response.ok) {
      throw new Error('Failed to create module');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

export const fetchModuleNames = async (course = null) => {
  try {
    const url = course 
      ? `/api/salesforce/modules?course=${encodeURIComponent(course)}`
      : '/api/salesforce/modules';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch module names');
    }
    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error('Error fetching module names:', error);
    throw error;
  }
};

export const fetchModulePicklistValues = async () => {
  try {
    const response = await fetch('/api/salesforce/module-picklist');
    if (!response.ok) {
      throw new Error('Failed to fetch module picklist values');
    }
    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error('Error fetching module picklist values:', error);
    throw error;
  }
};

export const fetchCoursePicklistValues = async () => {
  try {
    const response = await fetch('/api/salesforce/courses');
    if (!response.ok) {
      throw new Error('Failed to fetch course picklist values');
    }
    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error('Error fetching course picklist values:', error);
    throw error;
  }
};

export const fetchPartnersAndLeads = async () => {
  try {
    const response = await fetch('/api/partners-and-leads');
    if (!response.ok) {
      throw new Error('Failed to fetch partners and leads');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching partners and leads:', error);
    throw error;
  }
}; 