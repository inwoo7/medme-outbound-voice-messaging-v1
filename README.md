# Pharmacy Appointment Reminder System

A simple web application for pharmacy staff to schedule appointment reminders for patients. The system uses Vapi's AI voice agent to make outbound calls to patients, reminding them of their upcoming appointments.

## Features

- Add patient appointments with name, phone number, and appointment date/time
- View all scheduled appointments
- Send automated voice reminders to patients
- Integration with Vapi AI voice agent

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Vapi account with an AI assistant already created

## Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Configuration

### Vapi API Configuration

To connect the application with your Vapi AI assistant, you need to configure environment variables. The project is already set up to use the dotenv package, which loads environment variables from a `.env` file.

1. Create a `.env` file in the root directory by copying the provided example:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your actual Vapi credentials:

```
# Vapi API Configuration
VAPI_API_KEY=your-vapi-api-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_PHONE_NUMBER=your-vapi-phone-number
SERVER_URL=http://localhost:3000/api/vapi-webhook
```

Required variables:
- `VAPI_API_KEY`: Your Vapi API key (found in your Vapi dashboard)
- `VAPI_ASSISTANT_ID`: The ID of your Vapi assistant (found in your Vapi dashboard)
- `VAPI_PHONE_NUMBER`: The phone number assigned to your Vapi account
- `SERVER_URL`: The URL where your server is running (for webhook callbacks)

For local development, you can leave SERVER_URL as http://localhost:3000/api/vapi-webhook. For production, you'll need to update this to your publicly accessible URL.

### Configuring Your Vapi Assistant

1. Log in to your Vapi dashboard
2. Navigate to the assistant section
3. In the "Advanced" tab, set the server URL to point to your application's webhook endpoint:
   - For local development: `http://localhost:3000/api/vapi-webhook`
   - For production: `https://your-domain.com/api/vapi-webhook`

## Running the Application

Start the server:

```bash
node server.js
```

The application will be available at `http://localhost:3000`

## How to Use

1. **Adding a Patient Appointment**:
   - Fill out the form with the patient's first name, last name, phone number, and appointment date/time
   - Click "Add Appointment"

2. **Viewing Appointments**:
   - All scheduled appointments are displayed in the "Scheduled Appointments" section
   - Appointments are sorted by date (earliest first)

3. **Sending Reminders**:
   - For each appointment, click the "Send Reminder" button to initiate an outbound call
   - The Vapi AI assistant will call the patient and remind them of their appointment
   - After sending a reminder, the appointment status will update to "Reminder sent"

## How It Works

1. When you add a patient appointment, it's stored in the application's database
2. When you click "Send Reminder", the application makes an API call to Vapi to initiate an outbound call
3. The Vapi AI assistant calls the patient
4. During the call, Vapi makes a webhook request to your server to get context about the patient and appointment
5. Your server responds with the patient's name and appointment details
6. The AI assistant uses this information to personalize the reminder message

## Customizing the AI Assistant

You can customize the behavior of your Vapi AI assistant through the Vapi dashboard. This includes:

- Changing the voice of the assistant
- Modifying the script or prompts
- Adding additional functionality like appointment rescheduling

## Troubleshooting

- If the server fails to start, check that port 3000 is not in use by another application
- If reminders are not being sent, verify your Vapi API key and assistant ID
- Check the server logs for any error messages

## Production Deployment

### Deploying to Render

This application can be easily deployed to Render, which will provide a public URL for your Vapi webhook:

1. Create a Render account at [render.com](https://render.com) if you don't have one
2. Push your code to a Git repository (GitHub, GitLab, etc.)
3. In the Render dashboard, click "New" and select "Blueprint"
4. Connect your Git repository
5. Render will automatically detect the `render.yaml` file and set up your service
6. Set the following environment variables in the Render dashboard:
   - `VAPI_API_KEY`: Your Vapi API key
   - `VAPI_ASSISTANT_ID`: Your Vapi assistant ID
   - `VAPI_PHONE_NUMBER`: Your Vapi phone number
   - `SERVER_URL`: Set this to `https://your-render-app-name.onrender.com/api/vapi-webhook`
7. Deploy your application

Once deployed, your application will be available at `https://your-render-app-name.onrender.com`, and you can use this URL for your Vapi webhook.

### Other Production Considerations

For other production deployments, consider:

1. Using a process manager like PM2 to keep the application running
2. Setting up HTTPS for secure communication
3. Implementing proper authentication for the admin interface
4. Using a production-grade database instead of the JSON file storage

## License

This project is licensed under the MIT License - see the LICENSE file for details.
