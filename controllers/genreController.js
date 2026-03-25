const genreModel = require("../models/genreModel");

// Build a blank object for the form fields.
// This gives the EJS page predictable values when the page first loads or when validation fails.
function buildEmptyGenreFormData() {
  return {
    genreId: "",
    name: "",
    description: ""
  };
}

// Load every genre that belongs to the logged-in user.
// Then send that data to the genres list page so the browser can display it.
async function listGenres(req, res) {
  try {
    const genres = await genreModel.getAllGenres(req.session.user.id);

    return res.render("genre-list", {
      title: "All Genres",
      user: req.session.user,
      genres: genres,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("genre-list", {
      title: "All Genres",
      user: req.session.user,
      genres: [],
      error: "Something went wrong."
    });
  }
}

// Open the add genre page with empty input values.
// No database work is needed here because we are only showing the form.
function showAddGenreForm(req, res) {
  return res.render("add-genre", {
    title: "Add Genre",
    user: req.session.user,
    error: "",
    formData: buildEmptyGenreFormData()
  });
}

// Read the submitted form values, validate them, and save the new genre.
// If the save is successful, redirect to /genres so the user can see the updated list.
async function createGenre(req, res) {
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();

  try {
    // Both fields are required before we try to save anything in MongoDB.
    // If either field is missing, show the same form again and keep the user's input.
    if (!name || !description) {
      return res.render("add-genre", {
        title: "Add Genre",
        user: req.session.user,
        error: "All fields are required.",
        formData: {
          genreId: "",
          name: name,
          description: description
        }
      });
    }

    // Use the genre model to create a new genre document in MongoDB.
    // We also save the current user's ID so each genre belongs to one user only.
    await genreModel.createGenre({
      name: name,
      description: description,
      userId: req.session.user.id
    });

    // After saving, send the user back to /genres.
    // This starts a new request that will load the fresh list from the database.
    return res.redirect("/genres");
  } catch (error) {
    console.error(error);

    return res.render("add-genre", {
      title: "Add Genre",
      user: req.session.user,
      error: "Something went wrong.",
      formData: {
        genreId: "",
        name: name,
        description: description
      }
    });
  }
}

// Load one existing genre and place its current values into the edit form.
// This lets the user see what is already saved before making changes.
async function showEditGenreForm(req, res) {
  const genreId = (req.query.genreId || "").trim();

  try {
    // Read the genre ID from the URL query string.
    // Without an ID, the controller does not know which genre to load.
    if (!genreId) {
      return res.render("edit-genre", {
        title: "Edit Genre",
        user: req.session.user,
        error: "Genre not found.",
        formData: buildEmptyGenreFormData()
      });
    }

    const genre = await genreModel.getGenreById(genreId);

    // Check that the genre exists and belongs to the logged-in user.
    // This prevents one user from editing another user's data.
    if (!genre || String(genre.userId) !== String(req.session.user.id)) {
      return res.render("edit-genre", {
        title: "Edit Genre",
        user: req.session.user,
        error: "Genre not found.",
        formData: buildEmptyGenreFormData()
      });
    }

    return res.render("edit-genre", {
      title: "Edit Genre",
      user: req.session.user,
      error: "",
      formData: {
        genreId: genre._id,
        name: genre.name,
        description: genre.description
      }
    });
  } catch (error) {
    console.error(error);

    return res.render("edit-genre", {
      title: "Edit Genre",
      user: req.session.user,
      error: "Something went wrong.",
      formData: buildEmptyGenreFormData()
    });
  }
}

// Read the edited values from the form, validate them, and update the saved genre.
// If validation fails, show the form again with the values the user already typed.
async function editGenre(req, res) {
  const genreId = (req.body.genreId || "").trim();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();

  const formData = {
    genreId: genreId,
    name: name,
    description: description
  };

  try {
    const genre = await genreModel.getGenreById(genreId);

    // Load the current genre from MongoDB first.
    // We do this to confirm that the genre exists and belongs to this user.
    if (!genre || String(genre.userId) !== String(req.session.user.id)) {
      return res.render("edit-genre", {
        title: "Edit Genre",
        user: req.session.user,
        error: "Genre not found.",
        formData: formData
      });
    }

    // Both fields are required before updating the genre document.
    // If not, re-render the form so the user can correct the missing input.
    if (!name || !description) {
      return res.render("edit-genre", {
        title: "Edit Genre",
        user: req.session.user,
        error: "All fields are required.",
        formData: formData
      });
    }

    // Use the genre model to update the existing genre document in MongoDB.
    // Only the name and description are changed here.
    await genreModel.updateGenreById(genreId, {
      name: name,
      description: description
    });

    // Redirect to /genres after the update is complete.
    // The next page load will fetch the latest saved version from the database.
    return res.redirect("/genres");
  } catch (error) {
    console.error(error);

    return res.render("edit-genre", {
      title: "Edit Genre",
      user: req.session.user,
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Remove one genre that belongs to the logged-in user.
// After deleting it, redirect back to the genres list page.
async function deleteGenre(req, res) {
  const genreId = (req.body.genreId || "").trim();

  try {
    // Read the genre ID from the submitted delete form.
    // If there is no ID, we cannot tell MongoDB which document to remove.
    if (!genreId) {
      const genres = await genreModel.getAllGenres(req.session.user.id);

      return res.render("genre-list", {
        title: "All Genres",
        user: req.session.user,
        genres: genres,
        error: "Genre not found."
      });
    }

    const genre = await genreModel.getGenreById(genreId);

    // Load the genre first and confirm ownership before deleting it.
    // This protects the route from deleting another user's genre by mistake.
    if (!genre || String(genre.userId) !== String(req.session.user.id)) {
      const genres = await genreModel.getAllGenres(req.session.user.id);

      return res.render("genre-list", {
        title: "All Genres",
        user: req.session.user,
        genres: genres,
        error: "Genre not found."
      });
    }

    // Use the genre model's delete function to remove the genre document from MongoDB.
    // Once deleted, it will no longer appear the next time /genres is loaded.
    await genreModel.deleteGenreById(genreId);

    // Send the user back to /genres after the delete is complete.
    // This creates a fresh request that shows the updated list page.
    return res.redirect("/genres");
  } catch (error) {
    console.error(error);

    return res.render("genre-list", {
      title: "All Genres",
      user: req.session.user,
      genres: [],
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listGenres: listGenres,
  showAddGenreForm: showAddGenreForm,
  createGenre: createGenre,
  showEditGenreForm: showEditGenreForm,
  editGenre: editGenre,
  deleteGenre: deleteGenre
};
