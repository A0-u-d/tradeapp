const apiKey = "T6ZR4JY3E5GZ1JTQ"; // Your Alpha Vantage API key

// Beginner tips (random tip when searching)
const beginnerTips = [
    "Only invest what you can afford to lose.",
    "Start by learning how charts work.",
    "It’s okay to wait — patience is smart.",
    "Always read company news before buying.",
    "Practice with a virtual account first!"
];

// Suggested picks for stocks, forex, commodities
const dynamicPicks = [
    // Stocks
    { symbol: 'NVDA', reason: 'AI growth & semiconductor leader', type: 'stock' },
    { symbol: 'JNJ', reason: 'Stable dividends & safe defensive pick', type: 'stock' },
    { symbol: 'LLY', reason: 'Strong pipeline & drug sales growth', type: 'stock' },
    // Forex (6-letter pairs)
    { symbol: 'EURUSD', reason: 'Popular major currency pair', type: 'forex' },
    { symbol: 'GBPUSD', reason: 'Strong pound vs. dollar trends', type: 'forex' },
    { symbol: 'USDJPY', reason: 'Safe-haven yen movements', type: 'forex' },
    // Commodities (use symbols like "GC=F" for Gold, "CL=F" for Crude Oil, but Alpha Vantage may not support them directly)
    // For demo, we’ll use placeholders and handle gracefully
    { symbol: 'XAUUSD', reason: 'Gold priced in USD', type: 'commodity' }, 
];

// Utility: Returns advice string & signal class based on percent change (string like "2.5%")
function getAdvice(changePercent) {
    if (!changePercent) return { advice: "No data", signalClass: "wait", icon: "⏳" };
    const percent = parseFloat(changePercent.replace("%", ""));
    if (isNaN(percent)) return { advice: "No data", signalClass: "wait", icon: "⏳" };

    if (percent > 2) return { advice: "Strong buy signal", signalClass: "buy", icon: "✅" };
    if (percent < -2) return { advice: "Price dropping — be cautious", signalClass: "sell", icon: "⚠️" };
    return { advice: "No clear trend — maybe wait", signalClass: "wait", icon: "⏳" };
}

// Show random beginner tip in the info box
function showBeginnerTip() {
    const tip = beginnerTips[Math.floor(Math.random() * beginnerTips.length)];
    const infoBox = document.getElementById("stockInfo");
    infoBox.innerHTML += `<p style="margin-top: 15px; font-style: italic; color: #555;">💡 Tip: ${tip}</p>`;
}

// Fetch stock data (stocks, forex, commodities) from Alpha Vantage
async function fetchData(symbol, type = "stock") {
    let url = "";
    if (type === "stock") {
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    } else if (type === "forex") {
        // Forex symbols: 6-letter pair like EURUSD -> from_currency=EUR, to_currency=USD
        const fromCurrency = symbol.slice(0,3);
        const toCurrency = symbol.slice(3);
        url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;
    } else if (type === "commodity") {
        // Alpha Vantage has limited direct commodity support.
        // For demo, let's return null to show "Not supported"
        return null;
    }

    try {
        const resp = await fetch(url);
        const data = await resp.json();
        return data;
    } catch {
        return null;
    }
}

// Show info for searched symbol (detect type)
async function showStockInfo() {
    const rawSymbol = document.getElementById("stockInput").value.toUpperCase().trim();
    const infoBox = document.getElementById("stockInfo");
    infoBox.innerHTML = ""; // clear previous

    if (!rawSymbol) {
        infoBox.classList.add("hidden");
        return;
    }

    // Detect asset type by format (simple heuristic)
    let type = "stock";
    if (rawSymbol.length === 6 && /^[A-Z]{6}$/.test(rawSymbol)) {
        type = "forex"; // e.g. EURUSD
    } else if (rawSymbol.length >= 4 && /^[A-Z]{3,6}$/.test(rawSymbol)) {
        // Could be stock or commodity symbol
        // You can add a manual list or UI option if you want more accuracy
        if (["XAUUSD","XAGUSD"].includes(rawSymbol)) type = "commodity";
    }

    infoBox.classList.remove("hidden");
    infoBox.innerHTML = "<p>Loading...</p>";

    const data = await fetchData(rawSymbol, type);

    if (!data) {
        infoBox.innerHTML = `<p><strong>${rawSymbol}</strong> is not supported or data is unavailable.</p>`;
        return;
    }

    // Parse and show differently depending on type:
    if (type === "stock") {
        const quote = data["Global Quote"];
        if (!quote || !quote["05. price"]) {
            infoBox.innerHTML = `<p>Stock <strong>${rawSymbol}</strong> not found or price unavailable.</p>`;
            return;
        }
        const price = parseFloat(quote["05. price"]).toFixed(2);
        const changePercent = quote["10. change percent"];
        const { advice, signalClass, icon } = getAdvice(changePercent);

        infoBox.innerHTML = `
            <h2>${rawSymbol} ${icon}</h2>
            <p>Price: $${price}</p>
            <p>Change: ${changePercent}</p>
            <p><strong>Advice:</strong> ${advice}</p>
        `;
    } else if (type === "forex") {
        const rateData = data["Realtime Currency Exchange Rate"];
        if (!rateData || !rateData["5. Exchange Rate"]) {
            infoBox.innerHTML = `<p>Forex pair <strong>${rawSymbol}</strong> data unavailable.</p>`;
            return;
        }
        const price = parseFloat(rateData["5. Exchange Rate"]).toFixed(4);
        // Forex API does not return % change, so no changePercent
        infoBox.innerHTML = `
            <h2>${rawSymbol} ⏳</h2>
            <p>Exchange Rate: ${price}</p>
            <p><strong>Advice:</strong> Forex data does not include % change. Use other indicators.</p>
        `;
    } else if (type === "commodity") {
        infoBox.innerHTML = `<p>Commodity data for <strong>${rawSymbol}</strong> is not supported by this app.</p>`;
    }

    showBeginnerTip();
}

// Show suggested buys filtered for stocks with >2% gain (only stocks)
async function showSuggestions() {
    const ul = document.getElementById("suggestedList");
    ul.innerHTML = "<li>Loading suggestions...</li>";

    const filtered = [];

    for (const pick of dynamicPicks) {
        const data = await fetchData(pick.symbol, pick.type);

        if (!data) continue;

        if (pick.type === "stock") {
            const quote = data["Global Quote"];
            if (quote && quote["05. price"]) {
                const price = parseFloat(quote["05. price"]).toFixed(2);
                const changePercent = quote["10. change percent"];
                const { advice, signalClass, icon } = getAdvice(changePercent);

                if (signalClass === "buy") {
                    filtered.push({ ...pick, price, changePercent, advice, icon });
                }
            }
        } else if (pick.type === "forex") {
            // Forex doesn’t have % change, so just show current rate without filtering
            const rateData = data["Realtime Currency Exchange Rate"];
            if (rateData && rateData["5. Exchange Rate"]) {
                const price = parseFloat(rateData["5. Exchange Rate"]).toFixed(4);
                filtered.push({ ...pick, price, changePercent: null, advice: "No % change data", icon: "⏳" });
            }
        } else if (pick.type === "commodity") {
            // No data for commodities, skip for now
        }
    }

    if (filtered.length === 0) {
        ul.innerHTML = "<li>No strong buy signals currently. Check back later!</li>";
        return;
    }

    ul.innerHTML = "";
    for (const stock of filtered) {
        ul.innerHTML += `
            <li class="suggestion-item">
                <strong>${stock.symbol}</strong> — $${stock.price} 
                ${stock.changePercent ? `(${stock.changePercent})` : ""}
                <br />
                <em>${stock.reason}</em><br />
                <span>${stock.icon} ${stock.advice}</span>
            </li>
        `;
    }
}

// Toggle glossary visibility
function toggleGlossary() {
    const list = document.getElementById("glossaryList");
    list.classList.toggle("hidden");
}

// Setup event listeners on DOM load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchBtn").addEventListener("click", showStockInfo);
    document.getElementById("glossaryToggle").addEventListener("click", toggleGlossary);
    showSuggestions();
});

