const playlistModel = require("../models/playlistModel");
const songModel = require("../models/songModel");

// Show all playlists.
async function listPlaylists(req, res) {
  try {
    // Load every playlist from the database.
    const playlists = await playlistModel.getAllPlaylists();

    // Send the playlists to the list page.
    return res.render("playlist-list", {
      title: "All Playlists",
      playlists: playlists,
      error: ""
    });
  } catch (error) {
    return res.render("playlist-list", {
      title: "All Playlists",
      playlists: [],
      error: "Something went wrong."
    });
  }
}

// Show the add playlist page.
function showAddPlaylistForm(req, res) {
  // Show an empty form when the page first loads.
  return res.render("add-playlist", {
    title: "Add Playlist",
    error: "",
    formData: {
      name: "",
      description: "",
      genre: ""
    }
  });
}

// Save a new playlist.
async function createPlaylist(req, res) {
  // Read the form values and remove extra spaces.
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const genre = (req.body.genre || "").trim();

  try {
    // Stop and show the form again if any required field is missing.
    if (!name || !description || !genre) {
      return res.render("add-playlist", {
        title: "Add Playlist",
        error: "All fields are required.",
        formData: {
          name: name,
          description: description,
          genre: genre
        }
      });
    }

    // Save the new playlist in MongoDB.
    const playlist = await playlistModel.createPlaylist({
      name: name,
      description: description,
      genre: genre
    });

    // Open the new playlist page after saving.
    return res.redirect("/playlists/" + playlist._id);
  } catch (error) {
    // Show a simple error message if the save fails.
    return res.render("add-playlist", {
      title: "Add Playlist",
      error: "Something went wrong.",
      formData: {
        name: name,
        description: description,
        genre: genre
      }
    });
  }
}

// Show one playlist with its songs.
async function showPlaylist(req, res) {
  try {
    // Find the playlist using the ID from the route.
    const playlist = await playlistModel.getPlaylistById(req.params.id);
    let songs = [];

    // Only load songs if the playlist exists.
    if (playlist) {
      songs = await songModel.getSongsByPlaylistId(req.params.id);
    }

    // Show a message if the playlist cannot be found.
    if (!playlist) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        playlist: null,
        songs: songs,
        error: "Playlist not found."
      });
    }

    // Show the playlist together with all songs inside it.
    return res.render("playlist-detail", {
      title: playlist.name,
      playlist: playlist,
      songs: songs,
      error: ""
    });
  } catch (error) {
    return res.render("playlist-detail", {
      title: "Playlist Details",
      playlist: null,
      songs: [],
      error: "Something went wrong."
    });
  }
}

// Show the add song page.
async function showAddSongForm(req, res) {
  try {
    // Find the playlist first so the form knows where to add the song.
    const playlist = await playlistModel.getPlaylistById(req.params.id);

    // Show an error if the playlist does not exist.
    if (!playlist) {
      return res.render("add-song", {
        title: "Add Song",
        playlist: null,
        error: "Playlist not found.",
        formData: {
          title: "",
          artist: "",
          album: "",
          rating: "",
          review: ""
        }
      });
    }

    // Show an empty song form for the selected playlist.
    return res.render("add-song", {
      title: "Add Song",
      playlist: playlist,
      error: "",
      formData: {
        title: "",
        artist: "",
        album: "",
        rating: "",
        review: ""
      }
    });
  } catch (error) {
    return res.render("add-song", {
      title: "Add Song",
      playlist: null,
      error: "Something went wrong.",
      formData: {
        title: "",
        artist: "",
        album: "",
        rating: "",
        review: ""
      }
    });
  }
}

// Save a new song.
async function createSong(req, res) {
  // Read the form values and remove extra spaces.
  const title = (req.body.title || "").trim();
  const artist = (req.body.artist || "").trim();
  const album = (req.body.album || "").trim();
  const rating = (req.body.rating || "").trim();
  const review = (req.body.review || "").trim();

  let playlist = null;

  try {
    // Make sure the playlist exists before adding a song to it.
    playlist = await playlistModel.getPlaylistById(req.params.id);

    if (!playlist) {
      return res.render("add-song", {
        title: "Add Song",
        playlist: null,
        error: "Playlist not found.",
        formData: {
          title: title,
          artist: artist,
          album: album,
          rating: rating,
          review: review
        }
      });
    }

    // Title, artist, and album are required for every song.
    if (!title || !artist || !album) {
      return res.render("add-song", {
        title: "Add Song",
        playlist: playlist,
        error: "Title, artist, and album are required.",
        formData: {
          title: title,
          artist: artist,
          album: album,
          rating: rating,
          review: review
        }
      });
    }

    // If the user entered a rating, it must stay between 1 and 5.
    if (rating) {
      const ratingNumber = Number(rating);

      if (
        Number.isNaN(ratingNumber) ||
        ratingNumber < 1 ||
        ratingNumber > 5
      ) {
        return res.render("add-song", {
          title: "Add Song",
          playlist: playlist,
          error: "Rating must be a number from 1 to 5.",
          formData: {
            title: title,
            artist: artist,
            album: album,
            rating: rating,
            review: review
          }
        });
      }
    }

    // Build the song data that will be saved.
    const songData = {
      title: title,
      artist: artist,
      album: album,
      playlistId: req.params.id
    };

    // Only save rating if the user entered one.
    if (rating) {
      songData.rating = Number(rating);
    }

    // Only save review if the user entered one.
    if (review) {
      songData.review = review;
    }

    // Save the song in MongoDB.
    await songModel.createSong(songData);

    // Go back to the playlist page after saving.
    return res.redirect("/playlists/" + req.params.id);
  } catch (error) {
    // Show the form again with the user's previous input.
    return res.render("add-song", {
      title: "Add Song",
      playlist: playlist,
      error: "Something went wrong.",
      formData: {
        title: title,
        artist: artist,
        album: album,
        rating: rating,
        review: review
      }
    });
  }
}

// Delete one playlist and its songs.
async function deletePlaylist(req, res) {
  try {
    // Check whether the playlist exists first.
    const playlist = await playlistModel.getPlaylistById(req.params.id);

    // If not found, return to the list page with an error.
    if (!playlist) {
      const playlists = await playlistModel.getAllPlaylists();

      return res.render("playlist-list", {
        title: "All Playlists",
        playlists: playlists,
        error: "Playlist not found."
      });
    }

    // Load all songs that belong to this playlist.
    const songs = await songModel.getSongsByPlaylistId(req.params.id);

    // Delete each song before deleting the playlist itself.
    for (const song of songs) {
      await songModel.deleteSongById(song._id);
    }

    // Delete the playlist after its songs are removed.
    await playlistModel.deletePlaylistById(req.params.id);

    // Return to the playlist list page.
    return res.redirect("/playlists");
  } catch (error) {
    let playlists = [];

    try {
      // Try to reload the playlist list for the error page.
      playlists = await playlistModel.getAllPlaylists();
    } catch (innerError) {
      // Keep an empty list if loading fails again.
      playlists = [];
    }

    return res.render("playlist-list", {
      title: "All Playlists",
      playlists: playlists,
      error: "Something went wrong."
    });
  }
}

// Delete one song from a playlist.
async function deleteSong(req, res) {
  let playlist = null;
  let songs = [];

  try {
    // Check whether the parent playlist exists.
    playlist = await playlistModel.getPlaylistById(req.params.id);

    if (!playlist) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        playlist: null,
        songs: [],
        error: "Playlist not found."
      });
    }

    // Load the song directly using its ID.
    const song = await songModel.getSongById(req.params.songId);

    // Make sure the song exists and belongs to this playlist.
    if (!song || String(song.playlistId) !== req.params.id) {
      songs = await songModel.getSongsByPlaylistId(req.params.id);

      return res.render("playlist-detail", {
        title: playlist.name,
        playlist: playlist,
        songs: songs,
        error: "Song not found."
      });
    }

    // Delete the selected song.
    await songModel.deleteSongById(req.params.songId);

    // Return to the playlist details page.
    return res.redirect("/playlists/" + req.params.id);
  } catch (error) {
    // Show the same page again if something fails during deletion.
    return res.render("playlist-detail", {
      title: playlist ? playlist.name : "Playlist Details",
      playlist: playlist,
      songs: songs,
      error: "Something went wrong."
    });
  }
}

module.exports = {
  listPlaylists: listPlaylists,
  showAddPlaylistForm: showAddPlaylistForm,
  createPlaylist: createPlaylist,
  showPlaylist: showPlaylist,
  showAddSongForm: showAddSongForm,
  createSong: createSong,
  deletePlaylist: deletePlaylist,
  deleteSong: deleteSong
};
