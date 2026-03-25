const songModel = require("../models/songModel");
const playlistModel = require("../models/playlistModel");
const reviewModel = require("../models/reviewModel");

// Load all playlists that belong to the logged-in user.
// We use these playlists to work out which songs the current user is allowed to access.
async function loadUserPlaylists(userId) {
  return playlistModel.getAllPlaylists(userId);
}

// Find one playlist inside a list using a simple loop.
// This helps the controller confirm that a chosen playlist belongs to the current user.
function findPlaylistById(playlists, playlistId) {
  for (const playlist of playlists) {
    // playlist._id comes from MongoDB, while playlistId usually comes from a form or URL.
    // Converting the document ID to a string makes the comparison easier to understand.
    if (String(playlist._id) === playlistId) {
      return playlist;
    }
  }

  return null;
}

// Find which playlist a song belongs to.
// A song stores playlistId, so we compare that saved value against playlist._id values.
function findPlaylistForSong(song, playlists) {
  for (const playlist of playlists) {
    // song.playlistId comes from the Song document.
    // playlist._id comes from the Playlist document.
    if (String(playlist._id) === String(song.playlistId)) {
      return playlist;
    }
  }

  return null;
}

// Load every song that belongs to the user's playlists.
// This gives the songs pages a safe list of songs owned by the logged-in user.
async function loadUserSongs(playlists) {
  const songs = [];

  for (const playlist of playlists) {
    // Load songs whose playlistId matches this playlist's MongoDB _id.
    const playlistSongs = await songModel.getSongsByPlaylistId(playlist._id);

    for (const song of playlistSongs) {
      // Add a helper property so the EJS page can show the playlist name directly.
      song.playlistName = playlist.name;
      songs.push(song);
    }
  }

  return songs;
}

// Build the empty song form data.
// This keeps the add/edit pages simple because the form always receives predictable values.
function buildEmptySongFormData(playlistId) {
  return {
    songId: "",
    playlistId: playlistId || "",
    title: "",
    artist: "",
    album: ""
  };
}

// Show all songs for the logged-in user.
// We load the user's playlists first, then all songs inside those playlists.
async function listSongs(req, res) {
  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("song-list", {
      title: "All Songs",
      user: req.session.user,
      songs: songs,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("song-list", {
      title: "All Songs",
      user: req.session.user,
      songs: [],
      error: "Something went wrong."
    });
  }
}

// Show one song.
// The controller also checks that the song belongs to the current user before showing it.
async function showSong(req, res) {
  const songId = (req.query.id || "").trim();

  try {
    // Check whether a song ID was provided.
    if (!songId) {
      return res.render("song-detail", {
        title: "Song Details",
        user: req.session.user,
        song: null,
        playlist: null,
        error: "Song not found."
      });
    }

    // Load the song document and all playlists owned by this user.
    // We later match the song back to its parent playlist.
    const song = await songModel.getSongById(songId);
    const playlists = await loadUserPlaylists(req.session.user.id);

    // Stop immediately if no song document was found.
    if (!song) {
      return res.render("song-detail", {
        title: "Song Details",
        user: req.session.user,
        song: null,
        playlist: null,
        error: "Song not found."
      });
    }

    // Find the playlist that owns this song.
    // If no matching playlist is found, this song does not belong to the current user.
    const playlist = findPlaylistForSong(song, playlists);

    // Stop if this song does not belong to the logged-in user.
    if (!playlist) {
      return res.render("song-detail", {
        title: "Song Details",
        user: req.session.user,
        song: null,
        playlist: null,
        error: "Song not found."
      });
    }

    // Show the song details page.
    return res.render("song-detail", {
      title: song.title,
      user: req.session.user,
      song: song,
      playlist: playlist,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("song-detail", {
      title: "Song Details",
      user: req.session.user,
      song: null,
      playlist: null,
      error: "Something went wrong."
    });
  }
}

// Show the add song form.
// We load the user's playlists so the form can show them in a dropdown.
async function showAddSongForm(req, res) {
  // playlistId may come from a URL like /songs/add?playlistId=...
  // If present, it can be used to pre-select one playlist in the form.
  const playlistId = (req.query.playlistId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);

    return res.render("add-song", {
      title: "Add Song",
      user: req.session.user,
      playlists: playlists,
      error: "",
      formData: buildEmptySongFormData(playlistId)
    });
  } catch (error) {
    console.error(error);

    return res.render("add-song", {
      title: "Add Song",
      user: req.session.user,
      playlists: [],
      error: "Something went wrong.",
      formData: buildEmptySongFormData(playlistId)
    });
  }
}

// Read the submitted song form, validate it, and save the new song.
// If validation fails, send the same form back with the typed values still filled in.
async function createSong(req, res) {
  // Read the form values and remove extra spaces.
  const playlistId = (req.body.playlistId || "").trim();
  const title = (req.body.title || "").trim();
  const artist = (req.body.artist || "").trim();
  const album = (req.body.album || "").trim();

  // Keep a copy of the submitted values so the form can be re-rendered safely on error.
  const formData = {
    songId: "",
    playlistId: playlistId,
    title: title,
    artist: artist,
    album: album
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const selectedPlaylist = findPlaylistById(playlists, playlistId);

    // Check that the user selected a valid playlist from their own playlist list.
    // This prevents a song from being attached to another user's playlist.
    if (!selectedPlaylist) {
      return res.render("add-song", {
        title: "Add Song",
        user: req.session.user,
        playlists: playlists,
        error: "Playlist not found.",
        formData: formData
      });
    }

    // Title, artist, and album are required for every song.
    if (!title || !artist || !album) {
      return res.render("add-song", {
        title: "Add Song",
        user: req.session.user,
        playlists: playlists,
        error: "Title, artist, and album are required.",
        formData: formData
      });
    }

    // Build the song object that will be saved into MongoDB.
    // Only fields that pass validation are included here.
    const songData = {
      playlistId: playlistId,
      title: title,
      artist: artist,
      album: album
    };

    // Save the song in MongoDB.
    const song = await songModel.createSong(songData);

    // Open the song detail page after saving.
    return res.redirect("/songs/view?id=" + song._id);
  } catch (error) {
    console.error(error);

    return res.render("add-song", {
      title: "Add Song",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Load one existing song and place its current values into the edit form.
// The playlist dropdown is also loaded so the user can move the song if needed.
async function showEditSongForm(req, res) {
  const songId = (req.query.songId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);

    // Check whether a song ID was provided.
    if (!songId) {
      return res.render("edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        error: "Song not found.",
        formData: buildEmptySongFormData("")
      });
    }

    const song = await songModel.getSongById(songId);

    // Stop if the song does not exist.
    if (!song) {
      return res.render("edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        error: "Song not found.",
        formData: buildEmptySongFormData("")
      });
    }

    // Stop if the song does not belong to one of this user's playlists.
    // This protects the edit page from exposing another user's data.
    const playlist = findPlaylistForSong(song, playlists);

    if (!playlist) {
      return res.render("edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        error: "Song not found.",
        formData: buildEmptySongFormData("")
      });
    }

    // Show the edit form with the song's current values.
    return res.render("edit-song", {
      title: "Edit Song",
      user: req.session.user,
      playlists: playlists,
      error: "",
      formData: {
        songId: song._id,
        playlistId: String(song.playlistId),
        title: song.title,
        artist: song.artist,
        album: song.album
      }
    });
  } catch (error) {
    console.error(error);

    return res.render("edit-song", {
      title: "Edit Song",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      error: "Something went wrong.",
      formData: buildEmptySongFormData("")
    });
  }
}

// Read the edited song form, validate it, and update the existing song document.
// If something is invalid, re-render the form with the values the user already typed.
async function editSong(req, res) {
  // Read the updated values from the form.
  const songId = (req.body.songId || "").trim();
  const playlistId = (req.body.playlistId || "").trim();
  const title = (req.body.title || "").trim();
  const artist = (req.body.artist || "").trim();
  const album = (req.body.album || "").trim();

  // Keep a copy of the submitted values so the form can be shown again after an error.
  const formData = {
    songId: songId,
    playlistId: playlistId,
    title: title,
    artist: artist,
    album: album
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const selectedPlaylist = findPlaylistById(playlists, playlistId);
    const existingSong = await songModel.getSongById(songId);

    // Check whether the song exists.
    if (!existingSong) {
      return res.render("edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        error: "Song not found.",
        formData: formData
      });
    }

    // Stop if the song does not belong to this user's playlists.
    // This prevents the current user from editing another user's song.
    const currentPlaylist = findPlaylistForSong(existingSong, playlists);

    if (!currentPlaylist) {
      return res.render("edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        error: "Song not found.",
        formData: formData
      });
    }

    // Check that the newly selected playlist also belongs to the current user.
    // This prevents the song from being moved to another user's playlist.
    if (!selectedPlaylist) {
      return res.render("edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        error: "Playlist not found.",
        formData: formData
      });
    }

    // Title, artist, and album are required.
    if (!title || !artist || !album) {
      return res.render("edit-song", {
        title: "Edit Song",
        user: req.session.user,
        playlists: playlists,
        error: "Title, artist, and album are required.",
        formData: formData
      });
    }

    // Build the update object that will replace the song's editable fields in MongoDB.
    const updatedData = {
      playlistId: playlistId,
      title: title,
      artist: artist,
      album: album
    };

    // Save the updated song in MongoDB.
    await songModel.updateSongById(songId, updatedData);

    // Open the song detail page after saving.
    return res.redirect("/songs/view?id=" + songId);
  } catch (error) {
    console.error(error);

    return res.render("edit-song", {
      title: "Edit Song",
      user: req.session.user,
      playlists: await loadUserPlaylists(req.session.user.id),
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Delete one song.
// This also deletes reviews linked to the song before removing the song itself.
async function deleteSong(req, res) {
  const songId = (req.body.songId || "").trim();

  try {
    // Check whether a song ID was provided.
    if (!songId) {
      const playlists = await loadUserPlaylists(req.session.user.id);
      const songs = await loadUserSongs(playlists);

      return res.render("song-list", {
        title: "All Songs",
        user: req.session.user,
        songs: songs,
        error: "Song not found."
      });
    }

    const song = await songModel.getSongById(songId);
    const playlists = await loadUserPlaylists(req.session.user.id);

    // Stop if the song does not exist or does not belong to one of this user's playlists.
    // This protects the delete route from cross-user access.
    if (!song || !findPlaylistForSong(song, playlists)) {
      const songs = await loadUserSongs(playlists);

      return res.render("song-list", {
        title: "All Songs",
        user: req.session.user,
        songs: songs,
        error: "Song not found."
      });
    }

    // Delete all reviews that belong to this song first.
    // This keeps the database tidy so no orphaned review documents remain.
    await reviewModel.deleteReviewsBySongId(songId);

    // Delete the song after its reviews are removed.
    await songModel.deleteSongById(songId);

    // Return to the songs list page.
    return res.redirect("/songs");
  } catch (error) {
    console.error(error);

    return res.render("song-list", {
      title: "All Songs",
      user: req.session.user,
      songs: [],
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listSongs: listSongs,
  showSong: showSong,
  showAddSongForm: showAddSongForm,
  createSong: createSong,
  showEditSongForm: showEditSongForm,
  editSong: editSong,
  deleteSong: deleteSong
};
