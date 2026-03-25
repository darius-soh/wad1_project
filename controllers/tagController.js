const tagModel = require("../models/tagModel");
const playlistModel = require("../models/playlistModel");

// Load all playlists that belong to the logged-in user.
// We need these playlists because every tag must be attached to one playlist.
async function loadUserPlaylists(userId) {
  return playlistModel.getAllPlaylists(userId);
}

// Search through a list of playlists and return the one that matches the given ID.
// This lets the controller confirm that the user selected one of their own playlists.
function findPlaylistById(playlists, playlistId) {
  for (const playlist of playlists) {
    if (String(playlist._id) === playlistId) {
      return playlist;
    }
  }

  return null;
}

// Build a blank object for the tag form fields.
// This keeps the EJS form predictable on first load and after validation errors.
function buildEmptyTagFormData(playlistId) {
  return {
    tagId: "",
    playlistId: playlistId || "",
    name: "",
    description: ""
  };
}

// Add a helper property called playlistName to each tag.
// This makes the list page easier to render because the EJS file can show the playlist title directly.
function attachPlaylistNamesToTags(tags, playlists) {
  for (const tag of tags) {
    tag.playlistName = "";

    for (const playlist of playlists) {
      if (String(playlist._id) === String(tag.playlistId)) {
        tag.playlistName = playlist.name;
      }
    }
  }
}

// Load all tags for the current user and show them on the tags list page.
// We also match each tag to its playlist name so the page is easier to understand.
async function listTags(req, res) {
  try {
    const tags = await tagModel.getAllTags(req.session.user.id);
    const playlists = await loadUserPlaylists(req.session.user.id);

    // Match each saved tag with its playlist name before rendering the page.
    // This is only for display and does not change the database.
    attachPlaylistNamesToTags(tags, playlists);

    return res.render("tag-list", {
      title: "All Tags",
      user: req.session.user,
      tags: tags,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("tag-list", {
      title: "All Tags",
      user: req.session.user,
      tags: [],
      error: "Something went wrong."
    });
  }
}

// Open the add tag form and load the user's playlists for the dropdown box.
// The user must choose a playlist because each tag belongs to one playlist.
async function showAddTagForm(req, res) {
  const playlistId = (req.query.playlistId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);

    return res.render("add-tag", {
      title: "Add Tag",
      user: req.session.user,
      playlists: playlists,
      error: "",
      formData: buildEmptyTagFormData(playlistId)
    });
  } catch (error) {
    console.error(error);

    return res.render("add-tag", {
      title: "Add Tag",
      user: req.session.user,
      playlists: [],
      error: "Something went wrong.",
      formData: buildEmptyTagFormData(playlistId)
    });
  }
}

// Read the submitted form values, validate them, and save the new tag.
// If successful, redirect to /tags so the user can see the updated list.
async function createTag(req, res) {
  const playlistId = (req.body.playlistId || "").trim();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();

  const formData = {
    tagId: "",
    playlistId: playlistId,
    name: name,
    description: description
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const selectedPlaylist = findPlaylistById(playlists, playlistId);

    // Confirm that the chosen playlist really belongs to the logged-in user.
    // This prevents a tag from being attached to another user's playlist.
    if (!selectedPlaylist) {
      return res.render("add-tag", {
        title: "Add Tag",
        user: req.session.user,
        playlists: playlists,
        error: "Playlist not found.",
        formData: formData
      });
    }

    // Both the tag name and description are required before saving.
    // If not, send the same form back with the values the user already typed.
    if (!name || !description) {
      return res.render("add-tag", {
        title: "Add Tag",
        user: req.session.user,
        playlists: playlists,
        error: "All fields are required.",
        formData: formData
      });
    }

    // Use the tag model to create a new MongoDB document for this tag.
    // The playlistId links the tag to one playlist, and userId links it to one user.
    await tagModel.createTag({
      playlistId: playlistId,
      name: name,
      description: description,
      userId: req.session.user.id
    });

    // Redirect back to /tags after saving.
    // The next request will load the newest list from the database.
    return res.redirect("/tags");
  } catch (error) {
    console.error(error);

    return res.render("add-tag", {
      title: "Add Tag",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Load one saved tag and place its current values into the edit form.
// The playlist dropdown is also loaded so the user can move the tag to another playlist if needed.
async function showEditTagForm(req, res) {
  const tagId = (req.query.tagId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);

    // Read the tag ID from the URL query string.
    // Without this ID, the controller cannot know which tag to load.
    if (!tagId) {
      return res.render("edit-tag", {
        title: "Edit Tag",
        user: req.session.user,
        playlists: playlists,
        error: "Tag not found.",
        formData: buildEmptyTagFormData("")
      });
    }

    const tag = await tagModel.getTagById(tagId);

    // Confirm that the tag exists and belongs to the logged-in user.
    // This protects the edit page from exposing another user's data.
    if (!tag || String(tag.userId) !== String(req.session.user.id)) {
      return res.render("edit-tag", {
        title: "Edit Tag",
        user: req.session.user,
        playlists: playlists,
        error: "Tag not found.",
        formData: buildEmptyTagFormData("")
      });
    }

    return res.render("edit-tag", {
      title: "Edit Tag",
      user: req.session.user,
      playlists: playlists,
      error: "",
      formData: {
        tagId: tag._id,
        playlistId: String(tag.playlistId),
        name: tag.name,
        description: tag.description
      }
    });
  } catch (error) {
    console.error(error);

    return res.render("edit-tag", {
      title: "Edit Tag",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      error: "Something went wrong.",
      formData: buildEmptyTagFormData("")
    });
  }
}

// Read the edited values from the form, validate them, and update the existing tag.
// If something is invalid, re-render the same form with the user's typed values.
async function editTag(req, res) {
  const tagId = (req.body.tagId || "").trim();
  const playlistId = (req.body.playlistId || "").trim();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();

  const formData = {
    tagId: tagId,
    playlistId: playlistId,
    name: name,
    description: description
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const selectedPlaylist = findPlaylistById(playlists, playlistId);
    const tag = await tagModel.getTagById(tagId);

    // Load the current tag first and confirm ownership.
    // This makes sure we only update tags that belong to the logged-in user.
    if (!tag || String(tag.userId) !== String(req.session.user.id)) {
      return res.render("edit-tag", {
        title: "Edit Tag",
        user: req.session.user,
        playlists: playlists,
        error: "Tag not found.",
        formData: formData
      });
    }

    // Make sure the newly selected playlist also belongs to the current user.
    // This prevents the tag from being moved to someone else's playlist.
    if (!selectedPlaylist) {
      return res.render("edit-tag", {
        title: "Edit Tag",
        user: req.session.user,
        playlists: playlists,
        error: "Playlist not found.",
        formData: formData
      });
    }

    // Both text fields are required before we update the tag document.
    // If not, send the form back so the user can finish the missing input.
    if (!name || !description) {
      return res.render("edit-tag", {
        title: "Edit Tag",
        user: req.session.user,
        playlists: playlists,
        error: "All fields are required.",
        formData: formData
      });
    }

    // Use the tag model to update the existing tag document in MongoDB.
    // This can change the playlistId, name, and description of the tag.
    await tagModel.updateTagById(tagId, {
      playlistId: playlistId,
      name: name,
      description: description
    });

    // Redirect to /tags after the update is complete.
    // The browser will then load the latest saved tag list.
    return res.redirect("/tags");
  } catch (error) {
    console.error(error);

    return res.render("edit-tag", {
      title: "Edit Tag",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Remove one tag that belongs to the logged-in user.
// After deleting it, redirect back to the tags list page.
async function deleteTag(req, res) {
  const tagId = (req.body.tagId || "").trim();

  try {
    // Read the tag ID from the submitted delete form.
    // If the ID is missing, the controller cannot tell MongoDB which tag to remove.
    if (!tagId) {
      const tags = await tagModel.getAllTags(req.session.user.id);
      const playlists = await loadUserPlaylists(req.session.user.id);
      attachPlaylistNamesToTags(tags, playlists);

      return res.render("tag-list", {
        title: "All Tags",
        user: req.session.user,
        tags: tags,
        error: "Tag not found."
      });
    }

    const tag = await tagModel.getTagById(tagId);

    // Load the tag first and confirm ownership before deleting it.
    // This protects the delete route from removing another user's tag.
    if (!tag || String(tag.userId) !== String(req.session.user.id)) {
      const tags = await tagModel.getAllTags(req.session.user.id);
      const playlists = await loadUserPlaylists(req.session.user.id);
      attachPlaylistNamesToTags(tags, playlists);

      return res.render("tag-list", {
        title: "All Tags",
        user: req.session.user,
        tags: tags,
        error: "Tag not found."
      });
    }

    // Use the tag model's delete function to remove the tag document from MongoDB.
    // Once deleted, it will not appear the next time the tags list is loaded.
    await tagModel.deleteTagById(tagId);

    // Redirect back to /tags after the delete finishes.
    // This creates a new request that shows the updated tag list.
    return res.redirect("/tags");
  } catch (error) {
    console.error(error);

    return res.render("tag-list", {
      title: "All Tags",
      user: req.session.user,
      tags: [],
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listTags: listTags,
  showAddTagForm: showAddTagForm,
  createTag: createTag,
  showEditTagForm: showEditTagForm,
  editTag: editTag,
  deleteTag: deleteTag
};
