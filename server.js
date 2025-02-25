const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// For Render deployment, ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Data storage path - use the root data.json file
const dataPath = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ patients: [] }));
}

// Helper function to read data
const readData = () => {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
};

// Helper function to write data
const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

// API endpoint to add a new patient appointment
app.post('/api/appointments', (req, res) => {
  try {
    const { firstName, lastName, appointmentDateTime, phoneNumber } = req.body;
    
    if (!firstName || !lastName || !appointmentDateTime || !phoneNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const data = readData();
    
    // Generate a unique ID for the appointment
    const id = Date.now().toString();
    
    // Add new appointment
    data.patients.push({
      id,
      firstName,
      lastName,
      appointmentDateTime,
      phoneNumber,
      reminderSent: false,
      createdAt: new Date().toISOString()
    });
    
    writeData(data);
    
    res.status(201).json({ message: 'Appointment added successfully', id });
  } catch (error) {
    console.error('Error adding appointment:', error);
    res.status(500).json({ error: 'Failed to add appointment' });
  }
});

// API endpoint to get all appointments
app.get('/api/appointments', (req, res) => {
  try {
    const data = readData();
    res.json(data.patients);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Vapi webhook endpoint to get patient context
app.post('/api/vapi-webhook', (req, res) => {
  try {
    console.log('Received webhook from Vapi:', JSON.stringify(req.body, null, 2));
    
    // Extract patient ID from the request metadata
    const metadata = req.body.metadata || {};
    const patientId = metadata.patientId;
    
    if (!patientId) {
      console.log('No patient ID found in request metadata:', metadata);
      return res.status(400).json({ error: 'Patient ID is required in metadata' });
    }
    
    const data = readData();
    const patient = data.patients.find(p => p.id === patientId);
    
    if (!patient) {
      console.log(`Patient with ID ${patientId} not found`);
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Format the appointment date for the AI to use
    const appointmentDate = new Date(patient.appointmentDateTime);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Return patient context for the Vapi agent
    res.json({
      patientName: `${patient.firstName} ${patient.lastName}`,
      appointmentDate: formattedDate,
      appointmentTime: formattedTime,
      fullName: `${patient.firstName} ${patient.lastName}`
    });
    
    // Update the patient record to mark reminder as sent
    patient.reminderSent = true;
    writeData(data);
    
  } catch (error) {
    console.error('Error processing Vapi webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Environment variables for Vapi API
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_PHONE_NUMBER = process.env.VAPI_PHONE_NUMBER;
const SERVER_URL = process.env.SERVER_URL || 'https://medme-outbound-voice-messaging-v1.onrender.com';

// Check if required environment variables are set
if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID) {
  console.warn('Warning: VAPI_API_KEY and/or VAPI_ASSISTANT_ID environment variables are not set.');
  console.warn('To set them, create a .env file based on .env.example or set them in your deployment environment');
}

// Endpoint to initiate an outbound call via Vapi
app.post('/api/send-reminder/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Get patient data
    const data = readData();
    const patient = data.patients.find(p => p.id === patientId);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    console.log(`Initiating reminder call for patient: ${patient.firstName} ${patient.lastName}`);
    
    // Check if we have the required Vapi credentials
    if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID || !VAPI_PHONE_NUMBER) {
      console.log('Missing Vapi credentials. Please check your .env file.');
      return res.status(500).json({ error: 'Vapi API credentials not configured' });
    }
    
    // Ensure phone number is in E.164 format
    const formattedPhone = patient.phoneNumber.startsWith('+') 
      ? patient.phoneNumber 
      : `+${patient.phoneNumber}`;
    
    // Make API call to Vapi to initiate outbound call
    try {
      console.log(`Calling Vapi API with phone: ${formattedPhone}`);
      console.log(`Using VAPI_ASSISTANT_ID: ${VAPI_ASSISTANT_ID}`);
      console.log(`Using VAPI_PHONE_NUMBER: ${VAPI_PHONE_NUMBER}`);
      // Don't log the full API key for security, just the first few characters
      console.log(`Using VAPI_API_KEY (first 8 chars): ${VAPI_API_KEY.substring(0, 8)}...`);
      
      const vapiResponse = await axios.post('https://api.vapi.ai/call/phone', {
        assistant_id: VAPI_ASSISTANT_ID,
        to: formattedPhone,
        from: VAPI_PHONE_NUMBER.startsWith('+') ? VAPI_PHONE_NUMBER : `+${VAPI_PHONE_NUMBER}`,
        metadata: {
          patientId: patient.id
        }
      }, {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Vapi API response:', vapiResponse.data);
      
      // Update the patient record to mark reminder as sent
      patient.reminderSent = true;
      writeData(data);
      
      // Include the call ID in the response
      res.json({ 
        message: 'Reminder call initiated successfully', 
        patientId,
        callId: vapiResponse.data.id
      });
    } catch (apiError) {
      console.error('Error calling Vapi API:', apiError.message);
      if (apiError.response) {
        console.error('Vapi API error response:', apiError.response.data);
      }
      res.status(500).json({ 
        error: 'Failed to initiate call via Vapi API',
        details: apiError.response?.data || apiError.message
      });
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});
