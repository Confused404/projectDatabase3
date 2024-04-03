const rsoServerAddress = "http://127.0.0.1:3000";

fetch(`${rsoServerAddress}/getRSOData`)
  .then((response) => response.json())
  .then((data) => {

    // Create a heading for the records
    const heading1 = document.createElement("h1");
    heading1.innerHTML = "____________________________<br><br>";
    document.body.appendChild(heading1);
    const heading2 = document.createElement("h1");
    heading2.innerHTML = "&emsp;&emsp;&emsp;&emsp;JOIN A RSO!!";
    document.body.appendChild(heading2);
    const heading3 = document.createElement("h1");
    heading3.textContent = "____________________________";
    document.body.appendChild(heading3);
        // Loop through each event record
        data.forEach((record) => {
            // Create a container div for the rso
            const rsoDiv = document.createElement("div");
            rsoDiv.className = "record";
          
            // Create elements for rso details
            const rsoTitle = document.createElement("h1");
            rsoTitle.textContent = record.rso_title;
            rsoDiv.appendChild(rsoTitle);
          
            const rsoMembers = document.createElement("h2");
            rsoMembers.innerHTML = "Members: <br>&emsp;" + record.rso_members;
            rsoDiv.appendChild(rsoMembers); // append rsoMembers to rsoDiv, not to itself
          
            // Check if user has already joined the RSO
            getUserIdFromSession().then((usr_id) => {
                checkIfUserJoinedRso(record.rso_id, usr_id)
                  .then((hasJoined) => {    
                    // Rest of the code...
                    if (!hasJoined) {
                        // joinRsoButton for comment section
                        const joinRsoButton = document.createElement("button");
                        joinRsoButton.textContent = "Join RSO";
                        joinRsoButton.addEventListener("click", function (event) {
                          console.log("join RSO button clicked");
                          // Replace 'rso_id' with the actual RSO id you want to use
                          joinRso(record.rso_id);
                          setTimeout(function() {
                            joinRsoButton.remove();
                            window.location.href = "../html/rso-page.html"; // Replace 'index.html' with the page you want to redirect to
                            //want to add the retrieved name here..
                          }, 500);

                        });
                        // Append the joinRsoButton to the rsoDiv
                        rsoDiv.appendChild(joinRsoButton);
                    }
                    if(hasJoined) {
                        // leaveRsoButton for comment section
                        const leaveRsoButton = document.createElement("button");
                        leaveRsoButton.textContent = "Leave RSO";
                        leaveRsoButton.addEventListener("click", function (event) {
                          console.log("leave RSO button clicked");
                          leaveRso(record.rso_id);
                          setTimeout(function() {
                            leaveRsoButton.remove();
                            window.location.href = "../html/rso-page.html"; // Replace 'index.html' with the page you want to redirect to
                          }, 500);

                        });
                    
                        // Append the leaveRsoButton to the rsoDiv
                        rsoDiv.appendChild(leaveRsoButton);

                    }
                  })
                  .catch((error) => {
                    console.error("Error checking if user joined RSO:", error);
                  });
            });
            document.body.appendChild(rsoDiv);            
        });
  });
          
  function joinRso(rso_id) {
    console.log("inside joinRso function");
  
    return fetch('/join-rso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({ rso_id: rso_id })
    })
    .then((response) => {
      console.log("right after join-rso");
      if (!response.ok) { 
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      } else { 
        console.log(`Done, got ${response.headers.get('content-length')} bytes`);
        console.log("right before update-rso-members");
        // Call the update-rso-members endpoint here
        return fetch('/update-rso-members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rso_id: rso_id }) 
        });
      }
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch((error) => {
      console.error('Request failed:', error);
    });
    
  }

function checkIfUserJoinedRso(rso_id, user_id) {
  
    return fetch(`/check-user-joined-rso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({ rso_id: rso_id, user_id: user_id })
    })
    .then((response) => {
      if (!response.ok) { 
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      } else { 
        return response.json();
      }
    })
    .then((data) => {
      return data.hasJoined;
    })
    .catch((error) => {
      console.error('Request failed:', error);
    });
}

// Function to get usr_id from session table
function getUserIdFromSession() {
    return fetch('/get-user-id', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
    .then((response) => {
      if (!response.ok) { 
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      } else { 
        return response.json();
      }
    })
    .then((data) => {
      return data.usr_id;
    })
    .catch((error) => {
      console.error('Request failed:', error);
    });
  }

  function leaveRso(rso_id) {
    console.log("inside leaveRso function");
  
    return fetch('/leave-rso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({ rso_id: rso_id })
    })
    .then((response) => {
      if (!response.ok) { 
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      } else { 
        console.log(`Done, got ${response.headers.get('content-length')} bytes`);
      }
    })
    .catch((error) => {
      console.error('Request failed:', error);
    });
  }