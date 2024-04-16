document.addEventListener("DOMContentLoaded", function () {
  // Function to fetch session and RSO details
  function fetchCombinedInfo() {
    fetch(`/get_combined_info`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Handle the combined response data
        console.log("Combined info:", data);
        // Render session and RSO details
        renderSessionDetails(data.session);
        renderRSODetails(data.rso_details);
      })
      .catch((error) => {
        console.error("Error fetching combined info:", error);
        showErrorModal(error);
      });
  }

  // Function to render session details
  function renderSessionDetails(sessionData) {
    const sessionDetailsHTML = `
      <p>Username: ${sessionData.username}</p>
      <p>Email: ${sessionData.email}</p>
      <p>User ID: ${sessionData.usr_id}</p>
      <p>Role: ${sessionData.role.toUpperCase()}</p>
      <!-- Add more session details as needed -->
    `;
    document.getElementById("session-details").innerHTML = sessionDetailsHTML;
  }

  // Function to render RSO details
  function renderRSODetails(rsoDetails) {
    // Render RSO details as needed
    console.log("RSO details:", rsoDetails);
  }

  // Call fetchCombinedInfo function when DOM content is loaded
  fetchCombinedInfo();
});
