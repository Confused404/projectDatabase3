const express = require("express");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const xml2js = require("xml2js");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const session = require("express-session");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 3000;

const hashKey = process.env.HASH_KEY;
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
console.log(apiKey);

// Serve static files from the 'public' directory
console.log(path.join(__dirname, ".."));
app.use(express.static(path.join(__dirname, "..")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "cant hack us nahnahnahnahnah",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

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
          if (events) {
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
              let value6 = "true";

              let sql = `
                INSERT INTO events (evnt_id, evnt_title, evnt_time, evnt_desc, approved) VALUES ('${value1}', '${value5}', '${value2}', '${value3}', '${value6}')
              `;

              //INSERT INTO loaction_table (loc_name, addy, longitude, latitude) VALUES ()
              //what should we do for the usr_ids of the ucf events?

              // Execute the insert statement
              db.run(sql, function (err) {
                if (err) {
                  //console.error(err);
                }
              });

              sql = `
                INSERT INTO at (loc_name, evnt_id) VALUES ('${value4}', '${value1}')
              `;

              db.run(sql, function (err) {
                if (err) {
                  //console.error(err);
                }
              });

              sql = `
                INSERT INTO public_events (evnt_id, evnt_title, evnt_time, evnt_desc) VALUES ('${value1}', '${value5}', '${value2}', '${value3}')
              `;

              db.run(sql, function (err) {
                if (err) {
                  //console.error(err);
                }
              });
            }
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

//////////////////////////////////////////////////////////////////////////////////////////////
app.get("/getApprovedEvents", (req, res) => {
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );

  const tables = ["public_events", "private_events", "rso_events"];
  const results = {};

  // First, get the approved events
  db.all(
    `SELECT * FROM events WHERE approved = 'true'`,
    [],
    async (err, approvedEvents) => {
      if (err) {
        throw err;
      }
      // Filter out the events whose evnt_id does not begin with 8
      const filteredEvents = approvedEvents.filter(
        (event) => !event.evnt_id.toString().startsWith("8")
      );

      // Log each of these events
      filteredEvents.forEach((event) => {
        console.log(event);
      });

      // Then, for each approved event, find its details in the respective table
      const promises = approvedEvents.map(async (event) => {
        const tablePromises = tables.map((table) => {
          return new Promise((resolve, reject) => {
            getRowFromTable(db, table, event.evnt_id)
              .then((row) => {
                //console.log(row);
                if (row) {
                  if (table === "private_events") {
                    // Get the domain from the email in the session table
                    db.get(
                      `SELECT SUBSTR(email, INSTR(email, '@') + 1) AS domain FROM session_table`,
                      [],
                      (err, sessionRow) => {
                        if (err) {
                          reject(err);
                        }

                        // Get the usr_id from the creates table
                        db.get(
                          `SELECT usr_id FROM Creates WHERE evnt_id = ?`,
                          [event.evnt_id],
                          (err, createsRow) => {
                            if (err) {
                              reject(err);
                            }

                            // Check if the usr_id exists in the admins table with the same domain
                            db.get(
                              `SELECT *, SUBSTR(email, INSTR(email, '@') + 1) AS admin_domain FROM admins WHERE usr_id = ?`,
                              [createsRow.usr_id],
                              (err, adminRow) => {
                                if (err) {
                                  reject(err);
                                }

                                // If the usr_id exists in the admins table and the domain matches the session domain, add the event to the results
                                if (
                                  adminRow &&
                                  adminRow.admin_domain === sessionRow.domain
                                ) {
                                  if (!results[table]) {
                                    results[table] = [];
                                  }

                                  results[table].push(row);
                                }
                                resolve();
                              }
                            );
                          }
                        );
                      }
                    );
                  } else {
                    if (!results[table]) {
                      results[table] = [];
                    }
                    results[table].push(row);
                    resolve();
                  }
                } else {
                  resolve();
                }
              })
              .catch((err) => {
                console.log("SQL Error:", err); // Log SQL errors
                resolve();
              });
          });
        });

        return Promise.all(tablePromises);
      });

      Promise.all(promises).then(() => {
        res.json(results);
        db.close();
      });
    }
  );
});

const getRowFromTable = (db, table, evnt_id) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM ${table} WHERE evnt_id = ?`,
      [evnt_id],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      }
    );
  });
};

app.get("/getRSOData", (req, res) => {
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );

  db.all("SELECT * FROM rsos", [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });

  db.close();
});

app.post("/signup", (req, res) => {
  const userInfo = req.body;

  authenticateUser(userInfo, "signup", (err, isValid) => {
    if (err) {
      return res.status(500).send(err);
    } else if (!isValid) {
      return res.status(401).send("Invalid signup");
    } else {
      const db = new sqlite3.Database(
        "./assets/sqlite.db",
        sqlite3.OPEN_READWRITE,
        (err) => {
          if (err) {
            console.error(err.message);
            return res.status(500).send(err.message);
          }

          const userId = uuid.v4();
          const value1 = userId;
          const value2 = setUniquePassword(userInfo.password, hashKey);
          const value3 = String(userInfo.school_email);
          const value4 = userInfo.university_name;
          const value5 = userInfo.loc_name;
          const value6 = String(userInfo.university_desc).replace(/'/g, "''");
          const value7 = userInfo.num_students;
          const value8 = userInfo.name;
          const value9 = userInfo.username;
          let sql;

          if (userInfo.role === "user") {
            sql = `INSERT INTO users (usr_id, name, password, email, username) VALUES (?, ?, ?, ?, ?)`;
          } else if (userInfo.role === "rso") {
            sql = `INSERT INTO admins (usr_id, username, password, email) VALUES (?, ?, ?, ?)`;
          } else {
            sql = `INSERT INTO universities (usr_id, univ_name, loc_name, univ_desc, num_students) VALUES (?, ?, ?, ?, ?)`;

            db.run(
              sql,
              [value1, value4, value5, value6, value7],
              function (err) {
                if (err) {
                  console.error(err);
                } else {
                  console.log("University added to db");
                }
              }
            );

            sql = `INSERT INTO super_admins (usr_id, username, password, email) VALUES (?, ?, ?, ?)`;
          }

          db.run(sql, [value1, value8, value2, value3, value9], function (err) {
            if (err) {
              console.error(err);
              return res.status(500).send(err.message);
            }

            console.log("Account added to db");
            db.close();

            // After signup, attempt login
            axios
              .post("http://localhost:3000/login", userInfo)
              .then((response) => {
                if (response.data === "OK") {
                  // Login successful, redirect to index.html
                  return res.send(userInfo);
                } else {
                  // Login failed
                  return res.status(401).send("Invalid login");
                }
              })
              .catch((error) => {
                console.error("Error during login:", error);
                return res.status(500).send("Internal Server Error");
              });
          });
        }
      );
    }
  });
});

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/login", (req, res) => {
  // Extract form data from request body
  let userInfo = req.body;

  userInfo.password = String(setUniquePassword(userInfo.password, hashKey)); ///for the love of god dont forget hashkey
  authenticateUser(userInfo, "login", (err, isValid) => {
    if (err) {
      res.status(500).send(err);
    } else if (!isValid) {
      insertIntoSessionTable(
        true,
        userInfo.username,
        userInfo.school_email,
        userInfo.userId,
        userInfo.role
      );

      res.send("OK");
    } else {
      //its not valid
      res.status(401).send("Invalid Login");
    }
  });
});

//server side deletion of the session_table from the db
app.delete("/sign-out", (req, res) => {
  let db = new sqlite3.Database("./assets/sqlite.db", (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }

    let sql = `DELETE FROM session_table`;
    db.run(sql, (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
      }
      db.close((err) => {
        if (err) {
          console.error(err.message);
        }
        console.log("Close the database connection.");
      });
      return res.send({ success: true });
    });
  });
});

// Reusable function to authenticate user
const authenticateUser = (userInfo, type, callback) => {
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
      userInfo.username = userInfo.username;

      if (type === "login") {
        userInfo.password = String(
          getUniquePassword(userInfo.password, hashKey)
        );
      }

      // Function to perform a single database query
      const performQuery = (table) => {
        return new Promise((resolve, reject) => {
          db.get(
            `SELECT * FROM ${table} WHERE username = ? AND password = ?`,
            [userInfo.username, userInfo.password],
            (error, row) => {
              if (error) {
                reject(error);
              } else {
                resolve({ row, table }); //made it an object
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
          const validResult = results.find(
            (result) => result.row !== undefined
          );

          //console.log("validResult: " + validResult.table);
          if (type == "login" && validResult) {
            // Use the table name to determine the user's role
            if (validResult.table == "users") {
              userInfo.role = "user";
            } else if (validResult.table == "admins") {
              userInfo.role = "admin";
            } else {
              userInfo.role = "super_admin";
            }
            userInfo.userId = validResult.row.usr_id;
          }
          if (validResult) {
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

app.post("/create-Event", (req, res) => {
  // Data from req.body

  const {
    event_month,
    event_day,
    event_year,
    event_hour,
    event_minute,
    event_ampm,
  } = req.body;

  // Create a Date object with the provided day, month, and year
  const timestampDate = new Date(`${event_month} ${event_day}, ${event_year}`);

  // Get the weekday name (short form)
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayName = weekdays[timestampDate.getDay()];

  // Convert hour to 24-hour format
  let hour = parseInt(event_hour, 10);
  if (event_ampm === "PM" && hour !== 12) {
    hour += 12;
  } else if (event_ampm === "AM" && hour === 12) {
    hour = 0;
  }

  // Construct timestamp string
  const event_time = `${weekdayName}, ${event_day} ${event_month} ${event_year} ${hour
    .toString()
    .padStart(2, "0")}:${event_minute.padStart(2, "0")}:00`;

  const { event_title, event_desc, addy, loc_name, lat, long } = req.body;

  console.log("location check ", req.body);
  // Validate form data

  if (event_title === "" || event_time === "" || event_desc === "") {
    res.status(400).send("All fields are required");
    return;
  }

  // Check the event type and set the table name
  let tableName;
  switch (req.body.event_type) {
    case "public":
      tableName = "public_events";
      break;
    case "private":
      tableName = "private_events";
      break;
    case "rso":
      tableName = "rso_events";
      break;
    default:
      console.error("Invalid event type:", req.body.event_type);
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
  db.get(`SELECT usr_id FROM session_table LIMIT 1`, [], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error querying session_table");
      return;
    }

    if (!row) {
      res.status(403).send("No session found");
      return;
    }
    console.log(row);
    let userId = row.usr_id;

    db.get(`SELECT * FROM admins WHERE usr_id = ?`, [userId], (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error querying database");
        return;
      }

      if (!row) {
        res.status(403).send("Only admins can create events");
        return;
      }

      // Insert into 'events' table
      const insertIntoEvents = (event_type) => {
        console.log("inside insertIntoEvents, event type is: " + event_type);
        let sql = `
          INSERT INTO events (evnt_id, evnt_title, evnt_time, evnt_desc, approved, evnt_type) VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(
          sql,
          [event_id, event_title, event_time, event_desc, false, event_type],
          function (err) {
            if (err) {
              console.error(err);
              //res.status(500).send("Error inserting event into database");
              return;
            }
            console.log(`New event inserted into events`);
            //res.status(200).send("Event successfully created");
          }
        );
      };

      // Insert into other tables
      const insertIntoOtherTable = (tableName) => {
        let sql = `
          INSERT INTO '${tableName}' (evnt_id, evnt_title, evnt_time, evnt_desc) VALUES (?, ?, ?, ?)
        `;

        db.run(
          sql,
          [event_id, event_title, event_time, event_desc],
          function (err) {
            if (err) {
              console.error(err);
              res.status(500).send("Error inserting event into database");
              return;
            } else {
              console.log(`New event inserted into ${tableName}`);
              res.status(200).send("Event successfully created");
            }
          }
        );
      };

      const insertIntoAt = () => {
        let sql = `
            INSERT INTO at (evnt_id, loc_name) VALUES (?, ?)
        `;

        db.run(sql, [event_id, loc_name], function (err) {
          if (err) {
            console.error(err);
            // Handle error if needed
            return;
          }
          console.log(`New entry inserted into at`);
          // Handle success if needed
        });
      };
      const insertIntoLocationTable = () => {
        let sql = `
            INSERT INTO location_table (loc_name, addy, longitude, latitude) VALUES (?, ?, ?, ?)
        `;

        db.run(sql, [loc_name, addy, long, lat], function (err) {
          if (err) {
            console.error(err);
            // Handle error if needed
            return;
          }
          console.log(`New entry inserted into location_table`);
          // Handle success if needed
        });
      };

      const insertIntoCreates = (userId, eventId) => {
        let sql = `
          INSERT INTO Creates (usr_id, evnt_id) VALUES (?, ?)
        `;

        db.run(sql, [userId, eventId], function (err) {
          if (err) {
            console.error(err);
            res.status(500).send("Error inserting into creates table");
            return;
          }
          console.log(`New record inserted into creates`);
        });
      };

      // Call the functions
      insertIntoEvents(req.body.event_type);
      insertIntoOtherTable(tableName);
      insertIntoAt();
      insertIntoLocationTable();
      insertIntoCreates(userId, event_id);

      // Close the database connection
      db.close();
    });
  });
});

app.post("/html/create-RSO", (req, res) => {
  // Access form data from req.body
  const { RSO_title, RSO_members } = req.body;

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

  let sql = `SELECT * FROM session_table LIMIT 1`;
  db.get(sql, (err, row1) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }

    db.get(
      `SELECT * FROM admins WHERE usr_id = ?`,
      [row1.usr_id],
      (err, row2) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error querying database");
          return;
        }
        //console.log("row is:" + row.role);
        if (row1.role != "admin") {
          res.status(403).send("Only admins can create RSOs");
          return;
        }

        // Validate RSO_members
        const members = RSO_members.split(",");
        if (members.length < 4) {
          res.status(400).send("At least 4 members are required");
          return;
        }

        // Check if all members exist in the database
        const adminEmailDomain = row1.email.split("@")[1];
        const memberPromises = members.map((member) => {
          return new Promise((resolve, reject) => {
            db.get(
              `SELECT * FROM users WHERE name = ? AND email LIKE ?`,
              [member.trim(), `%@${adminEmailDomain}`],
              (err, row3) => {
                if (err) {
                  reject(err);
                } else if (!row3) {
                  //console.log("admin email handle: " + adminEmailDomain);
                  reject(
                    new Error(
                      `Member ${member} does not exist in the database or does not have the same email domain as the admin`
                    )
                  );
                } else {
                  resolve();
                }
              }
            );
          });
        });

        Promise.all(memberPromises)
          .then(() => {
            // Insert the new RSO
            let sql = `
            INSERT INTO rsos (usr_id, RSO_id, RSO_title, RSO_members) VALUES ('${row1.usr_id}', ?, ?, ?)
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
          })
          .catch((err) => {
            console.error(err);
            res.status(400).send(err.message);
          })
          .finally(() => {
            // Close the database connection
            db.close();
          });
      }
    );
  });
});

app.post("/get_event_id", (req, res) => {
  const reqBody = req.body;
  const eventTitle = reqBody.eventTitle;
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
  const sql = "SELECT evnt_id FROM events WHERE evnt_title = ?";
  db.get(sql, [eventTitle], (err, row) => {
    if (err) {
      throw err;
    }
    if (row) {
      // console.log("server side eventId:", row);
      const eventId = row.evnt_id;
      res.status(200).send(eventId.toString());
    } else {
      console.log("No event found with the specified title.");
      res.status(404);
    }
  });
  db.close();
});

// place comment in db
app.post("/insert_comment", (req, res) => {
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
  let session_info = null;
  axios
    .get(`http://localhost:${PORT}/get_session_info`)
    .then((response) => {
      // Handle the response from the GET request
      // You can access the response data using response.data
      console.log("response session info: " + JSON.stringify(response.data));
      session_info = response.data;
      const commentInfo = req.body;
      const commentText = commentInfo.commentText;
      const ratingNum = commentInfo.ratingNum;
      const evnt_id = commentInfo.evnt_id;
      const comment_id = uuid.v4();

      const timestamp = generateTimestamp();
      const sql = `INSERT INTO comments (comment_id, evnt_id, comnt_text, rating, time_stamp, username) VALUES (?, ?, ?, ?, ?, ?)`;
      const params = [
        comment_id,
        evnt_id,
        commentText,
        ratingNum,
        timestamp,
        session_info.username,
      ];

      db.run(sql, params, function (err) {
        if (err) {
          console.error("Error inserting data:", err.message);
          return;
        }
        console.log(`Rows inserted into comments: ${this.changes}`);
      });
      db.close();
      res.status(200).json({ message: "Comment inserted successfully" });
    })
    .catch((error) => {
      // Handle errors if any
      console.error(error);
    });
});

// get the comments from all the events
app.post("/get_comments", (req, res) => {
  const reqBody = req.body;
  const evnt_id = reqBody.evnt_id;
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

  const sql = "SELECT * FROM comments WHERE evnt_id = ?";
  db.all(sql, [evnt_id], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Internal server error");
      return;
    }
    res.status(200).json(rows);
  });
  db.close();
});

app.get("/get_session_info", (req, res) => {
  let db = new sqlite3.Database("./assets/sqlite.db", (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }

    let sql = `SELECT * FROM session_table LIMIT 1`;
    db.get(sql, (err, row) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
      }
      db.close((err) => {
        if (err) {
          console.error(err.message);
        }
        console.log("Close the database connection.");
      });
      return row
        ? res.send({
            exists: true,
            username: row.username,
            email: row.email,
            usr_id: row.usr_id,
            role: row.role,
          })
        : res.send({ exists: false });
    });
  });
});

function setUniquePassword(text, key) {
  return text;
  console.log("text: " + text + "key: " + key);

  key = crypto
    .createHash("sha256")
    .update(String("dumbfuck"))
    .digest("base64")
    .substring(0, 32);
  const iv = crypto.randomBytes(16); // Generate a random initialization vector (IV)
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  console.log("here");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // Prepend IV to the ciphertext
}
function getUniquePassword(encryptedText, key) {
  return encryptedText;
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts.shift(), "hex"); // Extract IV from the ciphertext
  const encrypted = parts.join(":");
  console.log("encryptedtext: " + encryptedText + "key: " + key);
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function insertIntoSessionTable(loggedIn, username, email, userId, role) {
  let db = new sqlite3.Database("./assets/sqlite.db", (err) => {
    console.log();
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the SQlite database.");
    console.log("email: " + email);
    db.run(
      `INSERT INTO session_table(loggedIn, username, email, usr_id, role) VALUES(?, ?, ?, ?, ?)`,
      [loggedIn, username, email, userId, role],
      function (err) {
        if (err) {
          return console.log(err.message);
        }
      }
    );
    db.close();
  });
}
app.post("/join-rso", function (req, res) {
  let rso_id = req.body.rso_id;

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
      }
      console.log("Connected to the database.");

      db.serialize(() => {
        console.log("inside serialize");

        // First, get the usr_id from the session_table
        db.get(`SELECT usr_id FROM session_table LIMIT 1`, [], (err, row) => {
          if (err) {
            console.error(err.message);
            return res.status(500).send(err.message);
          }

          let usr_id = row ? row.usr_id : null;

          if (usr_id) {
            // Then, insert the rso_id and usr_id into the join_table
            db.run(
              `INSERT INTO join_table(rso_id, usr_id) VALUES (?, ?)`,
              [rso_id, usr_id],
              function (err) {
                if (err) {
                  console.error(err.message);
                  return res.status(500).send(err.message);
                }
                console.log(`Row(s) inserted: ${this.changes}`);

                db.close((err) => {
                  if (err) {
                    console.error(err.message);
                    return res.status(500).send(err.message);
                  }
                  console.log("Close the database connection.");
                  res.send("RSO joined");
                });
              }
            );
          } else {
            res.status(400).send("User not found in session_table");
          }
        });
      });
    }
  );
});

app.post("/join-event", function (req, res) {
  let evnt_id = req.body.evnt_id;

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the database.");

      db.serialize(() => {
        console.log("inside serialize");

        // First, get the usr_id from the session_table
        db.get(`SELECT usr_id FROM session_table LIMIT 1`, [], (err, row) => {
          if (err) {
            return console.error(err.message);
          }

          let usr_id = row ? row.usr_id : null;

          if (usr_id) {
            // Then, insert the evnt_id and usr_id into the join_table
            db.run(
              `INSERT INTO join_table(evnt_id, usr_id) VALUES (?, ?)`,
              [evnt_id, usr_id],
              function (err) {
                if (err) {
                  return console.error(err.message);
                }
                console.log(`Row(s) inserted: ${this.changes}`);
              }
            );
          }
        });

        db.close((err) => {
          if (err) {
            console.error(err.message);
          }
          console.log("Close the database connection.");
        });
      });

      res.send("Event joined");
    }
  );
});

// POST /edit_comment endpoint to edit a comment
app.post("/edit_comment", (req, res) => {
  // Establish connection to the database
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

  const { comment_id, message, rating } = req.body;

  // Check if comment_id, message, and rating are provided
  if (!comment_id || !message || rating === undefined) {
    return res
      .status(400)
      .json({ error: "Comment ID, message, and rating are required." });
  }

  const newTimestamp = generateTimestamp();
  // Update the comment in the database
  db.run(
    "UPDATE comments SET comnt_text = ?, time_stamp = ?, rating = ? WHERE comment_id = ?",
    [message, newTimestamp, rating, comment_id],
    function (err) {
      if (err) {
        console.error("Error updating comment:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      console.log(`Comment with ID ${comment_id} updated successfully.`);
      res.status(200).json({
        message: "Comment updated successfully.",
        timestamp: newTimestamp,
      });
    }
  );

  // Close the database connection
  db.close();
});

app.post("/delete_comment", (req, res) => {
  const requestBody = req.body;
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
  // Check if comment_id is provided
  if (!requestBody.comment_id) {
    return res.status(400).json({ error: "Comment ID is required." });
  }

  // Delete the comment from the database
  db.run(
    "DELETE FROM comments WHERE comment_id = ?",
    [requestBody.comment_id],
    function (err) {
      if (err) {
        console.error("Error deleting comment:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      console.log(
        `Comment with ID ${requestBody.comment_id} deleted successfully.`
      );
      res.status(200).json({ message: "Comment deleted successfully." });
    }
  );
});

app.post("/update-rso-members", function (req, res) {
  let rso_id = req.body.rso_id; // Get the rso_id from the request body

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the database.");

      db.serialize(() => {
        console.log("inside update-rso-members");

        // First, get the usr_id from the session_table
        db.get(`SELECT usr_id FROM session_table LIMIT 1`, [], (err, row) => {
          if (err) {
            return console.error(err.message);
          }

          let usr_id = row ? row.usr_id : null;

          if (usr_id) {
            // Then, get the name from the users table
            db.get(
              `SELECT name FROM users WHERE usr_id = ?`,
              [usr_id],
              (err, row) => {
                if (err) {
                  return console.error(err.message);
                }

                let name = row ? row.name : null;

                if (name) {
                  // Then, update the rso_members in the rso table
                  db.run(
                    `UPDATE rsos SET rso_members = rso_members || ', ' || ? WHERE rso_id = ?`,
                    [name, rso_id],
                    function (err) {
                      if (err) {
                        return console.error(err.message);
                      }
                      console.log("added to rso_list");
                      console.log(`Row(s) updated: ${this.changes}`);
                    }
                  );
                }
              }
            );
          }
        });

        db.close((err) => {
          if (err) {
            console.error(err.message);
          }
          console.log("Close the database connection.");
        });
        res.send("RSO members updated");
      });
    }
  );
});

app.post("/check-user-joined-event", function (req, res) {
  let evnt_id = req.body.evnt_id;

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the database.");

      db.serialize(() => {
        console.log("inside serialize");

        // First, get the usr_id from the session_table
        db.get(`SELECT usr_id FROM session_table LIMIT 1`, [], (err, row) => {
          if (err) {
            return console.error(err.message);
          }

          let usr_id = row ? row.usr_id : null;

          if (usr_id && evnt_id) {
            // Then, check if the user has joined the event
            db.get(
              `SELECT * FROM join_table WHERE evnt_id = ? AND usr_id = ?`,
              [evnt_id, usr_id],
              function (err, row) {
                if (err) {
                  return console.error(err.message);
                }

                // If the row exists, the user has joined the event
                let hasJoined = row ? true : false;
                res.json({ hasJoined: hasJoined });
              }
            );
          } else {
            res.json({ hasJoined: false });
          }
        });

        db.close((err) => {
          if (err) {
            console.error(err.message);
          }
          console.log("Close the database connection.");
        });
      });
    }
  );
});

app.post("/check-user-joined-rso", function (req, res) {
  let rso_id = req.body.rso_id;

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the database.");

      db.serialize(() => {
        console.log("inside serialize");

        // First, get the usr_id from the session_table
        db.get(`SELECT usr_id FROM session_table LIMIT 1`, [], (err, row) => {
          if (err) {
            return console.error(err.message);
          }

          let usr_id = row ? row.usr_id : null;

          if (usr_id && rso_id) {
            // Then, check if the user has joined the RSO
            db.get(
              `SELECT * FROM join_table WHERE rso_id = ? AND usr_id = ?`,
              [rso_id, usr_id],
              function (err, row) {
                if (err) {
                  return console.error(err.message);
                }

                // If the row exists, the user has joined the RSO
                let hasJoined = row ? true : false;
                console.log("hasJoined: " + hasJoined);
                res.json({ hasJoined: hasJoined });
              }
            );
          } else {
            res.json({ hasJoined: false });
          }
        });

        db.close((err) => {
          if (err) {
            console.error(err.message);
          }
          console.log("Close the database connection.");
        });
      });
    }
  );
});

app.get("/get-user-id", (req, res) => {
  let db = new sqlite3.Database("./assets/sqlite.db", (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the database.");
  });

  // Query the session table to get the usr_id
  db.get(
    "SELECT usr_id FROM session_table WHERE loggedIn = ?",
    [1],
    (err, row) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("Error querying the database");
      } else if (row) {
        console.log("get-user-id works");
        res.json({ usr_id: row.usr_id });
      } else {
        res.status(404).send("Session not found");
      }
    }
  );
});

app.post("/leave-rso", function (req, res) {
  let rso_id = req.body.rso_id; // Get the rso_id from the request body

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the database.");

      db.serialize(() => {
        console.log("inside leave-rso");

        // First, get the usr_id from the session_table
        db.get(`SELECT usr_id FROM session_table LIMIT 1`, [], (err, row) => {
          if (err) {
            return console.error(err.message);
          }

          let usr_id = row ? row.usr_id : null;

          if (usr_id) {
            // Then, get the name from the users table
            db.get(
              `SELECT name FROM users WHERE usr_id = ?`,
              [usr_id],
              (err, row) => {
                if (err) {
                  return console.error(err.message);
                }

                let name = row ? row.name : null;

                if (name) {
                  // Then, remove the user from the join_table
                  db.run(
                    `DELETE FROM join_table WHERE usr_id = ? AND rso_id = ?`,
                    [usr_id, rso_id],
                    function (err) {
                      if (err) {
                        return console.error(err.message);
                      }
                      console.log(`Row(s) deleted: ${this.changes}`);

                      // Then, update the rso_members in the rso table
                      db.run(
                        `UPDATE rsos SET rso_members = REPLACE(rso_members, ', ' || ?, '') WHERE rso_id = ?`,
                        [name, rso_id],
                        function (err) {
                          if (err) {
                            return console.error(err.message);
                          }
                          console.log(`Row(s) updated: ${this.changes}`);
                        }
                      );
                    }
                  );
                }
              }
            );
          }
        });

        db.close((err) => {
          if (err) {
            console.error(err.message);
          }
          console.log("Close the database connection.");
        });
        res.send("RSO members updated");
      });
    }
  );
});
function generateTimestamp() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  let hour = now.getHours();
  const minute = now.getMinutes();
  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;
  let timeIndication = "AM";
  if (hour > 12) {
    hour -= 12;
    timeIndication = "PM";
  }
  const formattedHour = hour < 10 ? `0${hour}` : hour;
  const formattedMinute = minute < 10 ? `0${minute}` : minute;
  const timestamp = `${formattedMonth}-${formattedDay} ${formattedHour}:${formattedMinute} ${timeIndication}`;
  return timestamp;
}

app.post("/approveEvent", (req, res) => {
  const { eventId } = req.body;
  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
        res.json({ success: false, error: err.message });
      } else {
        db.run(
          `UPDATE events SET approved = 'true' WHERE evnt_id = ?`,
          [eventId],
          function (err) {
            if (err) {
              console.error(err.message);
              res.json({ success: false, error: err.message });
            } else {
              res.json({ success: true });
            }
          }
        );
        db.close();
      }
    }
  );
});

app.delete("/rejectEvent", (req, res) => {
  const { eventId, eventType } = req.body;
  let tableName;
  switch (eventType) {
    case "public":
      tableName = "public_events";
      break;
    case "private":
      tableName = "private_events";
      break;
    case "rso":
      tableName = "rso_events";
      break;
    default:
      console.error("Invalid event type:", eventType);
      return;
  }

  let db = new sqlite3.Database(
    "./assets/sqlite.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
        res.json({ success: false, error: err.message });
      } else {
        db.run(
          `DELETE FROM '${tableName}' WHERE evnt_id = ?`,
          [eventId],
          function (err) {
            if (err) {
              console.error(err.message);
              res.json({ success: false, error: err.message });
            } else {
              db.run(
                `DELETE FROM events WHERE evnt_id = ?`,
                [eventId],
                function (err) {
                  if (err) {
                    console.error(err.message);
                    res.json({ success: false, error: err.message });
                  } else {
                    res.json({ success: true });
                  }
                }
              );
            }
          }
        );
        db.close();
      }
    }
  );
});

app.get("/getUnapprovedEvents", (req, res) => {
  let db = new sqlite3.Database("./assets/sqlite.db", (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the database.");
  });

  // Get the email of the currently logged in user from the session table
  db.get(`SELECT email FROM session_table LIMIT 1`, [], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error querying session_table");
      return;
    }

    if (!row) {
      res.status(403).send("No session found");
      return;
    }

    const userEmailDomain = row.email.split("@")[1];

    // Get the unapproved events created by admins with the same email domain
    const sql = `
      SELECT events.* 
      FROM events 
      JOIN Creates ON events.evnt_id = Creates.evnt_id 
      JOIN admins ON Creates.usr_id = admins.usr_id 
      WHERE admins.email LIKE ? AND events.approved = 0
    `;

    db.all(sql, [`%@${userEmailDomain}`], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error querying events");
        return;
      }

      res.json(rows);
    });
  });
});

// Route to serve HTML with API key injected
app.get("/create-event-page", (req, res) => {
  res.render("create-event-page", { apiKey });
});
