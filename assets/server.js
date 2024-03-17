

const express = require('express');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

const app = express();
const PORT = 8080;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..' , 'index.html')));
app.use(express.static(path.join(__dirname, 'assets')));

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
  res.sendFile(path.join(__dirname, 'styles.css'));
  res.sendFile(path.join(__dirname, 'main.js'));
});
// URL of the XML file you want to fetch
const url = 'https://events.ucf.edu/2024/3/4/feed.xml';

// Fetch the XML file using Fetch API
fetch('https://events.ucf.edu/feed.xml')
  .then(response => {
    // Check if the response is successful (status code in the range 200-299)
    if (response.ok) {
      // Read the response as text
      return response.text();
    } else {
      // If the response is not successful, throw an error
      throw new Error('Failed to fetch the XML file');
    }
  })
  .then(xmlData => {
    xml2js.parseString(xmlData, (err, result) => {
      if (err) {
        throw err;
      }
      let db = new sqlite3.Database('./assets/sqlite.db', (err) => {
        if (err) {
          console.error(err.message);
        }
        else {
          console.log('Connected to the SQLite database.');
          const events = result.events.event;


          for (const event of events) {
            const event_id = event.event_id;
            const event_time = event.start_date;
            const event_desc = event.description;
            const loc_name = event.location;

            let value1 = event_id;
            let value2 = event_time;
            let value3 = String(event_desc).replace(/'/g, "''");
            let value4 = String(loc_name).replace(/'/g, "''");
            
            
            let sql = `
              INSERT INTO events (evnt_id, evnt_time, evnt_desc) VALUES ('${value1}', '${value2}', '${value3}')
            `;
            
            //INSERT INTO loaction_table (loc_name, addy, longitude, latitude) VALUES ()
            //what should we do for the usr_ids of the ucf events?
            
            // Execute the insert statement
            db.run(sql, function(err) {
              if (err) {
                console.error(err);
              }
              console.log(`Rows inserted events`);
            });
            
            sql = `
              INSERT INTO at (loc_name, evnt_id) VALUES ('${value4}', '${value1}')
            `;

            db.run(sql, function(err) {
              if (err) {
                console.error(err);
              }
              console.log(`Rows inserted into at`);
            });
            
          }
          db.close();
        }
      });
    });
  })
  .catch(error => {
    // Handle any errors that occurred during fetching
    console.error('Error fetching the XML file:', error);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
