const playlistModel = require("../models/playlistModel");
const songModel = require("../models/songModel");

// Define the genres.
const genres = ["Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Lo-fi", "R&B"]

// Show all playlists.
async function listPlaylists(req, res) {
  try {
    // Load every playlist from the database for that user.
    const playlists = await playlistModel.getAllPlaylists(req.session.user.id);

    // Send the playlists to the list page.
    return res.render("playlist-list", {
      title: "All Playlists",
      // include user so that the header will be visible
      user: req.session.user, 
      playlists: playlists,
      error: ""
    });
  } catch (error) {
    console.error(error);
    return res.render("playlist-list", {
      title: "All Playlists",
      user: req.session.user, 
      // If there is an error in the playlists, send an empty array
      playlists: [],
      // error message will be "Something went wrong"
      error: "Something went wrong."
    });
  }
}

// Show the add playlist page.
function showAddPlaylistForm(req, res) {
  // Show an empty form when the page first loads.
  return res.render("add-playlist", {
    title: "Add Playlist",
    user: req.session.user, 
    error: "",
    genres: genres, // Pass the list to the view
    formData: {
      name: "",
      description: "",
      genre: ""
    }
  });
}

// Save a new playlist.
async function createPlaylist(req, res) {
  // Read the form values and remove extra spaces - so its either the form value or just the empty string 
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const genre = (req.body.genre || "").trim();

  try {
    // Stop and show the form again if any required field is missing.
    if (!name || !description || !genre) {
      return res.render("add-playlist", {
        title: "Add Playlist",
        user: req.session.user, 
        error: "All fields are required.",
        genres: genres, // Pass the list here too
        // Template for the formData
        formData: {
          name: name,
          description: description,
          genre: genre
        }
      });
    }

    // Save the new playlist in MongoDB if we reach this stage then it will be able to add to creating the platlist
    // Include the logged-in user's ID
    const playlist = await playlistModel.createPlaylist({
      name: name,
      description: description,
      genre: genre,
      userId: req.session.user.id
    });

    // Open the new playlist page after saving, this follows a get request which we will extract later on
    return res.redirect("/playlists/view?id=" + playlist._id);
  } catch (error) {
    console.error(error);
    return res.render("add-playlist", {
      title: "Add Playlist",
      user: req.session.user, 
      error: "Something went wrong.",
      genres: genres,
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
  const playlistId = (req.query.id || "").trim();

  try {
    // Make sure an ID was passed through the query string.
    if (!playlistId) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        user: req.session.user, 
        playlist: null,
        songs: [],
        error: "Playlist not found."
      });
    }

    // Find the playlist using the ID from the URL query.
    const playlist = await playlistModel.getPlaylistById(playlistId);
    let songs = [];

    // Only load songs if the playlist exists.
    if (playlist) {
      songs = await songModel.getSongsByPlaylistId(playlistId);
    }

    // Show a message if the playlist cannot be found.
    if (!playlist) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        user: req.session.user, 
        playlist: null,
        songs: songs,
        error: "Playlist not found."
      });
    }

    // Show the playlist together with all songs inside it.
    return res.render("playlist-detail", {
      title: playlist.name,
      user: req.session.user, 
      playlist: playlist,
      songs: songs,
      error: ""
    });
  } catch (error) {
    console.error(error);
    return res.render("playlist-detail", {
      title: "Playlist Details",
      user: req.session.user, 
      playlist: null,
      songs: [],
      error: "Something went wrong."
    });
  }
}

// Show the add song page.
async function showAddSongForm(req, res) {
  const playlistId = (req.query.id || "").trim();

  try {
    // Make sure an ID was passed through the query string.
    if (!playlistId) {
      return res.render("add-song", {
        title: "Add Song",
        user: req.session.user,
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

    // Find the playlist first so the form knows where to add the song.
    const playlist = await playlistModel.getPlaylistById(playlistId);

    // Show an error if the playlist does not exist.
    if (!playlist) {
      return res.render("add-song", {
        title: "Add Song",
        user: req.session.user,
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

    // If we reach here that means that the playlist does exist 
    // Show an empty song form for the selected playlist.
    return res.render("add-song", {
      title: "Add Song",
      user: req.session.user,
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
    console.error(error);
    return res.render("add-song", {
      title: "Add Song",
      user: req.session.user,
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
  const playlistId = (req.body.playlistId || "").trim();
  const title = (req.body.title || "").trim();
  const artist = (req.body.artist || "").trim();
  const album = (req.body.album || "").trim();
  const rating = (req.body.rating || "").trim();
  const review = (req.body.review || "").trim();

  let playlist = null;

  try {
    // Make sure the playlist exists before adding a song to it.
    if (!playlistId) {
      return res.render("add-song", {
        title: "Add Song",
        user: req.session.user,
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

    playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist) {
      return res.render("add-song", {
        title: "Add Song",
        user: req.session.user,
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
        user: req.session.user,
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

      if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
        return res.render("add-song", {
          title: "Add Song",
          user: req.session.user,
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

    // Placeholder to build the song data that will be saved.
    const songData = {
      title: title,
      artist: artist,
      album: album,
      playlistId: playlistId
    };

    // Only save rating if the user entered a rating.
    if (rating) {
      songData.rating = Number(rating);
    }

    // Only save review if the user entered one.
    if (review) {
      songData.review = review;
    }

    // Save the song in MongoDB.
    await songModel.createSong(songData);

    // Go back to the playlist page after saving, making it in the URL which can then be retrieve later on
    return res.redirect("/playlists/view?id=" + playlistId);
  } catch (error) {
    console.error(error);
    return res.render("add-song", {
      title: "Add Song",
      user: req.session.user,
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

// Turn a date into a string that works with datetime-local input fields
function formatDateTimeLocal(date) {
  const d = new Date(date);

  // Add a leading zero to any number that is only one digit long
  function pad(num) {
    return String(num).padStart(2, "0");
  }

  // Return the date and time as YYYY-MM-DDTHH:MM:SS so the input field can read it
  return d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + "T" +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds());
}

// Show the edit playlist page with the current playlist details already filled in
async function showEditPlaylist(req, res) {
  const playlistId = (req.query.playlistId || "").trim();

  try {
    // Show an error if no playlist ID was given in the URL
    if (!playlistId) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        error: "Playlist not found.",
        genres: genres,
        formData: {
          playlistId: "",
          name: "",
          description: "",
          genre: "",
          createdAt: ""
        }
      });
    }

    // Look up the playlist using the ID from the URL
    const playlist = await playlistModel.getPlaylistById(playlistId);

    // Show an error if the playlist does not exist in the database
    if (!playlist) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        error: "Playlist not found.",
        genres: genres,
        formData: {
          playlistId: "",
          name: "",
          description: "",
          genre: "",
          createdAt: ""
        }
      });
    }

    // Open the edit form with the playlist's existing values pre-filled
    return res.render("edit-playlist", {
      title: "Edit Playlist",
      error: "",
      genres: genres,
      formData: {
        playlistId: playlist._id,
        name: playlist.name,
        description: playlist.description,
        genre: playlist.genre,
        // Format the date so the datetime-local input field can display it correctly
        createdAt: formatDateTimeLocal(playlist.createdAt)
      }
    });
  } catch (error) {
    console.error(error);
    return res.render("edit-playlist", {
      title: "Edit Playlist",
      error: "Something went wrong.",
      genres: genres,
      formData: {
        playlistId: "",
        name: "",
        description: "",
        genre: "",
        createdAt: ""
      }
    });
  }
}

// Save the changes made to an existing playlist.
async function editPlaylist(req, res) {
  // Read the updated values from the form and remove extra spaces
  const playlistId = (req.body.playlistId || "").trim();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const genre = (req.body.genre || "").trim();
  const createdAt = (req.body.createdAt || "").trim();

   // Bundle the form values together so they can be sent back easily if there is an error
  const formData = {
    playlistId: playlistId,
    name: name,
    description: description,
    genre: genre,
    createdAt: createdAt
  };

  try {
    if (!playlistId) {
      // Show an error if no playlist ID was included in the form
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        error: "Playlist not found.",
        genres: genres,
        formData: formData
      });
    }

    // Stop and show the form again if any required field is missing
    if (!name || !description || !genre || !createdAt) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        error: "All fields are required.",
        genres: genres,
        formData: formData
      });
    }

    // Convert the date string from the form into a proper Date object
    const createdDate = new Date(createdAt);

    // Show an error if the date string could not be turned into a valid date
    if (Number.isNaN(createdDate.getTime())) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        error: "Created date is invalid.",
        genres: genres,
        formData: formData
      });
    }

    // Save the updated playlist details to the database
    const updatedPlaylist = await playlistModel.updatePlaylistById(playlistId, {
      name: name,
      description: description,
      genre: genre,
      createdAt: createdDate
    });

    // Show an error if the playlist could not be found during the update
    if (!updatedPlaylist) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        error: "Playlist not found.",
        genres: genres,
        formData: formData
      });
    }

    // Go back to the playlist page once the changes have been saved
    return res.redirect("/playlists/view?id=" + playlistId);
  } catch (error) {
    console.error(error);
    return res.render("edit-playlist", {
      title: "Edit Playlist",
      error: "Something went wrong.",
      genres: genres,
      formData: formData
    });
  }
}

// Delete one playlist and its songs.
async function deletePlaylist(req, res) {
  const playlistId = (req.body.playlistId || "").trim();

  try {
    // Check whether the playlist exists first.
    if (!playlistId) {
      const playlists = await playlistModel.getAllPlaylists();

      return res.render("playlist-list", {
        title: "All Playlists",
        user: req.session.user,
        playlists: playlists,
        error: "Playlist not found."
      });
    }

    const playlist = await playlistModel.getPlaylistById(playlistId);

    // If not found, return to the list page with an error.
    if (!playlist) {
      const playlists = await playlistModel.getAllPlaylists();

      return res.render("playlist-list", {
        title: "All Playlists",
        user: req.session.user,
        playlists: playlists,
        error: "Playlist not found."
      });
    }

    // Load all songs that belong to this playlist.
    const songs = await songModel.getSongsByPlaylistId(playlistId);

    // Delete each song before deleting the playlist itself, the user will not see this
    // This will be done on the backend
    for (const song of songs) {
      await songModel.deleteSongById(song._id);
    }

    // Delete the playlist after its songs are removed.
    await playlistModel.deletePlaylistById(playlistId);

    // Return to the playlist list page.
    return res.redirect("/playlists");
  } catch (error) {
    console.error(error);
    return res.render("playlist-list", {
      title: "All Playlists",
      user: req.session.user,
      playlists: [],
      error: "Something went wrong."
    });
  }
}

// Delete one song from a playlist.
async function deleteSong(req, res) {
  const playlistId = (req.body.playlistId || "").trim();
  const songId = (req.body.songId || "").trim();
  let playlist = null;
  let songs = [];

  try {
    // Check whether the parent playlist exists.
    if (!playlistId || !songId) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        user: req.session.user,
        playlist: null,
        songs: [],
        error: "Song not found."
      });
    }

    playlist = await playlistModel.getPlaylistById(playlistId);

    if (!playlist) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        user: req.session.user,
        playlist: null,
        songs: [],
        error: "Playlist not found."
      });
    }

    // Load the song directly using its ID.
    const song = await songModel.getSongById(songId);

    // Make sure the song exists and belongs to this playlist.
    if (!song || String(song.playlistId) !== playlistId) {
      songs = await songModel.getSongsByPlaylistId(playlistId);

      return res.render("playlist-detail", {
        title: playlist.name,
        user: req.session.user,
        playlist: playlist,
        songs: songs,
        error: "Song not found."
      });
    }

    // Delete the selected song.
    await songModel.deleteSongById(songId);

    // Return to the playlist details page.
    return res.redirect("/playlists/view?id=" + playlistId);
  } catch (error) {
    console.error(error);
    return res.render("playlist-detail", {
      title: playlist ? playlist.name : "Playlist Details",
      user: req.session.user,
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
  deleteSong: deleteSong,
  showEditPlaylist: showEditPlaylist,
  editPlaylist: editPlaylist
};
