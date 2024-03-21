const express = require("express");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const uuid = require("uuid");

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
  //console.log(req.body);

  const userInfo = req.body;
  //console.log("form data for username: " + userInfo.username);
  // Process the form data (you can save it to a database, send emails, etc.)

  // check if signup info not already taken!
  let validSignup = false;
  authenticateUser(userInfo, (err, isValid) => {
    if (err) {
      res.status(500).send(err);
    } else if (!isValid) {
      console.log("inside !isvalid else");
      res.status(401).send("Invalid signup");
      return;
    } else {
      console.log("inside else statement");
      validSignup = true;
      res.status(200).send("Valid signup");
      console.log("valid signup check: " + validSignup);

      let db = new sqlite3.Database(
        "./assets/sqlite.db",
        sqlite3.OPEN_READWRITE,
        (err) => {
          if (err) {
            console.error(err.message);
          }

          let value1 = userInfo.username;
          let value2 = userInfo.password;
          let value3 = String(userInfo.school_email);
          let value4 = userInfo.university_name;
          let value5 = userInfo.loc_name;
          let value6 = String(userInfo.university_desc).replace(/'/g, "''");
          let value7 = userInfo.num_students;
          let sql;

          // Prepare an SQL statement
          if (userInfo.role === "user") {
            sql = `
            INSERT INTO users (usr_id, password, email) VALUES ('${value1}', '${value2}', '${value3}')
          `;
          } else if (userInfo.role === "rso") {
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
    }
  });
});
app.post("/login", (req, res) => {
  // Extract form data from request body
  console.log(req.body);
  let userInfo = req.body;

  authenticateUser(userInfo, (err, isValid) => {
    if (err) {
      res.status(500).send(err);
    } else if (!isValid) {
      res.status(401).send("Valid login");
    } else {
      res.status(200).send("Invalid Login");
    }
  });
});

// Reusable function to authenticate user
const authenticateUser = (userInfo, callback) => {
  console.log(userInfo);
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
        callback("Internal server error");
        return;
      }

      // Define tables to check
      const tablesToCheck = ["super_admins", "admins", "users"];

      // Function to perform a single database query
      const performQuery = (table) => {
        return new Promise((resolve, reject) => {
          db.get(
            `SELECT * FROM ${table} WHERE usr_id = ? AND password = ?`,
            [userInfo.username, userInfo.password],
            (error, row) => {
              if (error) {
                reject(error);
              } else {
                resolve(row);
              }
            }
          );
        });
      };

      // Array of promises for each table query
      const tableQueries = tablesToCheck.map((table) => performQuery(table));

      // Execute all promises concurrently
      Promise.all(tableQueries)
        .then((results) => {
          // Check if any row is found (invalid login)
          results.forEach((result) => console.log(results));
          console.log(results.length);
          const whateverthefuck = results.some((row) => row !== undefined);

          console.log(whateverthefuck);
          if (whateverthefuck) {
            callback(null, false);
            //signup is checking for a true to be true
          } else {
            // If the user is not found in any table, it's a valid login or signup
            //signup is checking for a false ot be true
            callback(null, true);
          }
        })
        .catch((error) => {
          console.error("Error querying tables:", error);
          callback("Internal server error");
        })
        .finally(() => {
          // Close the database connection after all queries are completed
          db.close();
        });
    }
  );
};

app.post("/html/create-Event", (req, res) => {
  // Access form data from req.body
  const { event_title, event_time, event_desc } = req.body;

  // Validate form data
  if (event_title === "" || event_time === "" || event_desc === "") {
    res.status(400).send("All fields are required");
    return;
  }

  // Generate a UUID for event_id
  const event_id = uuid.v4();

  // Open a new database connection
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );

  // Insert the new event
  let sql = `
    INSERT INTO events (evnt_id, evnt_title, evnt_time, evnt_desc) VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [event_id, event_title, event_time, event_desc], function (err) {
    if (err) {
      console.error(err);
      res.status(500).send("Error inserting event into database");
      return;
    }

    console.log(`New event inserted into database`);
    res.status(200).send("Event successfully created");
  });

  // Close the database connection
  db.close();
});

app.post("/html/create-RSO", (req, res) => {
  // Access form data from req.body
  const { RSO_title, RSO_members} = req.body;

  // Validate form data
  if (RSO_title === "" || RSO_members === "") {
    res.status(400).send("All fields are required");
    return;
  }

  // Generate a UUID for RSO_id
  const RSO_id = uuid.v4();

  // Open a new database connection
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );

  // Insert the new RSO
  let sql = `
    INSERT INTO rsos (RSO_id, RSO_title, RSO_members) VALUES (?, ?, ?)
  `;

  db.run(sql, [RSO_id, RSO_title, RSO_members], function (err) {
    if (err) {
      console.error(err);
      res.status(500).send("Error inserting RSO into database");
      return;
    }

    console.log(`New RSO inserted into database`);
    res.status(200).send("RSO successfully created");
  });

  // Close the database connection
  db.close();
});

app.post("/insert_comment", (req, res) => {
  console.log(req.body);
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
        callback("Internal server error");
        return;
      }
    }
  );

  db.close();
});

