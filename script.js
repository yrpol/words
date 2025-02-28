document.addEventListener("DOMContentLoaded", function () {
  const wordInput = document.getElementById("word-input");
  const searchBtn = document.getElementById("search-btn");
  const resultSection = document.getElementById("result-section");
  const historyList = document.getElementById("history-list");

  // Load search history from localStorage
  let searchHistory =
    JSON.parse(localStorage.getItem("pronunciationHistory")) || [];

  // Display search history
  renderSearchHistory();

  // Event listeners
  searchBtn.addEventListener("click", handleSearch);
  wordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  // Search function
  async function handleSearch() {
    const word = wordInput.value.trim().toLowerCase();

    if (!word) {
      showError("Please enter a word");
      return;
    }

    try {
      resultSection.innerHTML = "<p>Searching...</p>";
      resultSection.classList.add("active");

      const data = await fetchWordData(word);

      if (data) {
        renderWordCard(data);
        addToHistory(word);
      }
    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  }

  // Function to fetch word data from API
  async function fetchWordData(word) {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        showError(`Word "${word}" not found`);
        return null;
      }

      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0]; // Return first result
  }

  // Function to display word card
  function renderWordCard(wordData) {
    let phonetics = wordData.phonetics.filter((p) => p.audio);

    if (phonetics.length === 0) {
      showError(`No pronunciation available for "${wordData.word}"`);
      return;
    }

    resultSection.innerHTML = "";

    const wordCard = document.createElement("div");
    wordCard.className = "word-card";

    const wordHeader = document.createElement("div");
    wordHeader.className = "word-header";

    const wordTitle = document.createElement("div");
    wordTitle.className = "word-title";
    wordTitle.textContent = wordData.word;

    wordHeader.appendChild(wordTitle);
    wordCard.appendChild(wordHeader);

    // Add phonetic transcription if available
    if (wordData.phonetic) {
      const phonetic = document.createElement("div");
      phonetic.textContent = wordData.phonetic;
      wordCard.appendChild(phonetic);
    }

    // Add audio control for each available audio
    phonetics.forEach((phonetic, index) => {
      const audioControl = document.createElement("div");
      audioControl.className = "audio-control";

      const audioLabel = document.createElement("span");
      if (phonetic.text) {
        audioLabel.textContent = phonetic.text;
      } else {
        audioLabel.textContent = `Pronunciation ${index + 1}`;
      }

      const audio = document.createElement("audio");
      audio.src = phonetic.audio;

      const playBtn = document.createElement("button");
      playBtn.className = "audio-btn";
      playBtn.textContent = "Play";
      playBtn.addEventListener("click", () => {
        audio.play();
      });

      const downloadBtn = document.createElement("button");
      downloadBtn.className = "download-btn";
      downloadBtn.textContent = "Download";
      downloadBtn.addEventListener("click", () => {
        downloadAudio(phonetic.audio, `${wordData.word}_pronunciation.mp3`);
      });

      audioControl.appendChild(audioLabel);
      audioControl.appendChild(playBtn);
      audioControl.appendChild(downloadBtn);

      wordCard.appendChild(audioControl);
    });

    // Add definition section
    if (wordData.meanings && wordData.meanings.length > 0) {
      const definitionContainer = document.createElement("div");
      definitionContainer.className = "definition-container";

      const definitionToggle = document.createElement("div");
      definitionToggle.className = "definition-toggle";
      definitionToggle.textContent = "definition";
      definitionToggle.addEventListener("click", () => {
        definitionContent.classList.toggle("show");
        definitionToggle.classList.toggle("active");
      });

      const definitionContent = document.createElement("div");
      definitionContent.className = "definition-content";

      // Loop through word meanings
      wordData.meanings.forEach((meaning) => {
        const meaningBlock = document.createElement("div");
        meaningBlock.className = "meaning-block";

        // Add part of speech
        const partOfSpeech = document.createElement("p");
        partOfSpeech.className = "part-of-speech";
        partOfSpeech.textContent = meaning.partOfSpeech;
        meaningBlock.appendChild(partOfSpeech);

        // Add definitions
        const definitionsList = document.createElement("ul");
        definitionsList.className = "definitions-list";

        meaning.definitions.slice(0, 3).forEach((def) => {
          const definitionItem = document.createElement("li");
          definitionItem.textContent = def.definition;

          // Add example if available
          if (def.example) {
            const exampleText = document.createElement("p");
            exampleText.className = "example-text";
            exampleText.textContent = `Example: "${def.example}"`;
            definitionItem.appendChild(exampleText);
          }

          definitionsList.appendChild(definitionItem);
        });

        meaningBlock.appendChild(definitionsList);
        definitionContent.appendChild(meaningBlock);
      });

      definitionContainer.appendChild(definitionToggle);
      definitionContainer.appendChild(definitionContent);
      wordCard.appendChild(definitionContainer);
    }

    resultSection.appendChild(wordCard);
    resultSection.classList.add("active");
  }

  // Function to download audio
  function downloadAudio(audioUrl, fileName) {
    fetch(audioUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((error) => {
        showError(`Download error: ${error.message}`);
      });
  }

  // Function to display error
  function showError(message) {
    resultSection.innerHTML = `<p class="error-message">${message}</p>`;
    resultSection.classList.add("active");
  }

  // Function to add word to history
  function addToHistory(word) {
    // Remove word from the list if it already exists
    searchHistory = searchHistory.filter((item) => item !== word);

    // Add word to the beginning of the list
    searchHistory.unshift(word);

    // Limit history length to 10 items
    if (searchHistory.length > 10) {
      searchHistory.pop();
    }

    // Save to localStorage
    localStorage.setItem("pronunciationHistory", JSON.stringify(searchHistory));

    // Update history display
    renderSearchHistory();
  }

  // Function to display search history
  function renderSearchHistory() {
    historyList.innerHTML = "";

    searchHistory.forEach((word) => {
      const listItem = document.createElement("li");
      listItem.textContent = word;
      listItem.addEventListener("click", () => {
        wordInput.value = word;
        handleSearch();
      });

      historyList.appendChild(listItem);
    });
  }
});
