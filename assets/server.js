const express = require("express");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
console.log(path.join(__dirname, ".."));
app.use(express.static(path.join(__dirname, "..")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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

// returns data from events table in DB
app.get("/getData", (req, res) => {
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );

  db.all("SELECT * FROM events", [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });

  db.close();
});

// Setup route to receive signup information
app.post("/signup", (req, res) => {
  // Extract form data from request body
  console.log(req.body);

  const formData = req.body;
  console.log("form data for username: " + formData.username);
  // Process the form data (you can save it to a database, send emails, etc.)
  // For demonstration purposes, let's just send back the received data

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }

      let value1 = formData.username;
      let value2 = formData.password;
      let value3 = String(formData.school_email);
      let value4 = formData.university_name;
      let value5 = formData.loc_name;
      let value6 = String(formData.university_desc).replace(/'/g, "''");
      let value7 = formData.num_students;
      let sql;

      // Prepare an SQL statement
      if (formData.role === "user") {
        sql = `
        INSERT INTO users (usr_id, password, email) VALUES ('${value1}', '${value2}', '${value3}')
      `;
      } else if (formData.role === "rso") {
        sql = `
        INSERT INTO admins (usr_id, password, email) VALUES ('${value1}', '${value2}', '${value3}')
      `;
      } else {
        //if its a university

        sql = `
        INSERT INTO universities (usr_id, univ_name, loc_name, univ_desc, num_students) VALUES ('${value1}', '${value4}', '${value5}', '${value6}', '${value7}')
      `;

        db.run(sql, function (err) {
          if (err) {
            console.error(err);
          }
          console.log("University added to db");
        });

        sql = `
        INSERT INTO super_admins (usr_id, password, email) VALUES ('${value1}', '${value2}', '${value3}')
      `;
      }
      // Execute the insert statement
      db.run(sql, function (err) {
        if (err) {
          console.error(err);
        }
        console.log("account added to db");
      });

      db.close();
    }
  );
});

app.post("/login", (req, res) => {
  // Extract form data from request body
  console.log(req.body);
  let loginInfo = req.body;

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );
  let tablesToCheck = ["superadmin, admin, user"];
  tablesToCheck.forEach((table) => {
    db.get(
      `SELECT * FROM ${table} WHERE usr_id = ? AND password = ?`,
      [loginInfo.username, loginInfo.password],
      (error, row) => {
        if (error) {
          console.log(`Error querying ${table}:`, error);
          return; // Added return statement to exit the callback function on error
        }

        if (row) {
          console.log(`This data exists in ${table}`);
        } else {
          console.log(`This data does not exist in ${table}`);
        }
      }
    );
  });
});
