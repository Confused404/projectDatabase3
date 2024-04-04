document.addEventListener("DOMContentLoaded", function () {
  let log = console.log;
  let buttons = document.querySelectorAll(".user");
  const serverAddress = "http://127.0.0.1:3000";

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
  document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.querySelector('form[action="signup"]');
    const exitButton = document.querySelector(".exit-button1");
    exitButton.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent the default action
      // Redirect the user to another page
      window.location.href = "index.html"; // Replace 'index.html' with the page you want to redirect to
    });
    signupForm.addEventListener("submit", function (event) {
      //event.preventDefault();
      const inputs = signupForm.querySelectorAll("input");
      console.log("testing singup");
      console.log(signupForm.role);
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
      event.preventDefault();
      window.location.href = "index.html";

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
        const urlEncodedFormData = new URLSearchParams(formInfo).toString();
        fetch(`${serverAddress}/signup`, {
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
            console.log("Signup successful:", data);
            if (data.validSignup) {
              window.location.href = "../index.html";
            } else {
              // Handle invalid signup
            }
          })
          .catch((error) => {
            console.error("Error during signup:", error);
            // Optionally, you can show an error message to the user here
          });
      } else {
        alert("please fill in all required inputs");
        return;
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
        if (data.exists) {
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
    const exitButton = document.querySelector(".exit-button2");
    exitButton.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent the default action
      // Redirect the user to another page
      console.log("inside exit");
      window.location.href = "index.html"; // Replace 'index.html' with the page you want to redirect to
    });
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

  //  // Event creation form validation and submission
  // document.addEventListener("DOMContentLoaded", function () {
  //   const eventCreationForm = document.querySelector('form[action="create-Event"]');

  //   eventCreationForm.addEventListener("submit", function (event) {
  //     const inputs = eventCreationForm.querySelectorAll("input");

  //     let allInputsValid = true;
  //     inputs.forEach((input) => {
  //       if (!input.value.trim()) {
  //         allInputsValid = false;
  //       }
  //     });

  //     if (allInputsValid) {
  //       let formData = new FormData(this);
  //       let formInfo = {};
  //       for (const pair of formData.entries()) {
  //         let key = pair[0];
  //         let value = pair[1];
  //         formInfo[key] = value;
  //       }

  //       // Send form data to the server
  //       const urlEncodedFormData = new URLSearchParams(formInfo).toString();
  //       fetch(`${serverAddress}/create-Event`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/x-www-form-urlencoded",
  //         },
  //         body: urlEncodedFormData,
  //       })
  //         .then((response) => {
  //           if (response.ok) {
  //             return response.json();
  //           }
  //           throw new Error("Network response was not ok.");
  //         })
  //         .then((data) => {
  //           console.log("Event creation successful:", data);
  //         })
  //         .catch((error) => {
  //           console.error("Error during event creation:", error);
  //         });
  //     } else {
  //       alert("please fill in all required inputs");
  //       return;
  //     }
  //   });
  // });

  //   // RSO creation form validation and submission
  //   document.addEventListener("DOMContentLoaded", function () {
  //     const rsoCreationForm = document.querySelector('form[action="create-RSO"]');

  //     rsoCreationForm.addEventListener("submit", function (event) {
  //       const inputs = rsoCreationForm.querySelectorAll("input");

  //       let allInputsValid = true;
  //       inputs.forEach((input) => {
  //         if (!input.value.trim()) {
  //           allInputsValid = false;
  //         }
  //       });
  //       if (allInputsValid) {
  //         let formData = new FormData(this);
  //         let formInfo = {};
  //         for (const pair of formData.entries()) {
  //           let key = pair[0];
  //           let value = pair[1];
  //           formInfo[key] = value;
  //         }
  //         console.log(formInfo);
  //         // Send form data to the server
  //         const urlEncodedFormData = new URLSearchParams(formInfo).toString();
  //         fetch(`${serverAddress}/create-RSO`, {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/x-www-form-urlencoded",
  //           },
  //           body: urlEncodedFormData,
  //         })
  //           .then((response) => {
  //             if (response.ok) {
  //               return response.json();
  //             }
  //             throw new Error("Network response was not ok.");
  //           })
  //           .then((data) => {
  //             console.log("RSO creation successful:", data);
  //           })
  //           .catch((error) => {
  //             console.error("Error during RSO creation:", error);
  //           });
  //       } else {
  //         alert("please fill in all required inputs");
  //         return;
  //       }
  //     });
  //   });
});
