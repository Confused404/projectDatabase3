document.addEventListener("DOMContentLoaded", function () {
  let log = console.log;
  let buttons = document.querySelectorAll(".user");
  const serverAddress = "http://localhost:3000";

  updateLoginButton();

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
      if (form) {
        let parent = form.parentNode;
        if (parent.offsetHeight == 0) {
          parent.style.display = "block";
          buttons.forEach(function (button) {
            button.disabled = true;
          });
        }
      }
    });
  });

  // Check radio button
  let radioButtons = document
    .querySelector('form[action="signup"]')
    .querySelectorAll('input[type="radio"');
  radioButtons.forEach(function (radioButton) {
    radioButton.addEventListener("change", function (event) {
      let univeristyFields = document.getElementById("universityFields");
      let userFields = document.getElementById("userFields");
      if (this.id === "university") {
        log("in university");
        univeristyFields.style.display = "block";
      } else if (this.id === "user") {
        userFields.style.display = "block";
      } else {
        univeristyFields.style.display = "none";
        userFields.style.display = "none";
      }
      event.preventDefault();
    });
  });

  // check sign up form submit
  const signupForm = document.querySelector('form[action="signup"]');

  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const inputs = signupForm.querySelectorAll("input");
    let role = signupForm.role.value;
    let allInputsValid = true;
    if (role == "") {
      allInputsValid = false;
    }
    // Check if all inputs have a value
    inputs.forEach((input) => {
      if (!input.value.trim()) {
        // If an input is empty, set allInputsValid to false
        if (
          input.parentElement.id == "universityFields" &&
          role != "university"
        ) {
          return;
        } else if (input.parentElement.id == "userFields" && role != "user") {
          return;
        }
        allInputsValid = false;
      }
    });

    console.log("input check ", allInputsValid);

    if (allInputsValid) {
      let formData = new FormData(this);
      let formInfo = {};
      // console.log(formData);
      for (const pair of formData.entries()) {
        let key = pair[0];
        let value = pair[1];
        formInfo[key] = value;
      }
      console.log(formInfo);
      // Send form data to the server
      fetch(`${serverAddress}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formInfo), // Send form data as JSON string
      })
        .then((response) => {
          if (response.ok) {
            return response.text(); // Assuming the response is text
          }
          throw new Error("Network response was not ok.");
        })
        .then((data) => {
          // Handle successful signup
          console.log("Signup successful:", data);
          updateLoginButton();
          window.location.href = "../index.html"; // Redirect to index.html
        })
        .catch((error) => {
          showErrorModal(error);
          console.error("Error during signup:", error);
          // Optionally, you can show an error message to the user here
        });
    } else {
      showErrorModal("Please fill in all required inputs");
    }
  });
});
/////
//////////////////////////////////////////
/////
/////
function updateLoginButton() {
  console.log("inside updateLoginButton()");
  fetch("/get_session_info") // Replace '/check-login' with the route that checks if the user is logged in
    .then((response) => response.json())
    .then((data) => {
      console.log(data.exists);
      console.log("data exists: " + data.exists);
      if (data.exists) {
        console.log("role: " + data.role);
        if (data.role === "super_admin") {
          console.log("inside super admin if statement of update login button");
          const eventsButton = document.querySelector("#events");

          // If the login button doesn't exist, it means it's already been changed
          if (!eventsButton) return;

          eventsButton.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.href = "../html/unapproved-events.html";
          });
        }
        console.log("past the super_admin portion of update login");
        // Select the login button
        const loginButton = document.querySelector("#login");

        // If the login button doesn't exist, it means it's already been changed
        if (!loginButton) return;

        // Change the button text
        loginButton.textContent = "ACCOUNT";

        // Change the button id
        loginButton.id = "account";

        // Select the join button
        const joinButton = document.querySelector("#signup");

        // If the join button doesn't exist, it means it's already been changed
        if (joinButton) {
          // Change the button text
          joinButton.textContent = "SIGN OUT";

          // Change the button id
          joinButton.id = "signout";

          // Add a click event to the sign out button
          joinButton.addEventListener("click", function (event) {
            event.preventDefault();
            // Add sign out functionality here
            fetch("/sign-out", {
              method: "DELETE",
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  // Sign out was successful
                  // You can redirect the user to the login page or refresh the page
                  console.log("signout successful");
                  setTimeout(function () {
                    location.reload();
                  }, 1000); //1 second is 1000
                } else {
                  // Sign out failed
                  // You can show an error message to the user
                  console.log("sign out failed");
                }
              })
              .catch((error) => console.error("Error:", error));
          });
        }

        let isAccountBoxGenerated = false;

        // Change the button's click event to go to the account details page
        loginButton.addEventListener("click", function (event) {
          event.preventDefault();

          // Select the box
          const box = document.getElementById("account-box");

          // Unhide the box
          if (box.offsetHeight == 0) {
            box.style.display = "block";
          }

          // If the account box has already been generated, skip the rest of the code
          if (isAccountBoxGenerated) {
            return;
          }

          // Use the data from the first fetch request
          if (data.username && data.email) {
            // Create elements for user details
            const form = box.firstElementChild;
            const usernameLabel = document.createElement("label");
            usernameLabel.textContent = `Username: ${data.username}`;
            form.appendChild(usernameLabel);

            const emailLabel = document.createElement("label");
            emailLabel.textContent = `Email: ${data.email}`;
            form.appendChild(emailLabel);

            //put the list of rsos joined
            //put the list of events? it might get kind of crazy looking,
            // should i put just the name of the event?
            //fuck its gonna have to be another .html i gotta put everything
            //email and username,
            //lists would include: rsos joined, (public, private, and rso)-events joined

            // Set the flag to true so the account box won't be generated again
            window.location.href = "/html/account-page.html";
            isAccountBoxGenerated = true;
          }
        });
      }
    });
}

// Login form validation
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector('form[action="login"]');

  loginForm.addEventListener("submit", function (event) {
    const inputs = loginForm.querySelectorAll("input");
    console.log("inside submit event listener");
    let allInputsValid = true;
    inputs.forEach((input) => {
      if (!input.value.trim()) {
        allInputsValid = false;
      }
    });
    if (allInputsValid) {
      let formData = new FormData(this);
      let formInfo = {};
      //console.log(formData);
      for (const pair of formData.entries()) {
        let key = pair[0];
        let value = pair[1];
        formInfo[key] = value;
      }
      console.log(formInfo);
      // Send form data to the server
      const urlEncodedFormData = new URLSearchParams(formInfo).toString();
      fetch(`${serverAddress}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlEncodedFormData,
      })
        .then((response) => {
          console.log("main.js response ", response);
          if (response.ok) {
            console.log("Login successful:");
            //updateLoginButton();
          }
          throw new Error("Network response was not ok.");
        })
        .then((data) => {
          updateLoginButton();
          console.log("Login successful:", data);
          // Optionally, you can redirect the user to another page or show a success message here
        })
        .catch((error) => {
          console.error("Error during Login:", error);
          // Optionally, you can show an error message to the user here
        });
    } else {
      alert("please fill in all required inputs");
      return;
    }
  });
});
