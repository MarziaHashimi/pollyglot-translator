// Cloudflare Worker URL
const WORKER_URL = "https://translator-worker-marzia.marziajan130.workers.dev";

const translateBtn = document.getElementById("translate-btn");
const loadingEl = document.getElementById("loading");
const inputSection = document.getElementById("input-section");
const resultsSection = document.getElementById("results-section");
const originalTextEl = document.getElementById("original-text");
const translatedTextEl = document.getElementById("translated-text");
const startOverBtn = document.getElementById("start-over-btn");

function showLoading(show = true) {
  if (show) {
    loadingEl.classList.remove("hidden");
    translateBtn.disabled = true;
    translateBtn.style.opacity = "0.7";
  } else {
    loadingEl.classList.add("hidden");
    translateBtn.disabled = false;
    translateBtn.style.opacity = "1";
  }
}

translateBtn.addEventListener("click", async () => {
  const text = document.getElementById("text-input").value.trim();
  const languageEl = document.querySelector("input[name='language']:checked");

  if (!text || !languageEl) {
    alert("Please enter text and select a language!");
    return;
  }

  const language = languageEl.value;

  showLoading(true);

  try {
    // Send translation request to the Cloudflare Worker
    const resp = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language })
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw new Error(`Server returned ${resp.status} ${resp.statusText}. ${errBody}`);
    }

    const data = await resp.json();

    // Extract translation safely 
    const translation = data.translation || "Translation unavailable.";

    // Display translation
    inputSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    originalTextEl.textContent = text;
    translatedTextEl.textContent = translation.trim();

  } catch (err) {
    console.error(err);
    alert("Translation failed: " + err.message);
  } finally {
    showLoading(false);
  }
});

startOverBtn.addEventListener("click", () => {
  resultsSection.classList.add("hidden");
  inputSection.classList.remove("hidden");
  document.getElementById("text-input").value = "";
  const checked = document.querySelector("input[name='language']:checked");
  if (checked) checked.checked = false;
});
