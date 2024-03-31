const rsoServerAddress = "http://127.0.0.1:3000";

fetch(`${rsoServerAddress}/getRSOData`)
  .then((response) => response.json())
  .then((data) => {

    // Create a heading for the records
    const heading1 = document.createElement("h1");
    heading1.textContent = "JOIN A RSO!!";
    document.body.appendChild(heading1);
    const heading2 = document.createElement("h1");
    heading2.textContent = "____________________________";
    document.body.appendChild(heading2);

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

      document.body.appendChild(rsoDiv);

    });
    })
    .catch((error) => {
    console.error("Error fetching event data:", error);
    })