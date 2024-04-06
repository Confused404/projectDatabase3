const eventServerAddress = "http://127.0.0.1:3000";

async function fetchData() {
  try {
      const response = await fetch(`${eventServerAddress}/getUnapprovedEvents`);
      const data = await response.json();

      // Create title
      const title = document.createElement("h1");
      title.textContent = 'Events To Be Approved';
      title.style.fontSize = '400%'; // Increase the font size
      title.style.textAlign = 'center'; // Center the text
      title.style.marginTop = '1%'; // Increase the top margin
      title.style.marginBottom = '1%'
      title.style.color = 'white'; // Set the text color to white
      document.body.appendChild(title);
  
      // Create horizontal line
      const line = document.createElement("hr");
      line.style.marginLeft = '10%'; // Add left margin
      line.style.marginRight = '10%'; // Add right margin
      document.body.appendChild(line);
  
      for (const record of data) {
        if(!record.approved){
          const eventDiv = document.createElement("div");
          eventDiv.className = "record";
      
          const eventTitle = document.createElement("h1");
          eventTitle.textContent = record.evnt_title;
          eventDiv.appendChild(eventTitle);
      
          const eventTime = document.createElement("h2");
          eventTime.textContent = record.evnt_time;
          eventDiv.appendChild(eventTime);
      
          const eventDesc = document.createElement("p");
          eventDesc.innerHTML = record.evnt_desc;
          eventDiv.appendChild(eventDesc);
          // Check if the user has joined the event
          
          const approveButton = document.createElement("button");
          approveButton.style.width = '75px'; // Set the width
          approveButton.style.height = '25px'; // Set the height
          approveButton.style.marginTop = '1%';
          approveButton.innerText = 'Approve'; // Set the button text
          approveButton.style.backgroundColor = '#40d91a'; // Set the button color
          approveButton.style.color = '#134008'; // Set the text color
          eventDiv.appendChild(approveButton);
      
          // Inside the loop in fetchData function
          approveButton.addEventListener('click', async () => {
            try {
              const response = await fetch(`${eventServerAddress}/approveEvent`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId: record.evnt_id }), // Use the correct id field
              });
              const data = await response.json();
              if (data.success) {
                location.reload();
              } else {
                console.error('Error approving event:', data.error);
              }
            } catch (error) {
              console.error('Error sending approve request:', error);
            }
          });
      
          // Create reject button
          const rejectButton = document.createElement("button");
          rejectButton.style.width = '75px'; // Set the width
          rejectButton.style.height = '25px'; // Set the height
          rejectButton.style.marginTop = '1%';
          rejectButton.innerText = 'Reject'; // Set the button text
          rejectButton.style.backgroundColor = '#d91a1a'; // Set the button color
          rejectButton.style.color = '#400808'; // Set the text color
          rejectButton.style.marginLeft = '10px'; // Add some space between the buttons
          eventDiv.appendChild(rejectButton);
          
          rejectButton.addEventListener('click', async () => {
              try {
                const response = await fetch(`${eventServerAddress}/rejectEvent`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ eventId: record.evnt_id, eventType: record.evnt_type }), // Send the id and type
                });
                const data = await response.json();
                if (data.success) {
                  location.reload();
                } else {
                  console.error('Error rejecting event:', data.error);
                }
              } catch (error) {
                console.error('Error sending reject request:', error);
              }
            });
          
          document.body.appendChild(eventDiv);
        }
      } 
    } catch (error) {
        console.error("Error fetching event data:", error);
    }
}

fetchData();