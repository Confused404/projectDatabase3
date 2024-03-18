const express = require("express");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");

const app = express();
const PORT = 8080;

// Serve static files from the 'public' directory
console.log(path.join(__dirname, ".."));
app.use(express.static(path.join(__dirname, "..")));

// URL of the XML file you want to fetch
const url = "https://events.ucf.edu/2024/3/4/feed.xml";

// Fetch the XML file using Fetch API
fetch("https://events.ucf.edu/feed.xml")
  .then((response) => {
    // Check if the response is successful (status code in the range 200-299)
    if (response.ok) {
      // Read the response as text
      return response.text();
    } else {
      // If the response is not successful, throw an error
      throw new Error("Failed to fetch the XML file");
    }
  })
  .then((xmlData) => {
    xml2js.parseString(xmlData, (err, result) => {
      if (err) {
        throw err;
      }
      let db = new sqlite3.Database("./assets/sqlite.db", (err) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log("Connected to the SQLite database.");
          const events = result.events.event;

          for (const event of events) {
            const event_id = event.event_id;
            const event_time = event.start_date;
            const event_desc = event.description;
            const loc_name = event.location;
            const event_title = event.title;

            let value1 = event_id;
            let value2 = String(event_time).replace(/-0400/g, "");
            let value3 = String(event_desc).replace(/'/g, "''");
            let value4 = String(loc_name).replace(/'/g, "''");
            let value5 = String(event_title).replace(/'/g, "''");

            let sql = `
              INSERT INTO events (evnt_id, evnt_title, evnt_time, evnt_desc) VALUES ('${value1}', '${value5}', '${value2}', '${value3}')
            `;

            //INSERT INTO loaction_table (loc_name, addy, longitude, latitude) VALUES ()
            //what should we do for the usr_ids of the ucf events?

            // Execute the insert statement
            db.run(sql, function (err) {
              if (err) {
                console.error(err);
              }
              console.log(`Rows inserted into: events`);
            });

            sql = `
              INSERT INTO at (loc_name, evnt_id) VALUES ('${value4}', '${value1}')
            `;

            db.run(sql, function (err) {
              if (err) {
                console.error(err);
              }
              console.log(`Rows inserted into: at`);
            });
          }
          db.close();
        }
      });
    });
  })
  .catch((error) => {
    // Handle any errors that occurred during fetching
    console.error("Error fetching the XML file:", error);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get('/getData', (req, res) => {
  let db = new sqlite3.Database("./assets/sqlite.db", sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    }
  });

  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });

  db.close();
});