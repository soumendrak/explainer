// Context menu creation
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "summarizeText",
    title: "Summarize Text",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "explainWord",
    title: "Explain Text",
    contexts: ["selection"],
  });
  console.log("Context menus created");
});


// Handle context menu click
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId === "summarizeText") {
    console.log("Summarize text clicked, fetching summary");
    const summary = await fetchSummary(info.selectionText);
    console.log("Summary received:", summary);

    // Inject content script to display summary
    chrome.tabs.executeScript(
      tab.id,
      {
        code: `(${displayResponse.toString()})(${JSON.stringify(summary)});`,
      },
      (results) => {
        console.log("Content script injected");
      }
    );
  } else if (info.menuItemId === "explainWord") {
    console.log("Explain word clicked, fetching explanation");
    const explanation = await fetchExplanation(info.selectionText);
    console.log("Explanation received:", explanation);

    // Inject content script to display explanation
    chrome.tabs.executeScript(
      tab.id,
      {
        code: `(${displayResponse.toString()})(${JSON.stringify(explanation)});`,
      },
      (results) => {
        console.log("Content script injected");
      }
    );
  }
});

async function fetchApiKey() {
  const response = await fetch(chrome.runtime.getURL("config.json"));
  const config = await response.json();
  return config.openai_api_key;
}

async function fetchSummary(text) {
  const apiKey = await fetchApiKey();
  const url = "https://api.openai.com/v1/completions";
  const prompt = `Summarize this with simple english, emojis, humour and real life analogies:\n\n${text}. 
  Please return response in html format. Please complete entire response.`;

  const requestBody = {
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 64,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const responseData = await response.json();
  console.log("API response:", responseData);
  const summary = responseData.choices && responseData.choices[0] && responseData.choices[0].text ? responseData.choices[0].text.trim() : "No summary available.";
  displayResponse(summary)
  return summary;
}

async function fetchExplanation(word) {
  const apiKey = await fetchApiKey();
  const url = "https://api.openai.com/v1/completions";
  const prompt = `Explain the word "${word}" in first principle analysis with emojis and funnier way 
  ending with a real life analogy if possible. Please return response in html format. Please complete entire response.`;

  const requestBody = {
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 64,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const responseData = await response.json();
  const explanation = responseData.choices && responseData.choices[0] && responseData.choices[0].text ? responseData.choices[0].text.trim() : "No explanation available.";
  displayResponse(explanation)
  return explanation;
}

function displayResponse(summary) {
  const popupContainer = document.createElement("div");
  popupContainer.style.position = "fixed";
  popupContainer.style.zIndex = "10000";
  popupContainer.style.right = "20px";
  popupContainer.style.bottom = "20px";
  popupContainer.style.display = "flex";
  popupContainer.style.justifyContent = "center";
  popupContainer.style.alignItems = "center";
  popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0)";

  const popupContent = document.createElement("div");
  popupContent.style.backgroundColor = "#fff";
  popupContent.style.border = "1px solid #ccc";
  popupContent.style.padding = "20px";
  popupContent.style.borderRadius = "10px";
  popupContent.style.width = "50%";
  popupContent.style.minWidth = "300px";
  popupContent.style.maxWidth = "800px";
  popupContent.style.overflowY = "auto";
  popupContent.style.maxHeight = "80%";
  popupContent.innerHTML = summary;

  const closeButton = document.createElement("span");
  closeButton.innerHTML = "&times;";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "20px";
  closeButton.style.fontWeight = "bold";
  closeButton.style.fontSize = "20px";
  closeButton.style.cursor = "pointer";
  closeButton.addEventListener("click", () => {
    popupContainer.remove();
  });

  popupContent.style.position = "relative";
  popupContent.appendChild(closeButton);
  popupContainer.appendChild(popupContent);
  document.body.appendChild(popupContainer);

  // Close the popup when the Escape key is pressed
  document.addEventListener("keydown", function closePopupOnEscape(event) {
    if (event.key === "Escape") {
      popupContainer.remove();
      document.removeEventListener("keydown", closePopupOnEscape);
    }
  });
}
