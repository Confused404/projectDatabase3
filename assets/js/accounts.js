document.addEventListener("DOMContentLoaded", function () {
  // Function to fetch session, RSO, and event details
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
        // Render session details
        renderSessionDetails(data.session);
        // Render RSO or event details\
        console.log(
          data.data.filter((entry) => entry.is_rso),
          data.session
        );
        if (data.session.role != "super_admin") {
          renderRSODetails(
            data.data.filter((entry) => entry.is_rso),
            data.session
          );
          if (data.session.role == "user") {
            renderEventDetails(data.data.filter((entry) => entry.is_event));
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching combined info:", error);
        showErrorModal("MUST BE SIGNED IN TO SEE ACCOUNT INFO");
        setTimeout(() => {
          window.location.href = "../../index.html";
        }, 2000);
      });
  }

  // Function to render session details
  function renderSessionDetails(sessionData) {
    const sessionDetailsHTML = `
      <h2>Account Info</h2>
      <p>Username: ${sessionData.username}</p>
      <p>Email: ${sessionData.email}</p>
      <p>User ID: ${sessionData.usr_id}</p>
      <p>Role: ${sessionData.role.toUpperCase()}</p>
      <!-- Add more session details as needed -->
    `;
    document.getElementById("session-details").innerHTML = sessionDetailsHTML;
  }

  function renderRSODetails(rsoDetails, sessionDetails) {
    console.log("INSIDE RENDER RSO");
    const container = document.getElementById("rso-details");
    container.innerHTML = "";
    const rso_details_title = document.createElement("h2");
    rso_details_title.textContent = "RSOs JOINED";
    if (sessionDetails.role == "rso")
      rso_details_title.textContent = "RSOs CREATED";
    container.append(rso_details_title);
    rsoDetails.forEach((rso) => {
      const rsoContainer = document.createElement("div");
      rsoContainer.classList.add("rso-container");

      const titleElement = document.createElement("h2");
      titleElement.textContent = `${rso.details.rso_title}`;

      const membersArray = rso.details.rso_members.split(",");

      const membersElement = document.createElement("p");
      membersElement.textContent = "RSO Members:";

      membersArray.forEach((member) => {
        const memberElement = document.createElement("p");
        memberElement.textContent = `• ${member.trim()}`;
        membersElement.appendChild(memberElement);
      });

      rsoContainer.appendChild(titleElement);
      rsoContainer.appendChild(membersElement);

      container.appendChild(rsoContainer);
    });
  }

  function renderEventDetails(eventDetails) {
    const container = document.getElementById("event-details");
    container.innerHTML = "";
    const event_details_title = document.createElement("h2");
    event_details_title.textContent = "EVENTS JOINED";
    container.append(event_details_title);
    eventDetails.forEach((event) => {
      const eventContainer = document.createElement("div");
      eventContainer.classList.add("rso-container");

      const titleElement = document.createElement("h2");
      titleElement.textContent = `${event.details.evnt_title}`;

      const timeElement = document.createElement("p");
      timeElement.textContent = `Time: ${event.details.evnt_time}`;

      const descElement = document.createElement("p");
      descElement.innerHTML = event.details.evnt_desc; // Use innerHTML to render HTML content

      eventContainer.appendChild(titleElement);
      eventContainer.appendChild(timeElement);
      eventContainer.appendChild(descElement);

      container.appendChild(eventContainer);
    });
  }

  // Call fetchCombinedInfo function when DOM content is loaded
  fetchCombinedInfo();
});
