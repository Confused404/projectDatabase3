const express = require("express");
const fs = require("fs");
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
  authenticateUser(userInfo, "signup", (err, isValid) => {
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

          const userId = uuid.v4();

          let value1 = userId;

          let value2 = setUniquePassword(userInfo.password, hashKey);
          let value3 = String(userInfo.school_email);
          let value4 = userInfo.university_name;
          let value5 = userInfo.loc_name;
          let value6 = String(userInfo.university_desc).replace(/'/g, "''");
          let value7 = userInfo.num_students;
          let value8 = userInfo.name;
          let value9 = userInfo.username;
          let sql;

          // Prepare an SQL statement
          if (userInfo.role === "user") {
            sql = `
            INSERT INTO users (usr_id, name, password, email, username) VALUES ('${value1}', '${value8}', '${value2}', '${value3}', '${value9}')
          `;
          } else if (userInfo.role === "rso") {
            sql = `
            INSERT INTO admins (usr_id, username, password, email) VALUES ('${value1}', '${value9}' ,'${value2}', '${value3}')
          `;
          } else {
            //if its a university

            sql = `
            INSERT INTO universities (usr_id, username,univ_name, loc_name, univ_desc, num_students) VALUES ('${value1}', "${value9}','${value4}', '${value5}', '${value6}', '${value7}')
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

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/login", (req, res) => {
  // Extract form data from request body
  console.log(req.body);
  let userInfo = req.body;

  userInfo.password = String(setUniquePassword(userInfo.password, hashKey)); ///for the love of god dont forget hashkey
  authenticateUser(userInfo, "login", (err, isValid) => {
    if (err) {
      res.status(500).send(err);
    } else if (!isValid) {
      insertIntoSessionTable(true, userInfo.username, userInfo.email);
      console.log("valid login");
      res.redirect('../index.html');
    } else {
      //its not valid
      res.status(200).send("Invalid Login");
    }
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

      if(type === "login"){
        userInfo.password = String(getUniquePassword(userInfo.password, hashKey));
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

  db.get(
    `SELECT * FROM admins WHERE usr_id = ?`,
    [req.session.userId],
    (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error querying database");
        return;
      }

      if (!row) {
        res.status(403).send("Only admins can create events");
        return;
      }

      // Insert the new event
      let sql = `
      INSERT INTO events (evnt_id, evnt_title, evnt_time, evnt_desc) VALUES (?, ?, ?, ?)
    `;

      db.run(
        sql,
        [event_id, event_title, event_time, event_desc],
        function (err) {
          if (err) {
            console.error(err);
            res.status(500).send("Error inserting event into database");
            return;
          }

          console.log(`New event inserted into database`);
          res.status(200).send("Event successfully created");
        }
      );

      // Close the database connection
      db.close();
    }
  );
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

  console.log("req.session.userId: " + req.session.userId);
  console.log("req.session.email: " + req.session.email);
  db.get(
    `SELECT * FROM admins WHERE usr_id = ?`,
    [req.session.userId],
    (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error querying database");
        return;
      }
      console.log("row is:" + row);
      if (!row) {
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
      const adminEmailDomain = req.session.email.split("@")[1];
      const memberPromises = members.map((member) => {
        return new Promise((resolve, reject) => {
          db.get(
            `SELECT * FROM users WHERE name = ? AND email LIKE ?`,
            [member.trim(), `%@${adminEmailDomain}`],
            (err, row) => {
              if (err) {
                reject(err);
              } else if (!row) {
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
          INSERT INTO rsos (usr_id, RSO_id, RSO_title, RSO_members) VALUES ('${req.session.userId}', ?, ?, ?)
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
  const commentInfo = req.body;

  const commentText = commentInfo.commentText;
  const ratingNum = commentInfo.ratingNum;
  const evnt_id = commentInfo.evnt_id;

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

  const sql = `INSERT INTO comments (evnt_id, comnt_text, rating, time_stamp) VALUES (?, ?, ?, ?)`;
  const timestamp = `${formattedMonth}-${formattedDay} ${formattedHour}:${formattedMinute} ${timeIndication}`;
  const params = [evnt_id, commentText, ratingNum, timestamp];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error inserting data:", err.message);
      return;
    }
    console.log(`Rows inserted: ${this.changes}`);
  });
  db.close();
  res.status(200).json({ message: "Comment inserted successfully" });
});

// get the comments from all the events
app.post("/get_comments", (req, res) => {
  const reqBody = req.body;
  console.log("get_comments reqBody: " + reqBody);
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
    console.log(rows);
    res.status(200).json(rows);
  });
  db.close();
});

app.get("/check-login", (req, res) => {
  let db = new sqlite3.Database('./assets/sqlite.db', (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }
    //console.log('Connected to the SQLite database.');

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
        console.log('Close the database connection.');
      });
      return row
        ? res.send({ exists: true, username: row.username })
        : res.send({ exists: false });
    });
  });
  db.close();
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

function insertIntoSessionTable(loggedIn, username, email) {
  let db = new sqlite3.Database('./assets/sqlite.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
  
    db.run(`INSERT INTO session_table(loggedIn, username, email) VALUES(?, ?, ?)`, [loggedIn, username, email], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    db.close();
  });
}