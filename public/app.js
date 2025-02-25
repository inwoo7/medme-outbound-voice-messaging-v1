document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentsList = document.getElementById('appointmentsList');
    
    // Set min date for appointment datetime to current date/time
    const appointmentDateTimeInput = document.getElementById('appointmentDateTime');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    appointmentDateTimeInput.min = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Load appointments on page load
    loadAppointments();
    
    // Form submission handler
    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(appointmentForm);
        const appointmentData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phoneNumber: formData.get('phoneNumber'),
            appointmentDateTime: formData.get('appointmentDateTime')
        };
        
        try {
            // Send data to server
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Clear form and reload appointments
                appointmentForm.reset();
                loadAppointments();
                showNotification('Appointment added successfully!', 'success');
            } else {
                showNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error adding appointment:', error);
            showNotification('Failed to add appointment. Please try again.', 'error');
        }
    });
    
    // Function to load appointments from server
    async function loadAppointments() {
        try {
            const response = await fetch('/api/appointments');
            const appointments = await response.json();
            
            displayAppointments(appointments);
        } catch (error) {
            console.error('Error loading appointments:', error);
            showNotification('Failed to load appointments. Please refresh the page.', 'error');
        }
    }
    
    // Function to display appointments
    function displayAppointments(appointments) {
        // Clear current list
        appointmentsList.innerHTML = '';
        
        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<p class="empty-message">No appointments scheduled yet.</p>';
            return;
        }
        
        // Sort appointments by date (newest first)
        appointments.sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime));
        
        // Create appointment cards
        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.appointmentDateTime);
            
            const card = document.createElement('div');
            card.className = 'appointment-card';
            
            card.innerHTML = `
                <h3>${appointment.firstName} ${appointment.lastName}</h3>
                <p><strong>Phone:</strong> ${appointment.phoneNumber}</p>
                <p><strong>Appointment:</strong> ${formatDateTime(appointmentDate)}</p>
                <p><strong>Status:</strong> ${appointment.reminderSent ? 'Reminder sent' : 'Pending'}</p>
                <div class="appointment-actions">
                    ${!appointment.reminderSent ? 
                      `<button class="btn-secondary send-reminder" data-id="${appointment.id}">
                         Send Reminder
                       </button>` : ''}
                </div>
            `;
            
            appointmentsList.appendChild(card);
        });
        
        // Add event listeners to send reminder buttons
        document.querySelectorAll('.send-reminder').forEach(button => {
            button.addEventListener('click', async () => {
                const patientId = button.getAttribute('data-id');
                await sendReminder(patientId);
            });
        });
    }
    
    // Function to send a reminder
    async function sendReminder(patientId) {
        try {
            const response = await fetch(`/api/send-reminder/${patientId}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showNotification('Reminder call initiated!', 'success');
                // Reload appointments to update status
                loadAppointments();
            } else {
                showNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            showNotification('Failed to send reminder. Please try again.', 'error');
        }
    }
    
    // Helper function to format date and time
    function formatDateTime(date) {
        const options = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('en-US', options);
    }
    
    // Function to show notifications
    function showNotification(message, type) {
        // Check if notification container exists, create if not
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
            
            // Add styles for notification container
            const style = document.createElement('style');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                
                .notification {
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    color: white;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    animation: slideIn 0.3s ease-out forwards;
                }
                
                .notification.success {
                    background-color: #28a745;
                }
                
                .notification.error {
                    background-color: #dc3545;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
});
