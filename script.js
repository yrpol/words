document.addEventListener("DOMContentLoaded", function () {
  const wordInput = document.getElementById("word-input");
  const searchBtn = document.getElementById("search-btn");
  const resultSection = document.getElementById("result-section");
  const historyList = document.getElementById("history-list");

  // Завантаження історії пошуку з localStorage
  let searchHistory =
    JSON.parse(localStorage.getItem("pronunciationHistory")) || [];

  // Відображення історії пошуку
  renderSearchHistory();

  // Слухачі подій
  searchBtn.addEventListener("click", handleSearch);
  wordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  // Функція пошуку вимови
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

  // Функція для отримання даних про слово з API
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
    return data[0]; // Повертаємо перший результат
  }

  // Функція для відображення картки слова
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

    // Додаємо транскрипцію, якщо вона є
    if (wordData.phonetic) {
      const phonetic = document.createElement("div");
      phonetic.textContent = wordData.phonetic;
      wordCard.appendChild(phonetic);
    }

    // Додаємо аудіо контрол для кожного доступного аудіо
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

    resultSection.appendChild(wordCard);
    resultSection.classList.add("active");
  }

  // Функція для завантаження аудіо
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

  // Функція для відображення помилки
  function showError(message) {
    resultSection.innerHTML = `<p class="error-message">${message}</p>`;
    resultSection.classList.add("active");
  }

  // Функція для додавання слова в історію
  function addToHistory(word) {
    // Видаляємо слово зі списку, якщо воно вже є
    searchHistory = searchHistory.filter((item) => item !== word);

    // Додаємо слово на початок списку
    searchHistory.unshift(word);

    // Обмежуємо довжину історії до 10 елементів
    if (searchHistory.length > 10) {
      searchHistory.pop();
    }

    // Зберігаємо в localStorage
    localStorage.setItem("pronunciationHistory", JSON.stringify(searchHistory));

    // Оновлюємо відображення історії
    renderSearchHistory();
  }

  // Функція для відображення історії пошуку
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
