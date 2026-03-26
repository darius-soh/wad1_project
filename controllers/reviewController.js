const reviewModel = require("../models/reviewModel");
const songModel = require("../models/songModel");
const playlistModel = require("../models/playlistModel");

// Load all playlists that belong to the logged-in user.
// We start from playlists because songs are linked to playlists, and reviews are linked to songs.
async function loadUserPlaylists(userId) {
  return playlistModel.getAllPlaylists(userId);
}

// Load every song that belongs to the user's playlists.
// This gives the review pages a list of songs that the current user is allowed to use.
async function loadUserSongs(playlists) {
  const songs = [];

  for (const playlist of playlists) {
    // Load all songs whose playlistId matches this playlist's MongoDB _id.
    const playlistSongs = await songModel.getSongsByPlaylistId(playlist._id);

    for (const song of playlistSongs) {
      // Add the playlist name directly onto the song object.
      // This makes it easier for the EJS page to show both song and playlist information.
      song.playlistName = playlist.name;
      songs.push(song);
    }
  }

  return songs;
}

// Find one song inside a list using a loop.
// The controller uses this when it needs to check whether a selected song belongs to the current user.
function findSongById(songs, songId) {
  for (const song of songs) {
    // song._id is the MongoDB ID stored on the song document itself.
    // songId usually comes from req.body or req.query, so it is already a string from the form or URL.
    if (String(song._id) === songId) {
      return song;
    }
  }

  return null;
}

// Build the empty review form data.
// This gives the add/edit pages default values so the form does not break when first rendered.
function buildEmptyReviewFormData(songId) {
  return {
    reviewId: "",
    songId: songId || "",
    title: "",
    comment: "",
    rating: ""
  };
}

// Match each review to its song and playlist names before showing the list page.
// A review stores songId only, so we look through the songs list to find the full song details.
function attachSongDetailsToReviews(reviews, songs) {
  for (const review of reviews) {
    // Start with blank values in case no matching song is found.
    review.songTitle = "";
    review.playlistName = "";

    for (const song of songs) {
      // review.songId comes from the Review document in MongoDB.
      // It stores the _id of the song that this review belongs to.
      //
      // song._id comes from the Song document in MongoDB.
      // It is the actual ID of that song.
      //
      // We convert both values to strings because MongoDB IDs are ObjectId values,
      // and comparing ObjectId values directly is confusing.
      // After converting both to strings, we can safely check whether they represent the same ID.
      if (String(song._id) === String(review.songId)) {
        // If the IDs match, this review belongs to this song.
        // We copy the song title and playlist name so the EJS page can display them easily.
        review.songTitle = song.title;
        review.playlistName = song.playlistName;
      }
    }
  }
}

// Load all reviews that belong to the current user and show them on the reviews page.
// Before rendering, we also attach song and playlist names so the page is easier to understand.
async function listReviews(req, res) {
  try {
    const reviews = await reviewModel.getAllReviews(req.session.user.id);
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    // Reviews only store songId, not the full song title.
    // This helper adds friendly display values before we send the data to EJS.
    attachSongDetailsToReviews(reviews, songs);

    return res.render("reviews/review-list", {
      title: "All Reviews",
      user: req.session.user,
      reviews: reviews,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("reviews/review-list", {
      title: "All Reviews",
      user: req.session.user,
      reviews: [],
      error: "Something went wrong."
    });
  }
}

// Open the add review form.
// We also load the user's songs so the form can show them in a dropdown list.
async function showAddReviewForm(req, res) {
  // songId may come from a URL like /reviews/add?songId=...
  // If present, we use it to pre-select the song in the form.
  const songId = (req.query.songId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("reviews/add-review", {
      title: "Add Review",
      user: req.session.user,
      songs: songs,
      error: "",
      formData: buildEmptyReviewFormData(songId)
    });
  } catch (error) {
    console.error(error);

    return res.render("reviews/add-review", {
      title: "Add Review",
      user: req.session.user,
      songs: [],
      error: "Something went wrong.",
      formData: buildEmptyReviewFormData(songId)
    });
  }
}

// Read the submitted review form, validate it, and save the new review in MongoDB.
// If validation fails, show the same form again with the user's typed values still filled in.
async function createReview(req, res) {
  // songId comes from the form dropdown in add-review.ejs.
  // It tells us which song this new review should belong to.
  const songId = (req.body.songId || "").trim();
  const title = (req.body.title || "").trim();
  const comment = (req.body.comment || "").trim();
  const rating = (req.body.rating || "").trim();

  // Keep a copy of the submitted values.
  // If there is an error, we send this object back so the form keeps the user's input.
  const formData = {
    reviewId: "",
    songId: songId,
    title: title,
    comment: comment,
    rating: rating
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    // Try to find the chosen song inside the current user's song list.
    // If we cannot find it, the song either does not exist or does not belong to this user.
    const selectedSong = findSongById(songs, songId);

    // Check that the user selected one of their own songs.
    // This stops a review from being attached to another user's song.
    if (!selectedSong) {
      return res.render("reviews/add-review", {
        title: "Add Review",
        user: req.session.user,
        songs: songs,
        error: "Song not found.",
        formData: formData
      });
    }

    // All fields are required for a review.
    // If any field is empty, show the form again and keep the typed values.
    if (!title || !comment || !rating) {
      return res.render("reviews/add-review", {
        title: "Add Review",
        user: req.session.user,
        songs: songs,
        error: "All fields are required.",
        formData: formData
      });
    }

    // Convert the rating from a text value into a number.
    // Form values always arrive as strings in req.body.
    const ratingNumber = Number(rating);

    // Rating must be between 1 and 5.
    // Number.isNaN checks whether the user typed something that is not a valid number.
    if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.render("reviews/add-review", {
        title: "Add Review",
        user: req.session.user,
        songs: songs,
        error: "Rating must be a number from 1 to 5.",
        formData: formData
      });
    }

    // Use the review model to create a new review document in MongoDB.
    // songId links the review to one song, and userId links the review to the logged-in user.
    await reviewModel.createReview({
      songId: songId,
      title: title,
      comment: comment,
      rating: ratingNumber,
      userId: req.session.user.id
    });

    // Redirect to /reviews after saving.
    // The browser will send a fresh GET request and load the updated list page.
    return res.redirect("/reviews");
  } catch (error) {
    console.error(error);

    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("reviews/add-review", {
      title: "Add Review",
      user: req.session.user,
      songs: songs,
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Load one existing review and place its current values into the edit form.
// The song dropdown is also loaded so the user can choose which song this review belongs to.
async function showEditReviewForm(req, res) {
  // reviewId comes from a URL like /reviews/edit?reviewId=...
  // We need this ID to know which review document to load from MongoDB.
  const reviewId = (req.query.reviewId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    // If reviewId is missing, we do not know which review to edit.
    // In that case, show the form with an error message instead.
    if (!reviewId) {
      return res.render("reviews/edit-review", {
        title: "Edit Review",
        user: req.session.user,
        songs: songs,
        error: "Review not found.",
        formData: buildEmptyReviewFormData("")
      });
    }

    // Load the actual review document from MongoDB using its _id value.
    const review = await reviewModel.getReviewById(reviewId);

    // Stop if the review does not exist or belongs to another user.
    // This protects the edit page from exposing data across accounts.
    if (!review || String(review.userId) !== String(req.session.user.id)) {
      return res.render("reviews/edit-review", {
        title: "Edit Review",
        user: req.session.user,
        songs: songs,
        error: "Review not found.",
        formData: buildEmptyReviewFormData("")
      });
    }

    // review.songId comes from the saved review document in MongoDB.
    // We check whether that song appears inside the current user's allowed song list.
    if (!findSongById(songs, String(review.songId))) {
      return res.render("reviews/edit-review", {
        title: "Edit Review",
        user: req.session.user,
        songs: songs,
        error: "Review not found.",
        formData: buildEmptyReviewFormData("")
      });
    }

    // Send the existing review values into the edit page.
    // String(review.songId) is used so the dropdown can compare it with option values from HTML.
    return res.render("reviews/edit-review", {
      title: "Edit Review",
      user: req.session.user,
      songs: songs,
      error: "",
      formData: {
        reviewId: review._id,
        songId: String(review.songId),
        title: review.title,
        comment: review.comment,
        rating: String(review.rating)
      }
    });
  } catch (error) {
    console.error(error);

    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("reviews/edit-review", {
      title: "Edit Review",
      user: req.session.user,
      songs: songs,
      error: "Something went wrong.",
      formData: buildEmptyReviewFormData("")
    });
  }
}

// Read the edited review form, validate it, and update the existing review document.
// If validation fails, re-render the page and keep the user's typed values.
async function editReview(req, res) {
  // reviewId tells us which review document to update.
  // songId tells us which song this review should point to after the update.
  const reviewId = (req.body.reviewId || "").trim();
  const songId = (req.body.songId || "").trim();
  const title = (req.body.title || "").trim();
  const comment = (req.body.comment || "").trim();
  const rating = (req.body.rating || "").trim();

  // Keep a copy of the submitted values so the form can be re-rendered safely on error.
  const formData = {
    reviewId: reviewId,
    songId: songId,
    title: title,
    comment: comment,
    rating: rating
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    // Check whether the chosen song exists inside the current user's song list.
    const selectedSong = findSongById(songs, songId);

    // Load the current review document from MongoDB before updating it.
    const review = await reviewModel.getReviewById(reviewId);

    // Stop if the review does not exist or belongs to another user.
    // This prevents cross-user updates.
    if (!review || String(review.userId) !== String(req.session.user.id)) {
      return res.render("reviews/edit-review", {
        title: "Edit Review",
        user: req.session.user,
        songs: songs,
        error: "Review not found.",
        formData: formData
      });
    }

    // Make sure the new song choice also belongs to the current user.
    // This prevents the review from being moved to another user's song.
    if (!selectedSong) {
      return res.render("reviews/edit-review", {
        title: "Edit Review",
        user: req.session.user,
        songs: songs,
        error: "Song not found.",
        formData: formData
      });
    }

    // All fields are required before we update the review.
    // If not, show the same form again and keep the input values.
    if (!title || !comment || !rating) {
      return res.render("reviews/edit-review", {
        title: "Edit Review",
        user: req.session.user,
        songs: songs,
        error: "All fields are required.",
        formData: formData
      });
    }

    // Convert the rating from string form input into a number.
    const ratingNumber = Number(rating);

    // Rating must be between 1 and 5.
    // This keeps review documents consistent in MongoDB.
    if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.render("reviews/edit-review", {
        title: "Edit Review",
        user: req.session.user,
        songs: songs,
        error: "Rating must be a number from 1 to 5.",
        formData: formData
      });
    }

    // Use the review model to update the saved MongoDB document.
    // This changes the linked song, title, comment, and rating if needed.
    await reviewModel.updateReviewById(reviewId, {
      songId: songId,
      title: title,
      comment: comment,
      rating: ratingNumber
    });

    // Redirect back to /reviews after the update finishes.
    // The next request will load the newest saved values from the database.
    return res.redirect("/reviews");
  } catch (error) {
    console.error(error);

    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("reviews/edit-review", {
      title: "Edit Review",
      user: req.session.user,
      songs: songs,
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Remove one review that belongs to the logged-in user.
// After deleting it, redirect back to the reviews list page.
async function deleteReview(req, res) {
  // reviewId comes from the hidden input inside the delete form.
  // We need it so MongoDB knows which review document to remove.
  const reviewId = (req.body.reviewId || "").trim();

  try {
    // If there is no reviewId, we cannot delete anything.
    // In that case, rebuild the review list page and show an error.
    if (!reviewId) {
      const reviews = await reviewModel.getAllReviews(req.session.user.id);
      const playlists = await loadUserPlaylists(req.session.user.id);
      const songs = await loadUserSongs(playlists);
      attachSongDetailsToReviews(reviews, songs);

      return res.render("reviews/review-list", {
        title: "All Reviews",
        user: req.session.user,
        reviews: reviews,
        error: "Review not found."
      });
    }

    const review = await reviewModel.getReviewById(reviewId);

    // Load the review and confirm that it belongs to the current user before deleting it.
    // This prevents one user from deleting another user's review.
    if (!review || String(review.userId) !== String(req.session.user.id)) {
      const reviews = await reviewModel.getAllReviews(req.session.user.id);
      const playlists = await loadUserPlaylists(req.session.user.id);
      const songs = await loadUserSongs(playlists);
      attachSongDetailsToReviews(reviews, songs);

      return res.render("reviews/review-list", {
        title: "All Reviews",
        user: req.session.user,
        reviews: reviews,
        error: "Review not found."
      });
    }

    // Use the review model's delete function to remove the review document from MongoDB.
    // After this, the review will no longer appear on the list page.
    await reviewModel.deleteReviewById(reviewId);

    // Redirect to /reviews so the browser loads the updated review list.
    return res.redirect("/reviews");
  } catch (error) {
    console.error(error);

    return res.render("reviews/review-list", {
      title: "All Reviews",
      user: req.session.user,
      reviews: [],
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listReviews: listReviews,
  showAddReviewForm: showAddReviewForm,
  createReview: createReview,
  showEditReviewForm: showEditReviewForm,
  editReview: editReview,
  deleteReview: deleteReview
};
