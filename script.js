const apiKey = "T6ZR4JY3E5GZ1JTQ"; // Your Alpha Vantage API key

// Beginner tips (random tip when searching)
const beginnerTips = [
    "Only invest what you can afford to lose.",
    "Start by learning how charts work.",
    "It’s okay to wait — patience is smart.",
    "Always read company news before buying.",
    "Practice with a virtual account first!"
];

// Categorized picks
const dynamicPicks = {
    stocks: [
        { symbol: 'NVDA', reason: 'AI growth & semiconductor leader' },
        { symbol: 'JNJ', reason: 'Stable dividends & safe defensive pick' },
        { symbol: 'LLY', reason: 'Strong pipeline & drug sales growth' },
        { symbol: 'CRWV', reason: 'AI infrastructure play (volatile)' }
    ],
    forex: [
        { from: 'EUR', to: 'USD', reason: 'Strong Euro, watch for USD moves' },
        { from: 'GBP', to: 'USD', reason: 'GBP/USD sensitive to UK news' }
    ],
    commodities: [
        { symbol: 'GC=F', name: 'Gold Futures', reason: 'Safe-haven asset' },
        { symbol: 'CL=F', name: 'Crude Oil Futures', reason: 'Oil price volatility' }
    ]
};

// Advice logic
function getAdvice(changePercent) {
    if (!changePercent) return { advice: "No data", signalClass: "wait", icon: "⏳" };
    const percent = parseFloat(changePercent.replace("%", ""));
    if (isNaN(percent)) return { advice: "No data", signalClass: "wait", icon: "⏳" };

    if (percent > 2) return { advice: "Strong buy signal", signalClass: "buy", icon: "✅" };
    if (percent < -2) return { advice: "Price dropping — be cautious", signalClass: "sell", icon: "⚠️" };
    return { advice: "No clear trend — maybe wait", signalClass: "wait", icon: "⏳" };
}

// Show random beginner tip
function showBeginnerTip() {
    const tip = beginnerTips[Math.floor(Math.random() * beginnerTips.length)];
    const infoBox = document.getElementById("stockInfo");
    infoBox.innerHTML += `<p style="margin-top: 15px; font-style: italic; color: #555;">💡 Tip: ${tip}</p>`;
}

// Fetch stock or commodity data (using GLOBAL_QUOTE)
async function fetchStockData(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        return data["Global Quote"] || null;
    } catch {
        return null;
    }
}

// Fetch forex exchange rate (returns current price but no % change available)
async function fetchForexData(from, to) {
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        const rateInfo = data["Realtime Currency Exchange Rate"];
        if (!rateInfo) return null;
        return {
            price: parseFloat(rateInfo["5. Exchange Rate"]),
            changePercent: null // Alpha Vantage does not provide % change here
        };
    } catch {
        return null;
    }
}

// Show stock/commodity info for user search
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

    // Try to fetch as stock or commodity
    const quote = await fetchStockData(symbol);
    if (!quote || !quote["05. price"]) {
        infoBox.innerHTML = `<p>Stock/commodity <strong>${symbol}</strong> not found or price unavailable.</p>`;
        return;
    }

    const price = parseFloat(quote["05. price"]).toFixed(2);
    const changePercent = quote["10. change percent"];
    const { advice, signalClass, icon } = getAdvice(changePercent);

    infoBox.innerHTML = `
    <h2>${symbol} ${icon}</h2>
    <p>Price: $${price}</p>
    <p>Change: ${changePercent || "N/A"}</p>
    <p><strong>Advice:</strong> ${advice}</p>
  `;

    showBeginnerTip();
}

// Show suggested stocks (filtering by strong buy signals)
async function showSuggestedStocks() {
    const ul = document.getElementById("suggestedStocks");
    ul.innerHTML = "<li>Loading stocks...</li>";
    const filtered = [];

    for (const pick of dynamicPicks.stocks) {
        const quote = await fetchStockData(pick.symbol);
        if (quote && quote["05. price"]) {
            const price = parseFloat(quote["05. price"]).toFixed(2);
            const changePercent = quote["10. change percent"];
            const { advice, signalClass, icon } = getAdvice(changePercent);

            if (signalClass === "buy") {
                filtered.push({ ...pick, price, changePercent, advice, signalClass, icon });
            }
        }
    }

    if (filtered.length === 0) {
        ul.innerHTML = "<li>No strong buy signals currently. Check back later!</li>";
        return;
    }

    ul.innerHTML = "";
    for (const stock of filtered) {
        ul.innerHTML += `<li class="${stock.signalClass}">${stock.icon} <strong>${stock.symbol}</strong> — ${stock.reason}<br><small>Price: $${stock.price} | Change: ${stock.changePercent} | Advice: ${stock.advice}</small></li>`;
    }
}

// Show suggested forex pairs (no % change available, so just list them)
async function showSuggestedForex() {
    const ul = document.getElementById("suggestedForex");
    ul.innerHTML = "<li>Loading forex...</li>";
    const results = [];

    for (const pair of dynamicPicks.forex) {
        const data = await fetchForexData(pair.from, pair.to);
        if (data && data.price) {
            results.push({
                pair: `${pair.from}/${pair.to}`,
                price: data.price.toFixed(4),
                reason: pair.reason
            });
        }
    }

    if (results.length === 0) {
        ul.innerHTML = "<li>No forex data available.</li>";
        return;
    }

    ul.innerHTML = "";
    for (const fx of results) {
        ul.innerHTML += `<li>💱 <strong>${fx.pair}</strong> — ${fx.reason}<br><small>Exchange Rate: ${fx.price}</small></li>`;
    }
}

// Show suggested commodities (filtering strong buy signals)
async function showSuggestedCommodities() {
    const ul = document.getElementById("suggestedCommodities");
    ul.innerHTML = "<li>Loading commodities...</li>";
    const filtered = [];

    for (const comm of dynamicPicks.commodities) {
        const quote = await fetchStockData(comm.symbol);
        if (quote && quote["05. price"]) {
            const price = parseFloat(quote["05. price"]).toFixed(2);
            const changePercent = quote["10. change percent"];
            const { advice, signalClass, icon } = getAdvice(changePercent);

            if (signalClass === "buy") {
                filtered.push({ ...comm, price, changePercent, advice, signalClass, icon });
            }
        }
    }

    if (filtered.length === 0) {
        ul.innerHTML = "<li>No strong buy signals currently. Check back later!</li>";
        return;
    }

    ul.innerHTML = "";
    for (const comm of filtered) {
        ul.innerHTML += `<li class="${comm.signalClass}">${comm.icon} <strong>${comm.name}</strong> — ${comm.reason}<br><small>Price: $${comm.price} | Change: ${comm.changePercent} | Advice: ${comm.advice}</small></li>`;
    }
}

// Toggle glossary visibility
function toggleGlossary() {
    const list = document.getElementById("glossaryList");
    list.classList.toggle("hidden");
}

// Initialize event listeners and load suggestions on page load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchBtn").addEventListener("click", showStockInfo);
    document.getElementById("glossaryToggle").addEventListener("click", toggleGlossary);

    showSuggestedStocks();
    showSuggestedForex();
    showSuggestedCommodities();
});
