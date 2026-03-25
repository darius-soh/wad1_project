const playlistModel = require("../models/playlistModel");
const songModel = require("../models/songModel");
const genreModel = require("../models/genreModel");
const reviewModel = require("../models/reviewModel");
const tagModel = require("../models/tagModel");

// Default genres to show before the user creates custom genres.
// These act as starter values even if the user has not created any genre documents yet.
const defaultGenres = ["Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Lo-fi", "R&B"];

// Build the list of genre names for playlist forms and filters.
// This merges the built-in default genres with any custom genres created by the user.
async function loadGenreNames(userId, extraGenre) {
  const savedGenres = await genreModel.getAllGenres(userId);
  const genreNames = [];

  // Add all default genres first.
  // These are always available even if the Genre collection is empty.
  for (const genreName of defaultGenres) {
    genreNames.push(genreName);
  }

  // Add custom genres only if the name is not already inside the list.
  // This avoids duplicate options appearing in the playlist dropdown.
  for (const genre of savedGenres) {
    let exists = false;

    for (const existingGenreName of genreNames) {
      if (existingGenreName === genre.name) {
        exists = true;
      }
    }

    if (!exists) {
      genreNames.push(genre.name);
    }
  }

  // Add the current playlist genre too if it is not already in the list.
  // This helps the edit form show the saved value even if it is not in the defaults.
  if (extraGenre) {
    let exists = false;

    for (const existingGenreName of genreNames) {
      if (existingGenreName === extraGenre) {
        exists = true;
      }
    }

    if (!exists) {
      genreNames.push(extraGenre);
    }
  }

  return genreNames;
}

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
// The controller can also filter by genre and sort the list before rendering the page.
async function listPlaylists(req, res) {
  // Read filter and sort choices from the URL query string.
  const selectedGenre = (req.query.genre || "").trim();
  const sortType = (req.query.sortType || "").trim();

  try {
    // Load every playlist from the database for that user.
    let playlists = await playlistModel.getAllPlaylists(req.session.user.id);
    const genres = await loadGenreNames(req.session.user.id, selectedGenre);

    // If a genre was selected, only keep playlists from that genre.
    if (selectedGenre) {
      playlists = playlists.filter(function (playlist) {
        return playlist.genre === selectedGenre;
      });
    }

    // Sort the playlists only when the user selected a sort type.
    sortPlaylists(playlists, sortType);

    // Send the playlists to the list page.
    return res.render("playlist-list", {
      title: "All Playlists",
      user: req.session.user,
      playlists: playlists,
      genres: genres,
      selectedGenre: selectedGenre,
      sortType: sortType,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("playlist-list", {
      title: "All Playlists",
      user: req.session.user,
      playlists: [],
      genres: defaultGenres,
      selectedGenre: selectedGenre,
      sortType: sortType,
      error: "Something went wrong."
    });
  }
}

// Show the add playlist page.
// We load the available genre names so the form can show them in a dropdown.
async function showAddPlaylistForm(req, res) {
  try {
    const genres = await loadGenreNames(req.session.user.id, "");

    // Show an empty form when the page first loads.
    return res.render("add-playlist", {
      title: "Add Playlist",
      user: req.session.user,
      error: "",
      genres: genres,
      formData: {
        name: "",
        description: "",
        genre: ""
      }
    });
  } catch (error) {
    console.error(error);

    return res.render("add-playlist", {
      title: "Add Playlist",
      user: req.session.user,
      error: "Something went wrong.",
      genres: defaultGenres,
      formData: {
        name: "",
        description: "",
        genre: ""
      }
    });
  }
}

// Read the submitted playlist form, validate it, and save the new playlist.
// If validation fails, re-render the same form with the user's typed values.
async function createPlaylist(req, res) {
  // Read the form values and remove extra spaces.
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const genre = (req.body.genre || "").trim();

  try {
    const genres = await loadGenreNames(req.session.user.id, genre);

    // Stop and show the form again if any required field is missing.
    // This avoids saving incomplete playlist documents in MongoDB.
    if (!name || !description || !genre) {
      return res.render("add-playlist", {
        title: "Add Playlist",
        user: req.session.user,
        error: "All fields are required.",
        genres: genres,
        formData: {
          name: name,
          description: description,
          genre: genre
        }
      });
    }

    // Build the playlist object that will be saved into MongoDB.
    // userId links the playlist back to the currently logged-in user.
    const playlistData = {
      name: name,
      description: description,
      genre: genre,
      userId: req.session.user.id
    };

    // Save the new playlist in MongoDB.
    const playlist = await playlistModel.createPlaylist(playlistData);

    // Open the new playlist page after saving.
    return res.redirect("/playlists/view?id=" + playlist._id);
  } catch (error) {
    console.error(error);

    let genres = defaultGenres;

    try {
      genres = await loadGenreNames(req.session.user.id, genre);
    } catch (genreError) {
      console.error(genreError);
    }

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

// Show one playlist together with the songs that belong to it.
// The controller also checks ownership so one user cannot open another user's playlist.
async function showPlaylist(req, res) {
  // playlistId identifies which playlist to load.
  // searchTerm is optional and is used to filter song titles on this page.
  const playlistId = (req.query.id || "").trim();
  const searchTerm = (req.query.search || "").trim();

  try {
    // Make sure an ID was passed through the query string.
    if (!playlistId) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        user: req.session.user,
        playlist: null,
        songs: [],
        searchTerm: searchTerm,
        error: "Playlist not found."
      });
    }

    // Find the playlist using the ID from the URL query.
    const playlist = await playlistModel.getPlaylistById(playlistId);

    // Stop if the playlist does not exist or does not belong to this user.
    if (!playlist || String(playlist.userId) !== String(req.session.user.id)) {
      return res.render("playlist-detail", {
        title: "Playlist Details",
        user: req.session.user,
        playlist: null,
        songs: [],
        searchTerm: searchTerm,
        error: "Playlist not found."
      });
    }

    // Load all songs that belong to this playlist.
    // The song model finds them by matching playlistId in MongoDB.
    let songs = await songModel.getSongsByPlaylistId(playlistId);

    // Filter songs if the user searched for a title.
    // This is only done in memory after the songs are loaded.
    if (searchTerm) {
      const loweredSearchTerm = searchTerm.toLowerCase();

      songs = songs.filter(function (song) {
        return song.title.toLowerCase().includes(loweredSearchTerm);
      });
    }

    // Show the playlist together with all songs inside it.
    return res.render("playlist-detail", {
      title: playlist.name,
      user: req.session.user,
      playlist: playlist,
      songs: songs,
      searchTerm: searchTerm,
      error: ""
    });
  } catch (error) {
    console.error(error);

    return res.render("playlist-detail", {
      title: "Playlist Details",
      user: req.session.user,
      playlist: null,
      songs: [],
      searchTerm: searchTerm,
      error: "Something went wrong."
    });
  }
}

// Turn a date into a string that works with datetime-local input fields.
// HTML datetime-local inputs expect a text value in YYYY-MM-DDTHH:MM:SS format.
function formatDateTimeLocal(date) {
  const d = new Date(date);

  // Add a leading zero to any number that is only one digit long.
  function pad(num) {
    return String(num).padStart(2, "0");
  }

  // Return the date and time as YYYY-MM-DDTHH:MM:SS so the input field can read it.
  return d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + "T" +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds());
}

// Load one existing playlist and place its current values into the edit form.
// The controller also prepares the genre dropdown so the saved genre can be shown again.
async function showEditPlaylist(req, res) {
  const playlistId = (req.query.playlistId || "").trim();

  try {
    const genres = await loadGenreNames(req.session.user.id, "");

    // Show an error if no playlist ID was given in the URL.
    if (!playlistId) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
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

    // Look up the playlist using the ID from the URL.
    const playlist = await playlistModel.getPlaylistById(playlistId);

    // Show an error if the playlist does not exist in the database.
    if (!playlist || String(playlist.userId) !== String(req.session.user.id)) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
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

    // Open the edit form with the playlist's existing values pre-filled.
    return res.render("edit-playlist", {
      title: "Edit Playlist",
      user: req.session.user,
      error: "",
      genres: await loadGenreNames(req.session.user.id, playlist.genre),
      formData: {
        playlistId: playlist._id,
        name: playlist.name,
        description: playlist.description,
        genre: playlist.genre,
        createdAt: formatDateTimeLocal(playlist.createdAt)
      }
    });
  } catch (error) {
    console.error(error);

    return res.render("edit-playlist", {
      title: "Edit Playlist",
      user: req.session.user,
      error: "Something went wrong.",
      genres: defaultGenres,
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

// Read the edited playlist form, validate it, and update the saved playlist document.
// If anything is invalid, re-render the same page with the submitted values still filled in.
async function editPlaylist(req, res) {
  // Read the updated values from the form and remove extra spaces.
  const playlistId = (req.body.playlistId || "").trim();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const genre = (req.body.genre || "").trim();
  const createdAt = (req.body.createdAt || "").trim();

  // Bundle the form values together so they can be sent back easily if there is an error.
  const formData = {
    playlistId: playlistId,
    name: name,
    description: description,
    genre: genre,
    createdAt: createdAt
  };

  try {
    const genres = await loadGenreNames(req.session.user.id, genre);

    // Show an error if no playlist ID was included in the form.
    if (!playlistId) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "Playlist not found.",
        genres: genres,
        formData: formData
      });
    }

    // Check that the playlist belongs to the current user.
    // This stops one user from editing another user's playlist.
    const existingPlaylist = await playlistModel.getPlaylistById(playlistId);

    if (!existingPlaylist || String(existingPlaylist.userId) !== String(req.session.user.id)) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "Playlist not found.",
        genres: genres,
        formData: formData
      });
    }

    // Stop and show the form again if any required field is missing.
    if (!name || !description || !genre || !createdAt) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "All fields are required.",
        genres: genres,
        formData: formData
      });
    }

    // Convert the date string from the form into a proper Date object.
    // MongoDB stores createdAt as a real date, not as plain text.
    const createdDate = new Date(createdAt);

    // Show an error if the date string could not be turned into a valid date.
    if (Number.isNaN(createdDate.getTime())) {
      return res.render("edit-playlist", {
        title: "Edit Playlist",
        user: req.session.user,
        error: "Created date is invalid.",
        genres: genres,
        formData: formData
      });
    }

    // Build the object containing the new playlist values.
    // This object is passed to the model's update function.
    const updatedData = {
      name: name,
      description: description,
      genre: genre,
      createdAt: createdDate
    };

    // Save the updated playlist details to the database.
    await playlistModel.updatePlaylistById(playlistId, updatedData);

    // Go back to the playlist page once the changes have been saved.
    return res.redirect("/playlists/view?id=" + playlistId);
  } catch (error) {
    console.error(error);

    let genres = defaultGenres;

    try {
      genres = await loadGenreNames(req.session.user.id, genre);
    } catch (genreError) {
      console.error(genreError);
    }

    return res.render("edit-playlist", {
      title: "Edit Playlist",
      user: req.session.user,
      error: "Something went wrong.",
      genres: genres,
      formData: formData
    });
  }
}

// Delete one playlist and the related child data connected to it.
// This includes songs, reviews linked to those songs, and tags linked to the playlist.
async function deletePlaylist(req, res) {
  const playlistId = (req.body.playlistId || "").trim();

  try {
    // Check whether the playlist exists first.
    if (!playlistId) {
      const playlists = await playlistModel.getAllPlaylists(req.session.user.id);

      return res.render("playlist-list", {
        title: "All Playlists",
        user: req.session.user,
        playlists: playlists,
        genres: await loadGenreNames(req.session.user.id, ""),
        selectedGenre: "",
        sortType: "",
        error: "Playlist not found."
      });
    }

    const playlist = await playlistModel.getPlaylistById(playlistId);

    // If not found, return to the list page with an error.
    if (!playlist || String(playlist.userId) !== String(req.session.user.id)) {
      const playlists = await playlistModel.getAllPlaylists(req.session.user.id);

      return res.render("playlist-list", {
        title: "All Playlists",
        user: req.session.user,
        playlists: playlists,
        genres: await loadGenreNames(req.session.user.id, ""),
        selectedGenre: "",
        sortType: "",
        error: "Playlist not found."
      });
    }

    // Load all songs that belong to this playlist.
    // We need them first so we can remove their reviews before deleting the songs.
    const songs = await songModel.getSongsByPlaylistId(playlistId);

    // Delete all reviews that belong to each song.
    // review.songId points to song._id, so we remove those linked review documents first.
    for (const song of songs) {
      await reviewModel.deleteReviewsBySongId(song._id);
      await songModel.deleteSongById(song._id);
    }

    // Delete all tags that belong to this playlist.
    // tag.playlistId points to playlist._id, so these tags should not remain after playlist deletion.
    await tagModel.deleteTagsByPlaylistId(playlistId);

    // Delete the playlist after its songs are removed.
    await playlistModel.deletePlaylistById(playlistId);

    // Return to the playlist list page.
    return res.redirect("/playlists");
  } catch (error) {
    console.error(error);

    let genres = defaultGenres;

    try {
      genres = await loadGenreNames(req.session.user.id, "");
    } catch (genreError) {
      console.error(genreError);
    }

    return res.render("playlist-list", {
      title: "All Playlists",
      user: req.session.user,
      playlists: [],
      genres: genres,
      selectedGenre: "",
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
