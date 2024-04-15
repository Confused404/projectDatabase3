document.addEventListener("DOMContentLoaded", function () {
  // Function to fetch session information
  function fetchSessionInfo() {
    fetch("/get_session_info")
      .then((response) => response.json())
      .then((data) => {
        // Check if session exists
        if (data.exists) {
          // Construct HTML content with session details
          const sessionDetailsHTML = `
              <p>Username: ${data.username}</p>
              <p>Email: ${data.email}</p>
              <p>User ID: ${data.usr_id}</p>
              <p>Role: ${data.role.toUpperCase()}</p>
              <!-- Add more session details as needed -->
            `;

          // Render session details inside the div with id "session-details"
          document.getElementById("session-details").innerHTML =
            sessionDetailsHTML;
        } else {
          // Session doesn't exist, handle it accordingly
          showErrorModal("Couldn't fetch account information try again later");
          console.log("Session not found");
        }
      })
      .catch((error) => {
        console.error("Error fetching session information:", error);
        showErrorModal("Couldn't fetch account information try again later");
      });
  }

  // Call the fetchSessionInfo function when the DOM content is loaded
  fetchSessionInfo();
});
