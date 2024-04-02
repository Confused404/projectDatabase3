const eventServerAddress = "http://localhost:3000";

async function fetchData() {
  try {
    const response = await fetch(`${eventServerAddress}/getEventData`);
    const data = await response.json();

    for (const record of data) {
      const eventDiv = document.createElement("div");
      eventDiv.className = "record";

      const eventTitle = document.createElement("h1");
      eventTitle.textContent = record.evnt_title;
      eventDiv.appendChild(eventTitle);

      const eventTime = document.createElement("h2");
      eventTime.textContent = record.evnt_time;
      eventDiv.appendChild(eventTime);

      const eventDesc = document.createElement("p");
      eventDesc.innerHTML = record.evnt_desc;
      eventDiv.appendChild(eventDesc);

      const commentDiv = document.createElement("div");
      commentDiv.className = "comments-section";
      const commentAreaTitle = document.createElement("h2");
      commentAreaTitle.textContent = "Comments Section";
      commentDiv.appendChild(commentAreaTitle);

      const comments = await fetchComments(record.evnt_id);

      for (const comment of comments) {
        const individualComment = createCommentElement(comment);
        commentDiv.appendChild(individualComment);
      }

      const ratingInput = document.createElement("input");
      ratingInput.type = "range";
      ratingInput.min = "1";
      ratingInput.max = "5";
      ratingInput.step = "1";
      ratingInput.value = "3";
      ratingDiv.appendChild(ratingInput);

      const insertCommentDiv = createInsertCommentElement(record.evnt_id, commentDiv);

      //submit button for comment section
      insertCommentDiv.appendChild(ratingDiv);
      const submitCommentButton = document.createElement("button");
      submitCommentButton.textContent = "Submit";
      submitCommentButton.addEventListener("click", function (event) {
        submitComment(
          record.evnt_id,
          commentArea.value,
          commentDiv,
          ratingInput.value
        );
      });
      insertCommentDiv.appendChild(submitCommentButton);

      //edit comment button for comment section
      const editCommentButton = document.createElement("button");
      editCommentButton.textContent = "Edit Comment";
      editCommentButton.addEventListener("click", function (event) {
        console.log("edit button clicked");
      });
      insertCommentDiv.appendChild(editCommentButton);

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
              setTimeout(function() {
                joinEventButton.remove();
              }, 1000);
            });
            insertCommentDiv.appendChild(joinEventButton);
          }
        })
        .catch((error) => {
          console.error("Error checking if user joined event:", error);
        });

      // Append insertCommentDiv to the eventDiv
      eventDiv.appendChild(commentDiv);
      eventDiv.appendChild(insertCommentDiv);

      document.body.appendChild(eventDiv);
    }
  } catch (error) {
    console.error("Error fetching event data:", error);
  }
}
  function checkIfUserJoinedEvent(evnt_id) {
    // Replace 'user_id' with the actual user id you want to use
    const user_id = 'user_id';
  
    return fetch(`/check-user-joined-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({ evnt_id: evnt_id, user_id: user_id })
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
      console.error('Request failed:', error);
    });
  }

  function joinEvent(evnt_id) {
    console.log("inside joinEvent function");

    return fetch('/join-event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({ evnt_id: evnt_id })
    })
    .then((response) => {
        if (!response.ok) { 
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        } else { 
            console.log(`Done, got ${response.headers.get('content-length')} bytes`);
        }
    })
    .catch((error) => {
        console.error('Request failed:', error);
    });
}

function createCommentElement(comment) {
  const individualComment = document.createElement("div");
  individualComment.className = "individual-comment";
  const commentHeading = document.createElement("h3");
  commentHeading.textContent = comment.username;

  const commentTextElement = document.createElement("p");
  commentTextElement.textContent = comment.comnt_text;

  const ratingElement = document.createElement("p");
  ratingElement.textContent = `Rating: ${comment.rating}`;

  const timestampElement = document.createElement("p");
  timestampElement.textContent = `Timestamp: ${comment.time_stamp}`;

  individualComment.appendChild(commentHeading);
  individualComment.appendChild(commentTextElement);
  individualComment.appendChild(ratingElement);
  individualComment.appendChild(timestampElement);

  // Add edit button if the comment belongs to the current user
  if (comment.belongsToCurrentUser) {
    const editButton = createEditButton(comment_id, "wanna fix it?");
    const deleteButton = createDeleteButton(comment_id);
    individualComment.appendChild(editButton);
    individualComment.appendChild(deleteButton);
  }

  return individualComment;
}

function createEditButton(comment_id, commentText) {
  const editButton = document.createElement("button");
  editButton.className = "edit-button";
  editButton.textContent = "Edit Comment";

  // Create text input field for editing comment text
  const editText = document.createElement("input");
  editText.type = "text";
  editText.value = commentText; // Set initial value to the current comment text
  editText.style.display = "none"; // Hide the input field initially

  // Event listener for clicking the edit button
  editButton.addEventListener("click", function (event) {
    console.log("Button clicked!");

    // Toggle display of text input field
    editText.style.display =
      editText.style.display === "none" ? "block" : "none";

    // If the text input field is visible, focus on it
    if (editText.style.display === "block") {
      editText.focus();
    }
  });

  // Event listener for input field blur (when user clicks outside the input field)
  editText.addEventListener("blur", async function (event) {
    // When the input field loses focus, update the comment text

    // Get the updated comment text
    const updatedCommentText = editText.value;

    // Send a request to update the comment text
    try {
      const response = await fetch(`${eventServerAddress}/edit_comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: comment_id,
          message: updatedCommentText,
        }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log(data);

      // Hide the text input field after editing
      editText.style.display = "none";
    } catch (error) {
      console.error("Error during editing comment:", error);
    }
  });

  // Append the edit button and text input field to a container
  const container = document.createElement("div");
  container.appendChild(editButton);
  container.appendChild(editText);

  return container;
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
  });
  insertCommentDiv.appendChild(submitCommentButton);

  const joinEventButton = document.createElement("button");
  joinEventButton.textContent = "Join Event";
  joinEventButton.addEventListener("click", async function (event) {
    console.log("join event button clicked");
    joinEvent(eventId);
    setTimeout(function () {
      joinEventButton.remove();
    }, 1000);
  });
  insertCommentDiv.appendChild(joinEventButton);

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
      throw new Error("Network response was not ok.");
    }

    // Log success message
    console.log("Comment submitted successfully!");

    // Fetch updated comments and refresh the comments section
    const updatedComments = await fetchComments(eventId);
    updateCommentsSection(updatedComments, commentDiv);
  } catch (error) {
    console.error("Error during comment:", error);
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

fetchData();
