const eventServerAddress = "http://127.0.0.1:3000";
fetchAndDisplayApprovedEvents();

async function fetchAndDisplayApprovedEvents() {
  try {
    const response = await fetch(`${eventServerAddress}/getApprovedEvents`);
    const data = await response.json();
    console.log("data: ", data);
    const processedTables = new Set();

    // Fetch session data
    const sessionResponse = await fetch(`${eventServerAddress}/getSessionData`);
    const sessionData = await sessionResponse.json();


    for (const table in data) {
      if (!processedTables.has(table)) {
        const tableTitle = document.createElement("h1");
        tableTitle.textContent = table.replace(/_/g, ' ').toUpperCase();
        tableTitle.style.fontSize = "400%"; // Adjust the size as needed
        tableTitle.style.color = "white";
        tableTitle.style.textAlign = "center";
        tableTitle.style.borderBottom = "1px solid white";
        document.body.appendChild(tableTitle);
        processedTables.add(table);
      }
      for (const record of data[table]) {
        const eventDiv = document.createElement("div");
        eventDiv.className = `${table} record`;

        const eventTitle = document.createElement("h1");
        eventTitle.textContent = record.evnt_title;
        eventDiv.appendChild(eventTitle);

        const eventTime = document.createElement("h2");
        eventTime.textContent = record.evnt_time;
        eventDiv.appendChild(eventTime);

        const eventDesc = document.createElement("p");
        eventDesc.innerHTML = record.evnt_desc;
        eventDiv.appendChild(eventDesc);

        if(sessionData.role === 'user'){
          // Check if the user has joined the event
          checkIfUserJoinedEvent(record.evnt_id)
            .then((hasJoined) => {
              if (!hasJoined) {
                //joinEventButton for comment section
                const joinEventButton = document.createElement("button");
                joinEventButton.textContent = "Join Event";
                joinEventButton.addEventListener("click", function (event) {
                  console.log("join event button clicked");
                  // Replace 'event_id' with the actual event id you want to use
                  joinEvent(record.evnt_id);
                  setTimeout(function () {
                    joinEventButton.remove();
                  }, 1000);
                });
                eventDiv.appendChild(joinEventButton);
              }
            })
            .catch((error) => {
              console.error("Error checking if user joined event:", error);
            });
        }
        const commentDiv = document.createElement("div");
        commentDiv.className = "comments-section";
        const commentAreaTitle = document.createElement("h2");
        commentAreaTitle.textContent = "Comments Section";
        commentDiv.appendChild(commentAreaTitle);

        const comments = await fetchComments(record.evnt_id);

        for (const comment of comments) {
          console.log(comment);
          const individualComment = createCommentElement(comment);
          commentDiv.appendChild(individualComment);
        }

        eventDiv.appendChild(commentDiv);
        const insertCommentDiv = createInsertCommentElement(
          record.evnt_id,
          commentDiv
        );
        eventDiv.appendChild(insertCommentDiv);

        // Append the eventDiv to the document body
        document.body.appendChild(eventDiv);
      }
    }
  } catch (error) {
    console.error("Error fetching approved events:", error);
  }
}

// async function fetchData() {
//   try {
//     const response = await fetch(`${eventServerAddress}/getEventData`);
//     const data = await response.json();

//     for (const record of data) {
//       if(record.approved){
//         const eventDiv = document.createElement("div");
//         eventDiv.className = "record";

//         const eventTitle = document.createElement("h1");
//         eventTitle.textContent = record.evnt_title;
//         eventDiv.appendChild(eventTitle);

//         const eventTime = document.createElement("h2");
//         eventTime.textContent = record.evnt_time;
//         eventDiv.appendChild(eventTime);

//         const eventDesc = document.createElement("p");
//         eventDesc.innerHTML = record.evnt_desc;
//         eventDiv.appendChild(eventDesc);
//         // Check if the user has joined the event
//         checkIfUserJoinedEvent(record.evnt_id)
//           .then((hasJoined) => {
//             if (!hasJoined) {
//               //joinEventButton for comment section
//               const joinEventButton = document.createElement("button");
//               joinEventButton.textContent = "Join Event";
//               joinEventButton.addEventListener("click", function (event) {
//                 console.log("join event button clicked");
//                 // Replace 'event_id' with the actual event id you want to use
//                 joinEvent(record.evnt_id);
//                 setTimeout(function () {
//                   joinEventButton.remove();
//                 }, 1000);
//               });
//               eventDiv.appendChild(joinEventButton);
//             }
//           })
//           .catch((error) => {
//             console.error("Error checking if user joined event:", error);
//           });

//         const commentDiv = document.createElement("div");
//         commentDiv.className = "comments-section";
//         const commentAreaTitle = document.createElement("h2");
//         commentAreaTitle.textContent = "Comments Section";
//         commentDiv.appendChild(commentAreaTitle);

//         const comments = await fetchComments(record.evnt_id);

//         for (const comment of comments) {
//           console.log(comment);
//           const individualComment = createCommentElement(comment);
//           commentDiv.appendChild(individualComment);
//         }

//         eventDiv.appendChild(commentDiv);
//         const insertCommentDiv = createInsertCommentElement(
//           record.evnt_id,
//           commentDiv
//         );
//         eventDiv.appendChild(insertCommentDiv);

//         // Append the eventDiv to the document body
//         document.body.appendChild(eventDiv);
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching event data:", error);
//   }
// }

function createCommentElement(comment) {
  console.log("comment inside createc comment : ", comment.comment_id);
  const individualComment = document.createElement("div");
  individualComment.className = "individual-comment";
  const commentHeading = document.createElement("h3");
  commentHeading.textContent = comment.username;

  const commentTextElement = document.createElement("p");
  commentTextElement.textContent = comment.comnt_text;

  const ratingElement = document.createElement("p");
  ratingElement.className = "rating-num";
  ratingElement.textContent = `Rating: ${comment.rating}`;

  const timestampElement = document.createElement("p");
  timestampElement.className = "timestamp";
  timestampElement.textContent = `Timestamp: ${comment.time_stamp}`;

  individualComment.appendChild(commentHeading);
  individualComment.appendChild(commentTextElement);
  individualComment.appendChild(ratingElement);
  individualComment.appendChild(timestampElement);

  // Add edit button if the comment belongs to the current user
  if (comment.belongsToCurrentUser) {
    console.log("comment in check: ", comment);
    const editButton = createEditButton(comment);
    const deleteButton = createDeleteButton(comment.comment_id);
    individualComment.appendChild(editButton);
    individualComment.appendChild(deleteButton);
  }

  return individualComment;
}

function createEditButton(comment) {
  const editButton = document.createElement("button");
  editButton.textContent = "Edit Comment";

  // Event listener for clicking the edit button
  editButton.addEventListener("click", async function () {
    // Update the commentRating to reflect the current rating
    comment.commentRating = parseInt(comment.commentRating); // Ensure commentRating is an integer
    const parentElement = editButton.parentElement;

    // Store the first paragraph element (assuming it contains the comment text)
    const firstParagraph = parentElement.querySelector("h3");

    // Create an input field for editing the comment text
    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = comment.comnt_text; // Set initial value to the current comment text

    // Create a slider for editing the comment rating
    const ratingSlider = document.createElement("input");
    ratingSlider.type = "range";
    ratingSlider.min = "1";
    ratingSlider.max = "5";
    ratingSlider.step = "1";
    ratingSlider.value = comment.commentRating; // Set initial value to the current comment rating

    // Create labels for the rating slider values
    const ratingLabels = document.createElement("div");
    ratingLabels.classList.add("rating-labels");
    for (let i = 1; i <= 5; i++) {
      const label = document.createElement("span");
      label.textContent = `${i} `;
      ratingLabels.appendChild(label);
    }

    // Create buttons for confirming and canceling changes
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirm";
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";

    // Append input field, slider, labels, and buttons to the parent element
    parentElement.innerHTML = ""; // Clear existing content
    parentElement.appendChild(firstParagraph); // Re-append the first paragraph
    parentElement.appendChild(inputField);
    parentElement.appendChild(document.createElement("br")); // Add a line break
    parentElement.appendChild(ratingSlider);
    parentElement.appendChild(ratingLabels);
    parentElement.appendChild(document.createElement("br")); // Add a line break
    parentElement.appendChild(confirmButton);
    parentElement.appendChild(cancelButton);

    // Focus on the input field
    inputField.focus();

    // Event listener for confirm button click
    confirmButton.addEventListener("click", async function () {
      // Get the updated comment text and rating
      const updatedCommentText = inputField.value;
      const updatedRating = ratingSlider.value;

      // Send a request to update the comment text and rating
      try {
        const response = await fetch(`${eventServerAddress}/edit_comment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment_id: comment.comment_id,
            message: updatedCommentText,
            rating: updatedRating,
          }),
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log(data);

        // Replace the parent element's content with new elements containing the updated comment text, rating, and timestamp
        parentElement.innerHTML = "";
        parentElement.appendChild(firstParagraph); // Re-append the first paragraph
        const newParagraph = document.createElement("p");
        newParagraph.textContent = updatedCommentText;
        parentElement.appendChild(newParagraph);

        const newRatingParagraph = document.createElement("p");
        newRatingParagraph.textContent = `Rating: ${updatedRating}`;
        parentElement.appendChild(newRatingParagraph);

        const timestampParagraph = document.createElement("p");
        timestampParagraph.textContent = `Timestamp: ${data.timestamp}`;
        parentElement.appendChild(timestampParagraph);

        // Re-append the edit button
        parentElement.appendChild(editButton);
        const newDeletebutton = createDeleteButton(comment.comment_id);
        parentElement.appendChild(newDeletebutton);
        comment.comnt_text = updatedCommentText;
        comment.commentRating = updatedRating;
        comment.timestamp = data.timestamp;
      } catch (error) {
        console.error("Error during editing comment:", error);
      }
    });

    // Event listener for cancel button click
    cancelButton.addEventListener("click", function () {
      // Restore the original comment text, rating, and timestamp
      inputField.value = comment.commentText;
      ratingSlider.value = comment.commentRating;

      // Replace the parent element's content with new elements containing the original comment text, rating, and timestamp
      parentElement.innerHTML = "";
      parentElement.appendChild(firstParagraph); // Re-append the first paragraph
      const originalTextParagraph = document.createElement("p");
      originalTextParagraph.textContent = `${comment.comnt_text}`;
      parentElement.appendChild(originalTextParagraph);

      const originalRatingParagraph = document.createElement("p");
      originalRatingParagraph.textContent = `Rating: ${comment.rating}`;
      parentElement.appendChild(originalRatingParagraph);

      const originalTimestampParagraph = document.createElement("p");
      originalTimestampParagraph.textContent = `Timestamp: ${comment.time_gistamp}`;
      parentElement.appendChild(originalTimestampParagraph);

      // Re-append the edit button
      parentElement.appendChild(editButton);
      const newDeletebutton = createDeleteButton(comment.comment_id);
      parentElement.appendChild(newDeletebutton);
    });
  });

  return editButton;
}

function createInsertCommentElement(eventId, commentDiv) {
  const insertCommentDiv = document.createElement("div");
  insertCommentDiv.className = "insert_comments";

  const commentArea = document.createElement("textarea");
  commentArea.placeholder = "Comment on this event!";
  insertCommentDiv.appendChild(commentArea);

  const ratingDiv = document.createElement("div");
  ratingDiv.className = "rating_div";

  for (let i = 1; i <= 5; i++) {
    const ratingNum = document.createElement("span");
    ratingNum.className = "rating";
    ratingNum.textContent = `${i} `;
    ratingDiv.appendChild(ratingNum);
  }

  const ratingInput = document.createElement("input");
  ratingInput.className = "rating-slider";
  ratingInput.type = "range";
  ratingInput.min = "1";
  ratingInput.max = "5";
  ratingInput.step = "1";
  ratingInput.value = "3";
  ratingDiv.appendChild(ratingInput);

  insertCommentDiv.appendChild(ratingDiv);

  const submitCommentButton = document.createElement("button");
  submitCommentButton.textContent = "Submit";
  submitCommentButton.addEventListener("click", function (event) {
    submitComment(eventId, commentArea.value, ratingInput.value, commentDiv);
    console.log(commentArea);
    commentArea.value = "";
  });
  insertCommentDiv.appendChild(submitCommentButton);

  // const joinEventButton = document.createElement("button");
  // joinEventButton.textContent = "Join Event";
  // joinEventButton.addEventListener("click", async function (event) {
  //   console.log("join event button clicked");
  //   joinEvent(eventId);
  //   setTimeout(function () {
  //     joinEventButton.remove();
  //   }, 1000);
  // });
  // insertCommentDiv.appendChild(joinEventButton);

  return insertCommentDiv;
}

async function fetchComments(eventId) {
  try {
    const response = await fetch(`${eventServerAddress}/get_comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ evnt_id: eventId }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const comments = await response.json();

    // Fetch session info
    const sessionInfoResponse = await fetch(
      `${eventServerAddress}/get_session_info`
    );
    if (!sessionInfoResponse.ok) {
      throw new Error("Network response for session info was not ok");
    }
    const sessionInfo = await sessionInfoResponse.json();

    // Update comment objects to include a property indicating whether the comment belongs to the current user
    comments.forEach((comment) => {
      comment.belongsToCurrentUser = comment.username === sessionInfo.username;
    });

    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return []; // Return an empty array if there's an error
  }
}

function updateCommentsSection(comments, commentDiv) {
  // Clear the existing comments
  commentDiv.innerHTML = "";

  // Append the new comments
  comments.forEach((comment) => {
    const individualComment = createCommentElement(comment);
    commentDiv.appendChild(individualComment);
  });
}

async function submitComment(eventId, commentText, ratingVal, commentDiv) {
  try {
    const newCommentInfo = {
      commentText: commentText,
      evnt_id: eventId,
      ratingNum: ratingVal,
    };

    const response = await fetch(`${eventServerAddress}/insert_comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newCommentInfo),
    });
    if (!response.ok) {
      throw new Error("Have to be logged in to comment");
    }
    // Log success message
    console.log("Comment submitted successfully!");

    // Fetch updated comments and refresh the comments section
    const updatedComments = await fetchComments(eventId);
    updateCommentsSection(updatedComments, commentDiv);
    console.log(commentDiv);
  } catch (error) {
    showErrorModal(error);
  }
}
function createDeleteButton(comment_id) {
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Delete Comment";

  // Event listener for clicking the delete button
  deleteButton.addEventListener("click", async function (event) {
    console.log("Delete Button clicked!");

    // Send a request to delete the comment
    try {
      const response = await fetch(`${eventServerAddress}/delete_comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: comment_id,
        }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log(data);

      // Remove the comment from the UI after successful deletion
      deleteButton.parentElement.remove();
    } catch (error) {
      console.error("Error during deleting comment:", error);
    }
  });

  return deleteButton;
}

function checkIfUserJoinedEvent(evnt_id) {
  // Replace 'user_id' with the actual user id you want to use
  const user_id = "user_id";

  return fetch(`/check-user-joined-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify({ evnt_id: evnt_id, user_id: user_id }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      } else {
        return response.json();
      }
    })
    .then((data) => {
      return data.hasJoined;
    })
    .catch((error) => {
      console.error("Request failed:", error);
    });
}

function joinEvent(evnt_id) {
  console.log("inside joinEvent function");

  return fetch("/join-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify({ evnt_id: evnt_id }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      } else {
        console.log(
          `Done, got ${response.headers.get("content-length")} bytes`
        );
      }
    })
    .catch((error) => {
      console.error("Request failed:", error);
    });
}
