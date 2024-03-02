var loginForm = document.getElementsByClassName("form-div")[0];
var loginButton = document.getElementById("login-button");

loginButton.addEventListener("click", function () {
  if (loginForm.offsetHeight == 0) {
    loginForm.style.display = "block";
    loginButton.disabled = true;
  }
});
