// ==============================
// CONFIG SUPABASE
// ==============================
const SUPABASE_URL = "https://pqtbmnqsftqyvkhoszyy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA";
const TABLE = "pistachio1";

// ==============================
// GLOBAL STATE (igual que antes)
// ==============================
let globalData = [];
let currentRange = "all";
let currentColumn = "usdlb_std";
let chart;

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  initTickers();
  initRanges();
  fetchData();
});

// ==============================
// FETCH SUPABASE DATA
// ==============================
async function fetchData() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Supabase error:", data);
      return;
    }

    // Orden por fecha (IMPORTANTE para el gráfico)
    globalData = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    console.log("Datos cargados:", globalData.length);

    initChart();
    updateHeader();
    updateChart();

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// ==============================
// TICKERS
// ==============================
function initTickers() {
  document.querySelectorAll(".ticker").forEach(ticker => {
    ticker.addEventListener("click", () => {
      document.querySelectorAll(".ticker").forEach(t => t.classList.remove("active"));
      ticker.classList.add("active");

      currentColumn = ticker.dataset.column;

      updateHeader();
      updateChart();
    });

    // Set label text
    ticker.querySelector(".label").textContent = ticker.dataset.name;
  });
}

// ==============================
// RANGE BUTTONS
// ==============================
function initRanges() {
  document.querySelectorAll(".ranges button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ranges button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentRange = btn.dataset.range;

      updateChart();
    });
  });
}

// ==============================
// HEADER UPDATE
// ==============================
function updateHeader() {
  if (!globalData.length) return;

  const latest = globalData[globalData.length - 1];
  const prev = globalData[globalData.length - 2];

  const value = latest[currentColumn];
  const prevValue = prev ? prev[currentColumn] : value;

  const change = value - prevValue;
  const pct = prevValue ? (change / prevValue) * 100 : 0;

  document.getElementById("productTitle").textContent = currentColumn;
  document.getElementById("productPrice").textContent = formatNumber(value);
  document.getElementById("productChange").textContent =
    `${change >= 0 ? "▲" : "▼"} ${formatNumber(change)} (${pct.toFixed(2)}%)`;
}

// ==============================
// CHART INIT
// ==============================
function initChart() {
  const ctx = document.getElementById("currencyChart");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: currentColumn,
        data: [],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { maxTicksLimit: 10 } },
        y: { beginAtZero: false }
      }
    }
  });
}

// ==============================
// UPDATE CHART
// ==============================
function updateChart() {
  if (!chart || !globalData.length) return;

  let filtered = applyRange(globalData);

  const labels = filtered.map(d => d.fecha);
  const values = filtered.map(d => d[currentColumn]);

  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.data.datasets[0].label = currentColumn;

  chart.update();
}

// ==============================
// RANGE FILTER
// ==============================
function applyRange(data) {
  if (currentRange === "all") return data;

  const days = parseInt(currentRange);
  const cutoff = new Date();

  cutoff.setDate(cutoff.getDate() - days);

  return data.filter(d => new Date(d.fecha) >= cutoff);
}

// ==============================
// FORMAT
// ==============================
function formatNumber(num) {
  if (num === null || num === undefined) return "-";
  return Number(num).toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}
