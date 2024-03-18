
fetch('http://127.0.0.1:3000/getData')
  .then(response => response.json())
  .then(data => {
    // 'data' is an array of objects representing your database records
    // You can use this data to update your HTML
    // For example, you could create a new <p> element for each record:
    data.forEach(record => {
      const div = document.createElement('div'); //creates a div for one record
      div.className = 'record';

      const title = document.createElement('h1');
      title.textContent = record.evnt_title; //get the name of the column from the record
      div.appendChild(title); //add to div

      const time = document.createElement('h2');
      time.textContent = record.evnt_time;
      div.appendChild(time);

      //location should go here

      const desc = document.createElement('p');
      desc.innerHTML = record.evnt_desc;
      div.appendChild(desc);
      
      //add div to the body
      document.body.appendChild(div);
    });
  });