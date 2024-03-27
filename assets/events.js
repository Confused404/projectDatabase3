const eventServerAddress = "http://localhost:3000";

fetch(`${eventServerAddress}/getData`)
  .then((response) => response.json())
  .then((data) => {
    // Loop through each event record
    data.forEach((record) => {
      // Create a container div for the event
      const eventDiv = document.createElement("div");
      eventDiv.className = "record";

      // Create elements for event details
      const eventTitle = document.createElement("h1");
      eventTitle.textContent = record.evnt_title;
      eventDiv.appendChild(eventTitle);

      const eventTime = document.createElement("h2");
      eventTime.textContent = record.evnt_time;
      eventDiv.appendChild(eventTime);

      const eventDesc = document.createElement("p");
      eventDesc.innerHTML = record.evnt_desc;
      eventDiv.appendChild(eventDesc);

      // Create a container div for comments
      let commentDiv = document.createElement("div");
      commentDiv.className = "comments-section";
      const commentAreaTitle = document.createElement("h2");
      commentAreaTitle.textContent = "Comments Section";
      commentDiv.appendChild(commentAreaTitle);

      // Fetch comments for the current event
      fetchComments(record.evnt_id)
        .then((comments) => {
          // Loop through each comment
          comments.forEach((comment) => {
            // Create elements for each comment
            const individualComment = document.createElement("div");
            individualComment.className = "individual-comment";
            const commentHeading = document.createElement("h3");
            commentHeading.textContent = "User Comment";

            const commentTextElement = document.createElement("p");
            commentTextElement.textContent = comment.comnt_text;

            const ratingElement = document.createElement("p");
            ratingElement.textContent = `Rating: ${comment.rating}`;

            const timestampElement = document.createElement("p");
            timestampElement.textContent = `Timestamp: ${comment.time_stamp}`;

            // Append comment elements to the commentDiv
            individualComment.appendChild(commentHeading);
            individualComment.appendChild(commentTextElement);
            individualComment.appendChild(ratingElement);
            individualComment.appendChild(timestampElement);
            commentDiv.appendChild(individualComment);
          });

          // Append the commentDiv to the eventDiv
          eventDiv.appendChild(commentDiv);
        })
        .catch((error) => {
          console.error("Error fetching comments:", error);
        });

      // Create elements for adding new comments
      const insertCommentDiv = document.createElement("div");
      insertCommentDiv.className = "insert_comments";

      const commentArea = document.createElement("textarea");
      commentArea.placeholder = "Comment on this event!";
      insertCommentDiv.appendChild(commentArea);
      // Create and append the rating bar after comments
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
        submitComment(
          record.evnt_id,
          commentArea.value,
          commentDiv,
          ratingInput.value
        );
      });
      insertCommentDiv.appendChild(submitCommentButton);

      const editCommentButton = document.createElement("button");
      editCommentButton.textContent = "Edit Comment";
      editCommentButton.addEventListener("click", function (event) {
        console.log("edit button clicked");
      });
      insertCommentDiv.appendChild(editCommentButton);

      // Append insertCommentDiv to the eventDiv
      eventDiv.appendChild(insertCommentDiv);

      // Append the eventDiv to the document body
      document.body.appendChild(eventDiv);
    });
  })
  .catch((error) => {
    console.error("Error fetching event data:", error);
  });

// Function to fetch comments for a specific event
function fetchComments(eventId) {
  return fetch(`${eventServerAddress}/get_comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ evnt_id: eventId }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching comments:", error);
    });
}

// Function to submit a comment for a specific event
function submitComment(eventId, commentText, commentDiv, ratingVal) {
  const newCommentInfo = {
    commentText: commentText,
    evnt_id: eventId,
    ratingNum: ratingVal,
  };

  fetch(`${eventServerAddress}/insert_comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newCommentInfo),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }
      // After submitting the comment, fetch and update the comments section
      return fetchComments(eventId);
    })
    .then((comments) => {
      // Clear existing comments
      commentDiv.innerHTML = "";

      // Loop through each comment and append to the commentDiv
      comments.forEach((comment) => {
        const individualComment = document.createElement("div");
        individualComment.className = "individual-comment";
        const commentHeading = document.createElement("h3");
        commentHeading.textContent = "User Comment";

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
        commentDiv.appendChild(individualComment);
      });
    })
    .catch((error) => {
      console.error("Error during comment:", error);
      // Optionally, you can show an error message to the user here
    });
}
