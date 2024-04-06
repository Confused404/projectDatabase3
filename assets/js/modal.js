// modal.js

// Get the modal element
const modal = document.getElementById("errorModal");

// Function to display error message in modal
function showErrorModal(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  modal.style.opacity = 0; // Set initial opacity to fully transparent
  modal.style.display = "block"; // Make the modal visible

  // Fade in the modal
  fadeIn(modal);

  // Fade out the modal after 5 seconds
  setTimeout(function () {
    fadeOut(modal);
  }, 5000); // 5000 milliseconds = 5 seconds
}

// Function to fade in the modal
function fadeIn(element) {
  var opacity = 0;
  var fadeEffect = setInterval(function () {
    if (opacity >= 1) {
      clearInterval(fadeEffect);
    } else {
      element.style.opacity = opacity;
      opacity += 0.1; // Increase opacity gradually
    }
  }, 50); // Interval for fading effect
}

// Function to fade out the modal
function fadeOut(element) {
  var opacity = 1;
  var fadeEffect = setInterval(function () {
    if (opacity <= 0) {
      clearInterval(fadeEffect);
      element.style.display = "none"; // Hide the modal
    } else {
      element.style.opacity = opacity;
      opacity -= 0.1; // Reduce opacity gradually
    }
  }, 50); // Interval for fading effect
}
