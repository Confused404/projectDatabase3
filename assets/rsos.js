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
    
        // joinRsoButton for comment section
        const joinRsoButton = document.createElement("button");
        joinRsoButton.textContent = "Join RSO";
        joinRsoButton.addEventListener("click", function (event) {
            console.log("join RSO button clicked");
            // Replace 'rso_id' with the actual RSO id you want to use
            joinRso(record.rso_id);
            setTimeout(function() {
                joinRsoButton.remove();
            }, 1000);
        });
    
        // Append the joinRsoButton to the rsoDiv
        rsoDiv.appendChild(joinRsoButton);
    
        document.body.appendChild(rsoDiv);
    });
  })
  .catch((error) => {
    console.error("Error fetching rso data:", error);
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