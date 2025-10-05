// =======================================
// proDUCKtive — Gemini-Enhanced Background Script
// =======================================

// --- Default site lists ---
const DEFAULT_PRODUCTIVE_SITES = [
  "github.com",
  "stackoverflow.com",
  "docs.google.com",
  "notion.so",
  "trello.com",
  "calendar.google.com"
];

const DEFAULT_UNPRODUCTIVE_SITES = [
  "youtube.com",
  "netflix.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "reddit.com"
];

// --- Gemini API key ---
// ⚠️ Replace this with *your private Gemini key* (keep it local only!)
// e.g. const GEMINI_API_KEY = "AIza..."; 
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

// --- Initialize defaults in storage ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["productiveSites", "unproductiveSites"], (res) => {
    if (!res.productiveSites) chrome.storage.local.set({ productiveSites: DEFAULT_PRODUCTIVE_SITES });
    if (!res.unproductiveSites) chrome.storage.local.set({ unproductiveSites: DEFAULT_UNPRODUCTIVE_SITES });
  });
});

// --- State variables ---
let isProductive = true;
let inactiveTime = 0;
let inactivityTimer;
let currentUrl = "";
let activeStartTime = Date.now();
let siteDurations = {};

// --- Helpers ---
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function recordSiteTime(url) {
  const domain = extractDomain(url);
  const now = Date.now();
  const timeSpent = (now - activeStartTime) / 1000;
  if (domain) {
    siteDurations[domain] = (siteDurations[domain] || 0) + timeSpent;
    chrome.storage.local.set({ siteDurations });
  }
  activeStartTime = now;
}

// --- Restore state ---
chrome.storage.local.get(["isProductive", "inactiveTime"], (result) => {
  isProductive = result.isProductive ?? true;
  inactiveTime = result.inactiveTime || 0;
  startInactivityTracking();
});

// --- Tab / window tracking ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    recordSiteTime(currentUrl);
    currentUrl = changeInfo.url;
    checkWebsiteProductivity(changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, (tab) => {
    if (tab.url) {
      recordSiteTime(currentUrl);
      currentUrl = tab.url;
      checkWebsiteProductivity(tab.url);
    }
  });
});

// --- Productivity classification ---
async function checkWebsiteProductivity(url) {
  try {
    const { productiveSites, unproductiveSites } = await chrome.storage.local.get([
      "productiveSites",
      "unproductiveSites"
    ]);

    const domain = extractDomain(url);
    if (productiveSites?.some((site) => domain.includes(site))) {
      setProductivity(true, "productive_website");
    } else if (unproductiveSites?.some((site) => domain.includes(site))) {
      setProductivity(false, "unproductive_website");
    } else {
      resetInactivity();
    }
  } catch (err) {
    console.error("Error checking site productivity:", err);
  }
}

// --- Core productivity logic ---
function setProductivity(productive, reason = "manual") {
  const wasProductive = isProductive;
  isProductive = productive;
  inactiveTime = productive ? 0 : 30;
  chrome.storage.local.set({ isProductive, inactiveTime });

  if (wasProductive !== isProductive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "setProductivity",
          productive: isProductive,
          reason
        });
      }
    });

    // Generate summary only when transitioning to unproductive
    if (!productive && wasProductive) generateProductivitySummary();
  }

  if (isProductive) startInactivityTracking();
}

// --- Inactivity tracking ---
function startInactivityTracking() {
  if (inactivityTimer) clearInterval(inactivityTimer);
  inactivityTimer = setInterval(() => {
    inactiveTime++;
    if (inactiveTime >= 30 && isProductive) setProductivity(false, "inactivity");
    chrome.storage.local.set({ inactiveTime });
  }, 1000);
}

// --- Reset inactivity ---
function resetInactivity() {
  inactiveTime = 0;
  if (!isProductive) {
    chrome.storage.local.get(["unproductiveSites"], (result) => {
      const domain = extractDomain(currentUrl);
      const isUnproductive = result.unproductiveSites?.some((site) => domain.includes(site));
      if (!isUnproductive) setProductivity(true, "user_activity");
    });
  }
  startInactivityTracking();
}

chrome.tabs.onActivated.addListener(resetInactivity);
chrome.windows.onFocusChanged.addListener(resetInactivity);

// =======================================
// 🧠 Gemini AI Summary Generator
// =======================================
async function generateProductivitySummary() {
  const { siteDurations, productiveSites, unproductiveSites } = await chrome.storage.local.get([
    "siteDurations",
    "productiveSites",
    "unproductiveSites"
  ]);

  if (!siteDurations || Object.keys(siteDurations).length === 0) {
    console.warn("No tracked activity yet 🦆");
    return;
  }

  const summaryText = Object.entries(siteDurations)
    .map(([site, seconds]) => `${site}: ${Math.round(seconds / 60)} minutes`)
    .join("\n");

  const prompt = `
Summarize the user's productivity today in a warm, friendly tone.
Highlight positive focus, note distractions, and give short encouragement.

Productive sites: ${productiveSites?.join(", ") || "None"}
Unproductive sites: ${unproductiveSites?.join(", ") || "None"}

Activity data:
${summaryText}
`;

  // --- Local fallback (no API key or network) ---
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "AIzaSyBBA_nxpfEeITkMzVMwJKBQcsKcws-jgCQ") {
    const localSummary = generateLocalSummary(siteDurations, productiveSites, unproductiveSites);
    await chrome.storage.local.set({ aiSummary: localSummary });
    console.log("🦆 Local Summary:", localSummary);
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const aiSummary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No summary generated — try again later.";

    await chrome.storage.local.set({ aiSummary });
    console.log("🦆 Gemini Summary:", aiSummary);
  } catch (err) {
    console.error("Gemini summary error:", err);
    const fallback = generateLocalSummary(siteDurations, productiveSites, unproductiveSites);
    await chrome.storage.local.set({ aiSummary: fallback });
  }
}

// --- Offline local summary generator ---
function generateLocalSummary(siteDurations, productiveSites, unproductiveSites) {
  const topSites = Object.entries(siteDurations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([site, time]) => `${site} (${Math.round(time / 60)} min)`)
    .join(", ");

  return `
You spent most of your time on: ${topSites}.
${productiveSites.length} productive sites, ${unproductiveSites.length} distractions.
Keep building focus and reward yourself for progress! 🦆
`.trim();
}

// =======================================
// 📩 Message handling (popup + content)
// =======================================
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "setProductivity") setProductivity(req.productive, "manual");

  if (req.action === "getProductivity")
    sendResponse({ isProductive, inactiveTime, currentUrl });

  if (req.action === "userActivity") resetInactivity();

  if (req.action === "getWebsiteLists") {
    chrome.storage.local.get(["productiveSites", "unproductiveSites"], (res) => sendResponse(res));
    return true;
  }

  if (req.action === "updateWebsiteLists") {
    chrome.storage.local.set({
      productiveSites: req.productiveSites,
      unproductiveSites: req.unproductiveSites
    });
    if (currentUrl) checkWebsiteProductivity(currentUrl);
  }

  if (req.action === "addWebsite") {
    chrome.storage.local.get([req.listType], (res) => {
      const list = res[req.listType] || [];
      if (!list.includes(req.website)) {
        chrome.storage.local.set({ [req.listType]: [...list, req.website] });
        if (currentUrl) checkWebsiteProductivity(currentUrl);
      }
    });
  }

  if (req.action === "removeWebsite") {
    chrome.storage.local.get([req.listType], (res) => {
      const updated = (res[req.listType] || []).filter((site) => site !== req.website);
      chrome.storage.local.set({ [req.listType]: updated });
      if (currentUrl) checkWebsiteProductivity(currentUrl);
    });
  }

  // 🧠 Manual AI summary refresh from popup
  if (req.action === "generateSummaryNow") {
    generateProductivitySummary()
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true; // async
  }
});
