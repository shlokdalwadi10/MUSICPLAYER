
const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");
const playlist = document.getElementById("playlist");
const searchInput = document.getElementById("searchInput");

const uploadBtn = document.getElementById("uploadBtn");
const heroUpload = document.getElementById("heroUpload");
const emptyUpload = document.getElementById("emptyUpload");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

const seekBar = document.getElementById("seekBar");
const volumeBar = document.getElementById("volumeBar");

const currentTitle = document.getElementById("currentTitle");
const currentArtist = document.getElementById("currentArtist");
const currentCover = document.getElementById("currentCover");
const currentTime = document.getElementById("currentTime");
const durationDisplay = document.getElementById("duration");
const songCount = document.getElementById("songCount");

let songs = [];
let currentIndex = -1;
let shuffle = false;
let repeat = false;
let renderVersion = 0;

audio.volume = Number(volumeBar.value);

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getSongName(fileName) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
}

function uploadSongs() {
  fileInput.click();
}

uploadBtn.addEventListener("click", uploadSongs);
heroUpload.addEventListener("click", uploadSongs);
emptyUpload.addEventListener("click", uploadSongs);

fileInput.addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);

  files.forEach((file) => {
    const url = URL.createObjectURL(file);

    songs.push({
      id: `${Date.now()}-${Math.random()}`,
      file,
      url,
      title: getSongName(file.name),
      artist: "Local audio file"
    });
  });

  renderPlaylist();
  fileInput.value = "";

  if (currentIndex === -1 && songs.length > 0) {
    loadSong(0, false);
  }
});

function renderPlaylist() {
  const version = ++renderVersion;
  const query = searchInput.value.trim().toLowerCase();

  const filteredSongs = songs
    .map((song, index) => ({ song, index }))
    .filter(({ song }) =>
      song.title.toLowerCase().includes(query)
    );

  songCount.textContent = songs.length;

  if (filteredSongs.length === 0) {
    playlist.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">♫</div>
        <h3>${songs.length ? "No songs found" : "Your library is waiting"}</h3>
        <p>${songs.length ? "Try another search." : "Add music stored on your device to get started."}</p>
        ${songs.length ? "" : '<button class="secondary-btn" id="emptyUploadAgain">Choose Songs</button>'}
      </div>
    `;

    const emptyButton = document.getElementById("emptyUploadAgain");
    if (emptyButton) emptyButton.addEventListener("click", uploadSongs);
    return;
  }

  playlist.innerHTML = filteredSongs.map(({ song, index }) => `
    <div class="track-row ${index === currentIndex ? "selected" : ""}">
      <div class="track-main">
        <span class="track-number">${index + 1}</span>
        <div class="track-thumb">♫</div>
        <div class="track-text">
          <strong title="${escapeHTML(song.title)}">${escapeHTML(song.title)}</strong>
          <span>${escapeHTML(song.artist)}</span>
        </div>
      </div>
      <span class="album-name">Local files</span>
      <span class="track-duration" data-duration-id="${song.id}">--:--</span>
      <button class="row-play" data-play-index="${index}" aria-label="Play ${escapeHTML(song.title)}">
        ${index === currentIndex && !audio.paused ? "Ⅱ" : "▶"}
      </button>
    </div>
  `).join("");

  // Read durations without changing the current song.
  filteredSongs.forEach(({ song }) => {
    const probe = document.createElement("audio");
    probe.preload = "metadata";
    probe.src = song.url;

    probe.addEventListener("loadedmetadata", () => {
      if (version !== renderVersion) return;

      const label = playlist.querySelector(
        `[data-duration-id="${song.id}"]`
      );

      if (label) label.textContent = formatTime(probe.duration);

      probe.removeAttribute("src");
      probe.load();
    }, { once: true });
  });

  playlist.querySelectorAll("[data-play-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.playIndex);

      if (index === currentIndex) {
        togglePlayback();
      } else {
        loadSong(index, true);
      }
    });
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function loadSong(index, autoplay = true) {
  if (index < 0 || index >= songs.length) return;

  currentIndex = index;
  const song = songs[index];

  audio.pause();
  audio.src = song.url;
  audio.load();

  currentTitle.textContent = song.title;
  currentArtist.textContent = song.artist;
  currentCover.textContent = "♫";

  seekBar.value = 0;
  currentTime.textContent = "0:00";
  durationDisplay.textContent = "0:00";
  playBtn.textContent = autoplay ? "Ⅱ" : "▶";
  playBtn.setAttribute("aria-label", autoplay ? "Pause" : "Play");

  renderPlaylist();

  if (autoplay) {
    audio.play().catch((error) => {
      console.warn("Playback could not start:", error);
      playBtn.textContent = "▶";
      playBtn.setAttribute("aria-label", "Play");
    });
  }
}

function togglePlayback() {
  if (currentIndex === -1) {
    if (songs.length > 0) {
      loadSong(0, true);
    } else {
      uploadSongs();
    }
    return;
  }

  if (audio.paused) {
    audio.play().catch((error) => {
      console.warn("Playback could not start:", error);
    });
  } else {
    audio.pause();
  }
}

playBtn.addEventListener("click", togglePlayback);

audio.addEventListener("play", () => {
  playBtn.textContent = "Ⅱ";
  playBtn.setAttribute("aria-label", "Pause");
  renderPlaylist();
});

audio.addEventListener("pause", () => {
  playBtn.textContent = "▶";
  playBtn.setAttribute("aria-label", "Play");
  renderPlaylist();
});

audio.addEventListener("loadedmetadata", () => {
  durationDisplay.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  currentTime.textContent = formatTime(audio.currentTime);

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
  } else {
    seekBar.value = 0;
  }
});

seekBar.addEventListener("input", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
  }
});

volumeBar.addEventListener("input", () => {
  audio.volume = Number(volumeBar.value);
});

function playNext() {
  if (songs.length === 0) return;

  if (shuffle && songs.length > 1) {
    let nextIndex;

    do {
      nextIndex = Math.floor(Math.random() * songs.length);
    } while (nextIndex === currentIndex);

    loadSong(nextIndex, true);
    return;
  }

  if (currentIndex < songs.length - 1) {
    loadSong(currentIndex + 1, true);
  } else if (repeat) {
    loadSong(0, true);
  } else {
    audio.pause();
    audio.currentTime = 0;
  }
}

function playPrevious() {
  if (songs.length === 0) return;

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  const previousIndex =
    currentIndex > 0 ? currentIndex - 1 : songs.length - 1;

  loadSong(previousIndex, true);
}

nextBtn.addEventListener("click", playNext);
prevBtn.addEventListener("click", playPrevious);

audio.addEventListener("ended", () => {
  if (repeat && currentIndex !== -1) {
    audio.currentTime = 0;
    audio.play().catch(console.warn);
  } else {
    playNext();
  }
});

shuffleBtn.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleBtn.classList.toggle("on", shuffle);
  shuffleBtn.setAttribute("aria-pressed", String(shuffle));
});

repeatBtn.addEventListener("click", () => {
  repeat = !repeat;
  repeatBtn.classList.toggle("on", repeat);
  repeatBtn.setAttribute("aria-pressed", String(repeat));
});

searchInput.addEventListener("input", renderPlaylist);

// Initial setup
renderPlaylist();
