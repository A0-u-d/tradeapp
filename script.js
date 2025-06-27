console.log("JS file loaded.");

const apiKey = "58VN3XKIWSR2NQ7G"; // Your Alpha Vantage API key

// Beginner tips shown randomly
const beginnerTips = [
  "Only invest what you can afford to lose.",
  "Start by learning how charts work.",
  "It’s okay to wait — patience is smart.",
  "Always read company news before buying.",
  "Practice with a virtual account first!"
];

// Suggested stocks, forex pairs, and commodities
const dynamicStocks = [
  { symbol: "NVDA", reason: "AI growth & semiconductor leader" },
  { symbol: "JNJ", reason: "Stable dividends & safe defensive pick" },
  { symbol: "LLY", reason: "Strong pipeline & drug sales growth" },
  { symbol: "CRWV", reason: "AI infrastructure play (volatile)" }
];

const dynamicForex = [
  { symbol: "EURUSD", reason: "Popular currency pair, Euro vs USD" },
  { symbol: "GBPUSD", reason: "British Pound vs USD" },
  { symbol: "USDJPY", reason: "USD vs Japanese Yen" },
];

const dynamicCommodities = [
  { symbol: "GC=F", reason: "Gold futures" },
  { symbol: "CL=F", reason: "Crude Oil futures" },
  { symbol: "SI=F", reason: "Silver futures" },
];

// Utility function: return advice object based on change %
function getAdvice(changePercent) {
  if (!changePercent) return { advice: "No data", signalClass: "wait", icon: "⏳" };
  const percent = parseFloat(changePercent.replace("%", ""));
  if (isNaN(percent)) return { advice: "No data", signalClass: "wait", icon: "⏳" };

  if (percent > 2) return { advice: "Strong buy signal", signalClass: "buy", icon: "✅" };
  if (percent < -2) return { advice: "Price dropping — be cautious", signalClass: "sell", icon: "⚠️" };
  return { advice: "No clear trend — maybe wait", signalClass: "wait", icon: "⏳" };
}

// Fetch data from Alpha Vantage for given symbol, with API limit handling
async function fetchStockData(symbol) {
  let functionName = "GLOBAL_QUOTE";
  if (dynamicForex.find((f) => f.symbol === symbol)) {
    functionName = "CURRENCY_EXCHANGE_RATE";
  }

  let url;
  if (functionName === "GLOBAL_QUOTE") {
    url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  } else if (functionName === "CURRENCY_EXCHANGE_RATE") {
    const fromCurrency = symbol.slice(0, 3);
    const toCurrency = symbol.slice(3, 6);
    url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;
  }

  try {
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.Note) {
      console.warn("API Rate Limit reached:", data.Note);
      return { error: "API limit reached", message: data.Note };
    }

    if (data["Error Message"]) {
      console.warn("API returned error:", data["Error Message"]);
      return { error: "API error", message: data["Error Message"] };
    }

    return { data, functionName };
  } catch (err) {
    console.error("Fetch error:", err);
    return { error: "Fetch failed", message: err.message };
  }
}

// Show stock/forex/commodity info after search
async function showStockInfo() {
  const symbol = document.getElementById("stockInput").value.toUpperCase().trim();
  const infoBox = document.getElementById("stockInfo");
  infoBox.innerHTML = "";
  if (!symbol) {
    infoBox.classList.add("hidden");
    return;
  }
  infoBox.classList.remove("hidden");
  infoBox.innerHTML = "<p>Loading...</p>";

  const result = await fetchStockData(symbol);

  if (!result) {
    infoBox.innerHTML = `<p>Could not fetch data for <strong>${symbol}</strong>. Try again.</p>`;
    return;
  }

  if (result.error) {
    infoBox.innerHTML = `<p><strong>Error:</strong> ${result.message}</p>`;
    return;
  }

  const { data, functionName } = result;

  if (functionName === "GLOBAL_QUOTE") {
    const quote = data["Global Quote"];
    if (!quote || !quote["05. price"]) {
      infoBox.innerHTML = `<p>Stock/Commodity <strong>${symbol}</strong> not found or price unavailable.</p>`;
      return;
    }
    const price = parseFloat(quote["05. price"]).toFixed(2);
    const changePercent = quote["10. change percent"];
    const { advice, signalClass, icon } = getAdvice(changePercent);

    infoBox.innerHTML = `
      <h2>${symbol} ${icon}</h2>
      <p>Price: $${price}</p>
      <p>Change: ${changePercent}</p>
      <p><strong>Advice:</strong> ${advice}</p>
    `;
  } else if (functionName === "CURRENCY_EXCHANGE_RATE") {
    const exchangeData = data["Realtime Currency Exchange Rate"];
    if (!exchangeData) {
      infoBox.innerHTML = `<p>Forex pair <strong>${symbol}</strong> not found.</p>`;
      return;
    }
    const price = parseFloat(exchangeData["5. Exchange Rate"]).toFixed(4);
    infoBox.innerHTML = `
      <h2>${symbol} 🌍</h2>
      <p>Exchange Rate: ${price}</p>
      <p><strong>Advice:</strong> Forex data - watch market news and trends.</p>
    `;
  }
  showBeginnerTip();
}

// Show suggested stocks, forex, commodities with buy signals (change > 2%)
async function showSuggestions() {
  const stockUL = document.getElementById("suggestedStocks");
  const forexUL = document.getElementById("suggestedForex");
  const commoditiesUL = document.getElementById("suggestedCommodities");

  stockUL.innerHTML = "<li>Loading stocks...</li>";
  forexUL.innerHTML = "<li>Loading forex...</li>";
  commoditiesUL.innerHTML = "<li>Loading commodities...</li>";

  async function filterStrongBuys(list, isForex = false) {
    const results = [];
    for (const item of list) {
      const result = await fetchStockData(item.symbol);
      if (!result || result.error) continue;
      const { data, functionName } = result;

      if (functionName === "GLOBAL_QUOTE") {
        const quote = data["Global Quote"];
        if (!quote || !quote["05. price"]) continue;
        const price = parseFloat(quote["05. price"]).toFixed(2);
        const changePercent = quote["10. change percent"];
        const { advice, signalClass, icon } = getAdvice(changePercent);
        if (signalClass === "buy") {
          results.push({ ...item, price, changePercent, advice, icon });
        }
      } else if (functionName === "CURRENCY_EXCHANGE_RATE" && isForex) {
        const exchangeData = data["Realtime Currency Exchange Rate"];
        if (!exchangeData) continue;
        const price = parseFloat(exchangeData["5. Exchange Rate"]).toFixed(4);
        results.push({ ...item, price, changePercent: "N/A", advice: "Watch market news", icon: "🌍" });
      }
    }
    return results;
  }

  const strongStocks = await filterStrongBuys(dynamicStocks);
  const strongForex = await filterStrongBuys(dynamicForex, true);
  const strongCommodities = await filterStrongBuys(dynamicCommodities);

  stockUL.innerHTML = strongStocks.length === 0
    ? "<li>No strong buy signals currently.</li>"
    : strongStocks.map(s => `<li><strong>${s.symbol}</strong> ($${s.price}): ${s.reason} ${s.icon}</li>`).join("");

  forexUL.innerHTML = strongForex.length === 0
    ? "<li>No forex data available.</li>"
    : strongForex.map(fx => `<li><strong>${fx.symbol}</strong> (Rate: ${fx.price}): ${fx.reason} ${fx.icon}</li>`).join("");

  commoditiesUL.innerHTML = strongCommodities.length === 0
    ? "<li>No strong buy signals currently.</li>"
    : strongCommodities.map(c => `<li><strong>${c.symbol}</strong> ($${c.price}): ${c.reason} ${c.icon}</li>`).join("");
}

// Show a beginner tip below the info box
function showBeginnerTip() {
  const tip = beginnerTips[Math.floor(Math.random() * beginnerTips.length)];
  const infoBox = document.getElementById("stockInfo");
  if (infoBox) {
    infoBox.innerHTML += `<p><em>💡 Tip: ${tip}</em></p>`;
  }
}

// Toggle glossary visibility
function toggleGlossary() {
  const list = document.getElementById("glossaryList");
  if (list) list.classList.toggle("hidden");
}

// Initialize event listeners and show suggestions on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded.");

  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", showStockInfo);
  }

  const glossaryToggle = document.getElementById("glossaryToggle");
  if (glossaryToggle) {
    glossaryToggle.addEventListener("click", toggleGlossary);
  }

  showSuggestions();
});
