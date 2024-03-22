const eventServerAddress = "http://localhost:3000";

fetch(`${eventServerAddress}/getData`)
  .then((response) => response.json())
  .then((data) => {
    // 'data' is an array of objects representing your database records
    // You can use this data to update your HTML
    // For example, you could create a new <p> element for each record:
    data.forEach((record) => {
      const eventDiv = document.createElement("eventDiv");
      eventDiv.className = "record";

      const eventTitle = document.createElement("h1");
      eventTitle.textContent = record.evnt_title;
      eventDiv.appendChild(eventTitle);

      const eventTime = document.createElement("h2");
      eventTime.textContent = record.evnt_time;
      eventDiv.appendChild(eventTime);

      //location should go here

      const eventDesc = document.createElement("p");
      eventDesc.innerHTML = record.evnt_desc;
      eventDiv.appendChild(eventDesc);

      // get eventId by querying event_title;

      // Define the fetch options
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventTitle: eventTitle.textContent }),
      };
      let eventId;
      fetch(`${eventServerAddress}/get_event_id`, options)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.text();
        })
        .then((data) => {
          eventId = data;
          // do something to get the comments
          const commentDiv = document.createElement("div");
          commentDiv.className = "comments";
          const commentAreaTitle = document.createElement("h2");
          commentAreaTitle.textContent = "Comments Section";
          commentDiv.appendChild(commentAreaTitle);
          const getCommentsOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ evnt_id: eventId }),
          };
          fetch(`${eventServerAddress}/get_comments`, getCommentsOptions)
            .then((response) => {
              if (!response.ok) {
                throw new Error("Network response was not ok");
              }
              return response.text();
            })
            .then((data) => {
              console.log(data);

              const commentInfo = JSON.parse(data);
              for (let i = 0; i < commentInfo.length; i++) {
                const comnt_text = commentInfo[i].comnt_text;
                const rating = commentInfo[i].rating;
                const timestamp = commentInfo[i].time_stamp;
                const commentHeading = document.createElement("h3");
                const commentTextElement = document.createElement("p");
                const ratingElement = document.createElement("p");
                const timestampElement = document.createElement("p");
                commentHeading.textContent = "User Comment";
                commentTextElement.textContent = comnt_text;
                console.log(commentTextElement);
                ratingElement.textContent = `Rating: ${rating}`;
                timestampElement.textContent = `Timestamp: ${timestamp}`;

                commentDiv.appendChild(commentHeading);
                commentDiv.appendChild(commentTextElement);
                commentDiv.appendChild(ratingElement);
                commentDiv.appendChild(timestampElement);
              }
              eventDiv.appendChild(commentDiv);
            })
            .catch((error) => {
              console.error(
                "There was a problem with your fetch operation:",
                error
              );
            });
        })
        .catch((error) => {
          console.error(
            "There was a problem with your fetch operation:",
            error
          );
        });

      const insertCommentDiv = document.createElement("div");
      insertCommentDiv.className = "insert_comments";
      const commentArea = document.createElement("textarea");
      commentArea.placeholder = "Comment on this event!";
      insertCommentDiv.appendChild(commentArea);
      const submitCommentButton = document.createElement("button");
      submitCommentButton.textContent = "Submit";

      const ratingDiv = document.createElement("ratingDiv");
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

      submitCommentButton.addEventListener("click", function (event) {
        const commentText = commentArea.value;
        const ratingNum = ratingInput.value;

        let newCommentInfo = {};
        newCommentInfo["commentText"] = commentText;
        newCommentInfo["ratingNum"] = ratingNum;
        newCommentInfo["evnt_id"] = eventId;
        fetch(`${eventServerAddress}/insert_comment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCommentInfo),
        })
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            throw new Error("Network response was not ok.");
          })
          .then((data) => {
            console.log("Comment succesful", data);
            // Optionally, you can redirect the user to another page or show a success message here
          })
          .catch((error) => {
            console.error("Error during comment:", error);
            // Optionally, you can show an error message to the user here
          });
      });
      insertCommentDiv.appendChild(submitCommentButton);
      const editCommentButton = document.createElement("button");
      editCommentButton.textContent = "Edit Comment";
      editCommentButton.addEventListener("click", function (event) {
        console.log("edit button clicked");
      });
      insertCommentDiv.appendChild(editCommentButton);
      insertCommentDiv.appendChild(ratingDiv);

      eventDiv.appendChild(insertCommentDiv);
      //add eventDiv to the body
      document.body.appendChild(eventDiv);
    });
  });
