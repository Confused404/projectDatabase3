const serverAddress = "http://localhost:3000/";

fetch(`${serverAddress}/getData`)
  .then((response) => response.json())
  .then((data) => {
    // 'data' is an array of objects representing your database records
    // You can use this data to update your HTML
    // For example, you could create a new <p> element for each record:
    data.forEach((record) => {
      const eventDiv = document.createElement("eventDiv");
      eventDiv.className = "record";

      const eventTitle = document.createElement("h1");
      eventTitle.textContent = record.evnt_eventTitle;
      eventDiv.appendChild(eventTitle);

      const eventTime = document.createElement("h2");
      eventTime.textContent = record.evnt_time;
      eventDiv.appendChild(eventTime);

      //location should go here

      const eventDesc = document.createElement("p");
      eventDesc.innerHTML = record.evnt_eventDesc;
      eventDiv.appendChild(eventDesc);

      // do something to get the comments
      const commentDiv = document.createElement("eventDiv");
      commentDiv.className = "comments";

      const insertCommentDiv = document.createElement("div");
      insertCommentDiv.className = "insert_comments";
      const commentArea = document.createElement("textarea");
      commentArea.textContent = "Comment on this event!";
      insertCommenteventDiv.appendChild(commentArea);
      const sumbitCommentButton = document.createElement("button");
      sumbitCommentButton.textContent = "Submit";

      const ratingDiv = document.createElement("ratingDiv");
      ratingDiv.className = "rating_div";

      for (let i = 1; i <= 5; i++) {
        const ratingNum = document.createElement("span");
        ratingNum.className = "rating";
        ratingNum.textContent = "${i}";
        ratingDiv.appendChild(ratingNum);
      }
      const ratingInput = document.createElement("input");
      ratingInput.type = "range";
      ratingInput.min = "1";
      ratingInput.max = "5";
      ratingInput.step = "1";
      ratingInput.value = "3";
      ratingDiv.appendChild(ratingInput);

      ratingDiv.sumbitCommentButton.addEventListener("click", function (event) {
        const commentText = commentArea.value;
        const ratingNum = ratingInput.value;

        let commentInfo = {};
        commentInfo["commentText"] = commentText;
        commentInfo["ratingNum"] = ratingNum;
        fetch("localhost:3000/insert_comment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commentInfo),
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
      insertCommentDiv.appendChild(sumbitCommentButton);
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
