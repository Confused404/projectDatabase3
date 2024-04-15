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
          const eventsButton = document.querySelector("#events");

          // If the login button doesn't exist, it means it's already been changed
          if (!eventsButton) return;

          eventsButton.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.href = "../html/unapproved-events.html";
          });
        }

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

          // If the account box has already been generated, skip the rest of the code
          if (isAccountBoxGenerated) {
            return;
          }

          // Use the data from the first fetch request
          if (data.username && data.email) {
            window.location.href = "../html/account-page.html";
            isAccountBoxGenerated = true;
          }
        });
      }
    });
}
