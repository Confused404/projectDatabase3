const serverAddress = "http::localhost/3000";
// Event creation form validation and submission
document.addEventListener("DOMContentLoaded", function () {
  const eventCreationForm = document.querySelector(
    'form[action="create-Event"]'
  );

  eventCreationForm.addEventListener("submit", function (event) {
    const inputs = eventCreationForm.querySelectorAll("input");

    let allInputsValid = true;
    inputs.forEach((input) => {
      if (!input.value.trim()) {
        allInputsValid = false;
      }
    });

    if (allInputsValid) {
      let formData = new FormData(this);
      let formInfo = {};
      for (const pair of formData.entries()) {
        let key = pair[0];
        let value = pair[1];
        formInfo[key] = value;
      }
      console.log(formInfo);
      // Send form data to the server
      const urlEncodedFormData = new URLSearchParams(formInfo).toString();
      fetch(`${serverAddress}/create-Event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlEncodedFormData,
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Network response was not ok.");
        })
        .then((data) => {
          console.log("Event creation successful:", data);
        })
        .catch((error) => {
          console.error("Error during event creation:", error);
        });
    } else {
      alert("please fill in all required inputs");
      return;
    }
  });
});

// RSO creation form validation and submission
document.addEventListener("DOMContentLoaded", function () {
  const rsoCreationForm = document.querySelector('form[action="create-RSO"]');

  rsoCreationForm.addEventListener("submit", function (event) {
    const inputs = rsoCreationForm.querySelectorAll("input");

    let allInputsValid = true;
    inputs.forEach((input) => {
      if (!input.value.trim()) {
        allInputsValid = false;
      }
    });
    if (allInputsValid) {
      let formData = new FormData(this);
      let formInfo = {};
      for (const pair of formData.entries()) {
        let key = pair[0];
        let value = pair[1];
        formInfo[key] = value;
      }
      console.log(formInfo);
      // Send form data to the server
      const urlEncodedFormData = new URLSearchParams(formInfo).toString();
      fetch(`${serverAddress}/create-RSO`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlEncodedFormData,
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Network response was not ok.");
        })
        .then((data) => {
          console.log("RSO creation successful:", data);
        })
        .catch((error) => {
          console.error("Error during RSO creation:", error);
        });
    } else {
      alert("please fill in all required inputs");
      return;
    }
  });
});

function setDefaultDateTime() {
  var currentDate = new Date();

  // Set default day number
  var currentDay = currentDate.getDate();
  document.getElementById("event_day").value = currentDay
    .toString()
    .padStart(2, "0");

  // Set default month
  var currentMonth = currentDate.toLocaleString("en-us", { month: "short" });
  document.getElementById("event_month").value = currentMonth;

  // Set default time in 12-hour format
  var currentHour = currentDate.getHours();
  var currentMinute = currentDate.getMinutes();
  var ampm = currentHour >= 12 ? "PM" : "AM";
  currentHour = currentHour % 12;
  currentHour = currentHour ? currentHour : 12; // the hour '0' should be '12'
  document.getElementById("event_hour").value = currentHour;
  document.getElementById("event_minute").value = currentMinute;
  document.getElementById("event_ampm").value = ampm;
}

// Call the function to set default date and time
setDefaultDateTime();
