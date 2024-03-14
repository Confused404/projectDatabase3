const http = require('http');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const server = http.createServer((req, res) => {
  let filePath = '';

  // Determine the file path based on the requested URL
  if (req.url === '/') {
    filePath = path.join(__dirname, '..', 'index.html');
  } else {
    filePath = path.join(__dirname, '..', req.url);
  }

  // Determine the content type based on file extension
  let contentType = '';
  const extname = path.extname(filePath);
  switch (extname) {
    case '.html':
      contentType = 'text/html';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.js':
      contentType = 'text/javascript';
      break;
    default:
      contentType = 'text/plain';
  }

  // Read the file asynchronously
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(filePath);
      // If file not found, send a 404 Not Found response
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end('404 Not Found');
    } else {
      // Send the file as response with appropriate content type
      res.writeHead(200, {'Content-Type': contentType});
      res.end(data);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
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
      const events = result.events.event;
  
      for(const event of events) {
        const id = event.event_id;
        console.log("event id: " + id);
      }
    });

  })
  .catch(error => {
    // Handle any errors that occurred during fetching
    console.error('Error fetching the XML file:', error);
  });