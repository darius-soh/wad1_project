const likedSongModel = require("../models/likedSongModel");
const songModel = require("../models/songModel");
const playlistModel = require("../models/playlistModel");

// Load all playlists that belong to the logged-in user.
// We start from playlists because songs belong to playlists.
async function loadUserPlaylists(userId) {
  return playlistModel.getAllPlaylists(userId);
}

// Load every song that belongs to the user's playlists.
// This gives the liked songs pages a safe list of songs owned by the logged-in user.
async function loadUserSongs(playlists) {
  const songs = [];

  for (const playlist of playlists) {
    const playlistSongs = await songModel.getSongsByPlaylistId(playlist._id);

    for (const song of playlistSongs) {
      // Add the playlist name directly to each song so EJS can display it easily.
      song.playlistName = playlist.name;
      songs.push(song);
    }
  }

  return songs;
}

// Search through a list of songs and return the one that matches the given ID.
// This helps the controller confirm that the selected song belongs to the current user.
function findSongById(songs, songId) {
  for (const song of songs) {
    if (String(song._id) === songId) {
      return song;
    }
  }

  return null;
}

// Build a blank object for the liked song form fields.
// This keeps the EJS form predictable on first load and after validation errors.
function buildEmptyLikedSongFormData(songId) {
  return {
    likedSongId: "",
    songId: songId || "",
    note: ""
  };
}

// Match each liked song entry to its song details before showing the list page.
// A liked song stores songId only, so we attach the display values here.
function attachSongDetailsToLikedSongs(likedSongs, songs) {
  for (const likedSong of likedSongs) {
    likedSong.songTitle = "";
    likedSong.artist = "";
    likedSong.album = "";
    likedSong.genre = "";
    likedSong.playlistName = "";

    for (const song of songs) {
      if (String(song._id) === String(likedSong.songId)) {
        likedSong.songTitle = song.title;
        likedSong.artist = song.artist;
        likedSong.album = song.album;
        likedSong.genre = song.genre;
        likedSong.playlistName = song.playlistName;
      }
    }
  }
}

// Load all liked songs for the current user and show them on the list page.
// We also attach song and playlist names so the page is easier to understand.
async function listLikedSongs(req, res) {
  try {
    const likedSongs = await likedSongModel.getAllLikedSongs(req.session.user.id);
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    attachSongDetailsToLikedSongs(likedSongs, songs);

    return res.render("liked-songs/liked-song-list", {
      title: "Liked Songs",
      user: req.session.user,
      likedSongs: likedSongs,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("liked-songs/liked-song-list", {
      title: "Liked Songs",
      user: req.session.user,
      likedSongs: [],
      error: "Something went wrong."
    });
  }
}

// Open the add liked song form.
// We also load the user's songs so the form can show them in a dropdown list.
async function showAddLikedSongForm(req, res) {
  const songId = (req.query.songId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("liked-songs/add-liked-song", {
      title: "Add Liked Song",
      user: req.session.user,
      songs: songs,
      error: "",
      formData: buildEmptyLikedSongFormData(songId)
    });
  } catch (error) {
    console.error(error);

    return res.render("liked-songs/add-liked-song", {
      title: "Add Liked Song",
      user: req.session.user,
      songs: [],
      error: "Something went wrong.",
      formData: buildEmptyLikedSongFormData(songId)
    });
  }
}

// Read the submitted liked song form, validate it, and save the new document.
// If validation fails, show the same form again with the user's typed values.
async function createLikedSong(req, res) {
  const songId = (req.body.songId || "").trim();
  const note = (req.body.note || "").trim();

  const formData = {
    likedSongId: "",
    songId: songId,
    note: note
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);
    const selectedSong = findSongById(songs, songId);

    if (!selectedSong) {
      return res.render("liked-songs/add-liked-song", {
        title: "Add Liked Song",
        user: req.session.user,
        songs: songs,
        error: "Song not found.",
        formData: formData
      });
    }

    if (!note) {
      return res.render("liked-songs/add-liked-song", {
        title: "Add Liked Song",
        user: req.session.user,
        songs: songs,
        error: "All fields are required.",
        formData: formData
      });
    }

    // Check whether this user already saved the same song before.
    // A liked songs list should keep only one saved copy of each song.
    const existingLikedSong = await likedSongModel.getLikedSongByUserAndSong(
      req.session.user.id,
      songId
    );

    if (existingLikedSong) {
      return res.render("liked-songs/add-liked-song", {
        title: "Add Liked Song",
        user: req.session.user,
        songs: songs,
        error: "This song is already in your liked songs list.",
        formData: formData
      });
    }

    await likedSongModel.createLikedSong({
      songId: songId,
      note: note,
      userId: req.session.user.id
    });

    return res.redirect("/liked-songs");
  } catch (error) {
    console.error(error);

    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("liked-songs/add-liked-song", {
      title: "Add Liked Song",
      user: req.session.user,
      songs: songs,
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Load one existing liked song and place its current values into the edit form.
// The song dropdown is also loaded so the user can change the selected song if needed.
async function showEditLikedSongForm(req, res) {
  const likedSongId = (req.query.likedSongId || "").trim();

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    if (!likedSongId) {
      return res.render("liked-songs/edit-liked-song", {
        title: "Edit Liked Song",
        user: req.session.user,
        songs: songs,
        error: "Liked song not found.",
        formData: buildEmptyLikedSongFormData("")
      });
    }

    const likedSong = await likedSongModel.getLikedSongById(likedSongId);

    if (!likedSong || String(likedSong.userId) !== String(req.session.user.id)) {
      return res.render("liked-songs/edit-liked-song", {
        title: "Edit Liked Song",
        user: req.session.user,
        songs: songs,
        error: "Liked song not found.",
        formData: buildEmptyLikedSongFormData("")
      });
    }

    if (!findSongById(songs, String(likedSong.songId))) {
      return res.render("liked-songs/edit-liked-song", {
        title: "Edit Liked Song",
        user: req.session.user,
        songs: songs,
        error: "Liked song not found.",
        formData: buildEmptyLikedSongFormData("")
      });
    }

    return res.render("liked-songs/edit-liked-song", {
      title: "Edit Liked Song",
      user: req.session.user,
      songs: songs,
      error: "",
      formData: {
        likedSongId: likedSong._id,
        songId: String(likedSong.songId),
        note: likedSong.note
      }
    });
  } catch (error) {
    console.error(error);

    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("liked-songs/edit-liked-song", {
      title: "Edit Liked Song",
      user: req.session.user,
      songs: songs,
      error: "Something went wrong.",
      formData: buildEmptyLikedSongFormData("")
    });
  }
}

// Read the edited values from the form, validate them, and update the existing liked song.
// If something is invalid, re-render the same form with the user's typed values.
async function editLikedSong(req, res) {
  const likedSongId = (req.body.likedSongId || "").trim();
  const songId = (req.body.songId || "").trim();
  const note = (req.body.note || "").trim();

  const formData = {
    likedSongId: likedSongId,
    songId: songId,
    note: note
  };

  try {
    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);
    const selectedSong = findSongById(songs, songId);
    const likedSong = await likedSongModel.getLikedSongById(likedSongId);

    if (!likedSong || String(likedSong.userId) !== String(req.session.user.id)) {
      return res.render("liked-songs/edit-liked-song", {
        title: "Edit Liked Song",
        user: req.session.user,
        songs: songs,
        error: "Liked song not found.",
        formData: formData
      });
    }

    if (!selectedSong) {
      return res.render("liked-songs/edit-liked-song", {
        title: "Edit Liked Song",
        user: req.session.user,
        songs: songs,
        error: "Song not found.",
        formData: formData
      });
    }

    if (!note) {
      return res.render("liked-songs/edit-liked-song", {
        title: "Edit Liked Song",
        user: req.session.user,
        songs: songs,
        error: "All fields are required.",
        formData: formData
      });
    }

    // Check whether another liked song record already points to the same song.
    // The current record is allowed to keep its own songId, but duplicates are not allowed.
    const duplicateLikedSong = await likedSongModel.getLikedSongByUserAndSong(
      req.session.user.id,
      songId
    );

    if (duplicateLikedSong && String(duplicateLikedSong._id) !== likedSongId) {
      return res.render("liked-songs/edit-liked-song", {
        title: "Edit Liked Song",
        user: req.session.user,
        songs: songs,
        error: "This song is already in your liked songs list.",
        formData: formData
      });
    }

    await likedSongModel.updateLikedSongById(likedSongId, {
      songId: songId,
      note: note
    });

    return res.redirect("/liked-songs");
  } catch (error) {
    console.error(error);

    const playlists = await loadUserPlaylists(req.session.user.id);
    const songs = await loadUserSongs(playlists);

    return res.render("liked-songs/edit-liked-song", {
      title: "Edit Liked Song",
      user: req.session.user,
      songs: songs,
      error: "Something went wrong.",
      formData: formData
    });
  }
}

// Remove one liked song that belongs to the logged-in user.
// After deleting it, redirect back to the liked songs list page.
async function deleteLikedSong(req, res) {
  const likedSongId = (req.body.likedSongId || "").trim();

  try {
    if (!likedSongId) {
      const likedSongs = await likedSongModel.getAllLikedSongs(req.session.user.id);
      const playlists = await loadUserPlaylists(req.session.user.id);
      const songs = await loadUserSongs(playlists);
      attachSongDetailsToLikedSongs(likedSongs, songs);

      return res.render("liked-songs/liked-song-list", {
        title: "Liked Songs",
        user: req.session.user,
        likedSongs: likedSongs,
        error: "Liked song not found."
      });
    }

    const likedSong = await likedSongModel.getLikedSongById(likedSongId);

    if (!likedSong || String(likedSong.userId) !== String(req.session.user.id)) {
      const likedSongs = await likedSongModel.getAllLikedSongs(req.session.user.id);
      const playlists = await loadUserPlaylists(req.session.user.id);
      const songs = await loadUserSongs(playlists);
      attachSongDetailsToLikedSongs(likedSongs, songs);

      return res.render("liked-songs/liked-song-list", {
        title: "Liked Songs",
        user: req.session.user,
        likedSongs: likedSongs,
        error: "Liked song not found."
      });
    }

    await likedSongModel.deleteLikedSongById(likedSongId);

    return res.redirect("/liked-songs");
  } catch (error) {
    console.error(error);

    return res.render("liked-songs/liked-song-list", {
      title: "Liked Songs",
      user: req.session.user,
      likedSongs: [],
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listLikedSongs: listLikedSongs,
  showAddLikedSongForm: showAddLikedSongForm,
  createLikedSong: createLikedSong,
  showEditLikedSongForm: showEditLikedSongForm,
  editLikedSong: editLikedSong,
  deleteLikedSong: deleteLikedSong
};
