const playlistModel = require("../models/playlistModel");
const songModel = require("../models/songModel");
const reviewModel = require("../models/reviewModel");
const likedSongModel = require("../models/likedSongModel");

// Sort playlists using simple comparisons taught in school.
// Each branch changes the same array in place before it is rendered.
function sortPlaylists(playlists, sortType) {
  if (sortType === "A-Z") {
    playlists.sort(function (a, b) {
      if (a.name < b.name) {
        return -1;
      }

      if (a.name > b.name) {
        return 1;
      }

      return 0;
    });
  } else if (sortType === "Z-A") {
    playlists.sort(function (a, b) {
      if (a.name < b.name) {
        return 1;
      }

      if (a.name > b.name) {
        return -1;
      }

      return 0;
    });
  }
}

// Show all playlists for the logged-in user.
// The controller can sort the list before rendering the page.
async function listPlaylists(req, res) {
  const sortType = (req.query.sortType || "").trim();

  try {
    let playlists = await playlistModel.getAllPlaylists(req.session.user.id);

    // Sort the playlists only when the user selected a sort type.
    sortPlaylists(playlists, sortType);

    return res.render("playlists/playlist-list", {
      title: "All Playlists",
      user: req.session.user,
      playlists: playlists,
      sortType: sortType,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("playlists/playlist-list", {
      title: "All Playlists",
      user: req.session.user,
      playlists: [],
      sortType: sortType,
      error: "Something went wrong."
    });
  }
}

// Show the add playlist page.
// This page only needs empty form values because playlists no longer store genre.
function showAddPlaylistForm(req, res) {
  return res.render("playlists/add-playlist", {
    title: "Add Playlist",
    user: req.session.user,
    error: "",
    formData: {
      name: "",
      description: ""
    }
  });
}

// Read the submitted playlist form, validate it, and save the new playlist.
// If validation fails, re-render the same form with the user's typed values.
async function createPlaylist(req, res) {
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();

  try {
    // Stop and show the form again if any required field is missing.
    // This avoids saving incomplete playlist documents in MongoDB.
    if (!name || !description) {
      return res.render("playlists/add-playlist", {
        title: "Add Playlist",
        user: req.session.user,
        error: "All fields are required.",
        formData: {
          name: name,
          description: description
        }
      });
    }

    // Build the playlist object that will be saved into MongoDB.
    // userId links the playlist back to the currently logged-in user.
    const playlistData = {
      name: name,
      description: description,
      userId: req.session.user.id
    };

    const playlist = await playlistModel.createPlaylist(playlistData);

    return res.redirect("/playlists/view?id=" + playlist._id);
  } catch (error) {
    console.error(error);

    return res.render("playlists/add-playlist", {
      title: "Add Playlist",
      user: req.session.user,
      error: "Something went wrong.",
      formData: {
        name: name,
        description: description
      }
    });
  }
}

// Show one playlist together with the songs that belong to it.
// The controller also checks ownership so one user cannot open another user's playlist.
async function showPlaylist(req, res) {
  const playlistId = (req.query.id || "").trim();
  const searchTerm = (req.query.search || "").trim();

  try {
    if (!playlistId) {
      return res.render("playlists/playlist-detail", {
        title: "Playlist Details",
        user: req.session.user,
        playlist: null,
        songs: [],
        searchTerm: searchTerm,
        error: "Playlist not found."
      });
    }

    const playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist || String(playlist.userId) !== String(req.session.user.id)) {
      return res.render("playlists/playlist-detail", {
        title: "Playlist Details",
        user: req.session.user,
        playlist: null,
        songs: [],
        searchTerm: searchTerm,
        error: "Playlist not found."
      });
    }

    let songs = await songModel.getSongsByPlaylistId(playlistId);

    if (searchTerm) {
      const loweredSearchTerm = searchTerm.toLowerCase();

      songs = songs.filter(function (song) {
        return song.title.toLowerCase().includes(loweredSearchTerm);
      });
    }

    return res.render("playlists/playlist-detail", {
      title: playlist.name,
      user: req.session.user,
      playlist: playlist,
      songs: songs,
      searchTerm: searchTerm,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("playlists/playlist-detail", {
      title: "Playlist Details",
      user: req.session.user,
      playlist: null,
      songs: [],
      searchTerm: searchTerm,
      error: "Something went wrong."
    });
  }
}

// Load one existing playlist and place its current values into the edit form.
// The page only edits playlist information, not song or genre data.
async function showEditPlaylist(req, res) {
  const playlistId = (req.query.playlistId || "").trim();

  try {
    if (!playlistId) {
      return res.render("playlists/edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "Playlist not found.",
        formData: {
          playlistId: "",
          name: "",
          description: ""
        }
      });
    }

    const playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist || String(playlist.userId) !== String(req.session.user.id)) {
      return res.render("playlists/edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "Playlist not found.",
        formData: {
          playlistId: "",
          name: "",
          description: ""
        }
      });
    }

    return res.render("playlists/edit-playlist", {
      title: "Edit Playlist",
      user: req.session.user,
      error: "",
      formData: {
        playlistId: playlist._id,
        name: playlist.name,
        description: playlist.description
      }
    });
  } catch (error) {
    console.error(error);

    return res.render("playlists/edit-playlist", {
      title: "Edit Playlist",
      user: req.session.user,
      error: "Something went wrong.",
      formData: {
        playlistId: "",
        name: "",
        description: ""
      }
    });
  }
}

// Read the edited playlist form, validate it, and update the saved playlist document.
// If anything is invalid, re-render the same page with the submitted values still filled in.
async function editPlaylist(req, res) {
  const playlistId = (req.body.playlistId || "").trim();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();

  const formData = {
    playlistId: playlistId,
    name: name,
    description: description
  };

  try {
    if (!playlistId) {
      return res.render("playlists/edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "Playlist not found.",
        formData: formData
      });
    }

    const existingPlaylist = await playlistModel.getPlaylistById(playlistId);

    if (!existingPlaylist || String(existingPlaylist.userId) !== String(req.session.user.id)) {
      return res.render("playlists/edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "Playlist not found.",
        formData: formData
      });
    }

    if (!name || !description) {
      return res.render("playlists/edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "All fields are required.",
        formData: formData
      });
    }

    const updatedData = {
      name: name,
      description: description
    };

    await playlistModel.updatePlaylistById(playlistId, updatedData);

    return res.redirect("/playlists/view?id=" + playlistId);
  } catch (error) {
    console.error(error);

    return res.render("playlists/edit-playlist", {
      title: "Edit Playlist",
      user: req.session.user,
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Delete one playlist and the related child data connected to it.
// This includes songs, reviews linked to those songs, and liked song records linked to those songs.
async function deletePlaylist(req, res) {
  const playlistId = (req.body.playlistId || "").trim();

  try {
    if (!playlistId) {
      const playlists = await playlistModel.getAllPlaylists(req.session.user.id);

      return res.render("playlists/playlist-list", {
        title: "All Playlists",
        user: req.session.user,
        playlists: playlists,
        sortType: "",
        error: "Playlist not found."
      });
    }

    const playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist || String(playlist.userId) !== String(req.session.user.id)) {
      const playlists = await playlistModel.getAllPlaylists(req.session.user.id);

      return res.render("playlists/playlist-list", {
        title: "All Playlists",
        user: req.session.user,
        playlists: playlists,
        sortType: "",
        error: "Playlist not found."
      });
    }

    const songs = await songModel.getSongsByPlaylistId(playlistId);

    for (const song of songs) {
      // Delete the child data that points to this song before deleting the song itself.
      // This keeps the reviews and liked songs collections tidy.
      await reviewModel.deleteReviewsBySongId(song._id);
      await likedSongModel.deleteLikedSongsBySongId(song._id);
      await songModel.deleteSongById(song._id);
    }

    await playlistModel.deletePlaylistById(playlistId);

    return res.redirect("/playlists");
  } catch (error) {
    console.error(error);

    return res.render("playlists/playlist-list", {
      title: "All Playlists",
      user: req.session.user,
      playlists: [],
      sortType: "",
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listPlaylists: listPlaylists,
  showAddPlaylistForm: showAddPlaylistForm,
  createPlaylist: createPlaylist,
  showPlaylist: showPlaylist,
  showEditPlaylist: showEditPlaylist,
  editPlaylist: editPlaylist,
  deletePlaylist: deletePlaylist
};
