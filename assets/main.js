let log = console.log;
let buttons = document.querySelectorAll(".user");

// Add event listener to each button
buttons.forEach(function (button) {
  button.addEventListener("click", function (event) {
    event.preventDefault();
    let formId = button.id;
    let form;
    if (formId === "signup") {
      form = document.querySelector('form[action="signup"]');
    } else if (formId === "login") {
      form = document.querySelector('form[action="login"]');
    }
    let parent = form.parentNode;
    if (parent.offsetHeight == 0) {
      parent.style.display = "block";
      buttons.forEach(function (button) {
        button.disabled = true;
      });
    }
  });
});

// Check radio button
let radioButtons = document.querySelector('form[action="signup"]').querySelectorAll('input[type="radio"')
 radioButtons.forEach(function (radioButton){
  radioButton.addEventListener("change", function(event) {
  let univeristyFields = document.getElementById("universityFields");
  log(this);
  if(this.id === "university"){
    log("in university");
    univeristyFields.style.display = 'block';
  }
  else{
    univeristyFields.style.display = 'none';
  }
  event.preventDefault();
})
 })
 

 // check sign up form submit

 document.querySelector('form[action="signup"]').addEventListener('submit', function(event){
    event.preventDefault();
    let formData = new FormData(this);
    // Send form data to the server
    fetch('assets/server.js/signup', { 
      method: 'POST',
      body: formData
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Network response was not ok.');
  })
  .then(data => {
    console.log('Signup successful:', data);
    // Optionally, you can redirect the user to another page or show a success message here
  })
  .catch(error => {
    console.error('Error during signup:', error);
    // Optionally, you can show an error message to the user here
  });
});


fetch('http://127.0.0.1:8080/getData')
  .then(response => response.json())
  .then(data => {
    // 'data' is an array of objects representing your database records
    // You can use this data to update your HTML
    // For example, you could create a new <p> element for each record:
    data.forEach(record => {
      const p = document.createElement('h3');
      p.textContent = record.evnt_id; // replace 'yourColumnName' with the name of a column in your table
      document.body.appendChild(p);
    });
  });