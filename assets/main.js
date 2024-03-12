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
