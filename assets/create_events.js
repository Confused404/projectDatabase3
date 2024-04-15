const serverAddress = "http://127.0.0.1:3000";
let map;
let marker;
let longitude;
let latitude;
// Event creation form validation and submission
document.addEventListener("DOMContentLoaded", function () {
  const eventCreationForm = document.querySelector(
    'form[action="create-Event"]'
  );

  // Add event listener for rso_event radio button
  document.getElementsByName('event_type').forEach(function(radio) {
    radio.addEventListener('change', function() {
      document.getElementById('rso_name_div').style.display = 
        (this.id === 'rso_event' && this.checked) ? 'block' : 'none';
    });
  });

  eventCreationForm.addEventListener("submit", function (event) {
    event.preventDefault();
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
      formInfo.lat = latitude;
      formInfo.long = longitude;
      // Send form data to the server

      fetch(`${serverAddress}/create-Event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formInfo),
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          console.log("Event creation successful:", data);
          showErrorModal(data.error);
        })
        .catch((error) => {
          showErrorModal(error.error);
          console.error("Error during event creation:", error);
        });
    } else {
      showErrorModal("Please fill in all required inputs!");
      return;
    }
  });
});

// RSO creation form validation and submission
document.addEventListener("DOMContentLoaded", function () {
  const rsoCreationForm = document.querySelector('form[action="create-RSO"]');

  rsoCreationForm.addEventListener("submit", function (event) {
    event.preventDefault();
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
      // Send form data to the server
      fetch(`${serverAddress}/create-RSO`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formInfo), // Stringify the form data as JSON
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          showErrorModal(data);
          console.log("RSO creation successful:", data);
        })
        .catch((error) => {
          showErrorModal(error);
          // console.error("Error during RSO creation:", error);
        });
    } else {
      showErrorModal("Please fill in all inputs!");
      return;
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  function setDefaultDateTime() {
    var currentDate = new Date();

    // Set default day number
    var currentDay = currentDate.getDate();
    let event_day = document.getElementById("event_day").value;
    document.getElementById("event_day").value = currentDay
      .toString()
      .padStart(2, "0");
    console.log("wierd af ", event_day);
    // Set default month
    var currentMonth = currentDate.getMonth() + 1; // Months are zero-based, so add 1
    document.getElementById("event_month").value = currentMonth
      .toString()
      .padStart(2, "0");

    // Set default time in 12-hour format
    var currentHour = currentDate.getHours();
    var currentMinute = currentDate.getMinutes();
    var ampm = currentHour >= 12 ? "PM" : "AM";
    currentHour = currentHour % 12;
    currentHour = currentHour ? currentHour : 12; // the hour '0' should be '12'
    document.getElementById("event_hour").value = currentHour
      .toString()
      .padStart(2, "0");
    document.getElementById("event_minute").value = currentMinute
      .toString()
      .padStart(2, "0");
    document.getElementById("event_ampm").value = ampm;
  }

  // Call the function to set default date and time
  setDefaultDateTime();
});

function initMap() {
  // Initialize the map
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6024, lng: -81.2001 },
    zoom: 16, // Adjust the zoom level as needed
  });

  // Initialize the marker
  marker = new google.maps.Marker({
    map: map,
    draggable: true, // Allow marker to be dragged
  });

  // Initialize Autocomplete
  const locationInput = document.getElementById("locationInput");
  const autocomplete = new google.maps.places.Autocomplete(locationInput);

  // Set the fields to be returned for each PlaceResult
  autocomplete.setFields(["formatted_address", "geometry"]);

  // Add listener for place changes
  autocomplete.addListener("place_changed", function () {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      console.error("Place details not found for input: ", place);
      return;
    }

    // Update map center and marker position
    map.setCenter(place.geometry.location);
    marker.setPosition(place.geometry.location);

    // Update latitude and longitude variables
    latitude = place.geometry.location.lat();
    longitude = place.geometry.location.lng();
  });

  // Add listener for marker drag
  marker.addListener("dragend", function () {
    map.setCenter(marker.getPosition());
    latitude = marker.getPosition().lat();
    longitude = marker.getPosition().lng();
  });
}
