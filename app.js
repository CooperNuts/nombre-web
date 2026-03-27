// ==============================
// CONFIG SUPABASE
// ==============================
const SUPABASE_URL = "https://pqtbmnqsftqyvkhoszyy.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA";

// ==============================
// STATE GLOBAL
// ==============================
let globalData = [];
let currentColumn = "usdlb_std";
let chart = null;

// ==============================
// FETCH DATA
// ==============================
async function fetchData() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pistachio1?select=*`, {
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

    // Ordenar por fecha
    globalData = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    console.log("DATA CARGADA:", globalData);

    initDashboard();
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// ==============================
// INIT DASHBOARD
// ==============================
function initDashboard() {
  setupTickers();
  setupChart();
  updateUI();
}

// ==============================
// TICKERS
// ==============================
function setupTickers() {
  const tickers = document.querySelectorAll(".ticker");

  tickers.forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".ticker").forEach(el => el.classList.remove("active"));
      t.classList.add("active");

      currentColumn = t.dataset.column;
      updateUI();
    });
  });
}

// ==============================
// UI UPDATE
// ==============================
function updateUI() {
  if (!globalData.length) return;

  const latest = globalData[globalData.length - 1];
  const prev = globalData[globalData.length - 2];

  const value = latest[currentColumn];
  const prevValue = prev ? prev[currentColumn] : value;

  const change = value - prevValue;
  const changePct = prevValue ? (change / prevValue) * 100 : 0;

  document.getElementById("productTitle").textContent = currentColumn.toUpperCase();
  document.getElementById("productPrice").textContent = formatNumber(value);

  document.getElementById("productChange").textContent =
    `${change >= 0 ? "▲" : "▼"} ${formatNumber(change)} (${changePct.toFixed(2)}%)`;

  updateChart();
}

// ==============================
// CHART
// ==============================
function setupChart() {
  const ctx = document.getElementById("currencyChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: currentColumn,
          data: [],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
          },
        },
        y: {
          beginAtZero: false,
        },
      },
    },
  });
}

// ==============================
// UPDATE CHART
// ==============================
function updateChart() {
  const labels = globalData.map(d => d.fecha);
  const values = globalData.map(d => d[currentColumn]);

  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.data.datasets[0].label = currentColumn;

  chart.update();
}

// ==============================
// FORMAT NUMBER
// ==============================
function formatNumber(num) {
  if (num === null || num === undefined) return "-";
  return Number(num).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

// ==============================
// RANGE BUTTONS
// ==============================
function setupRanges() {
  const buttons = document.querySelectorAll(".ranges button");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ranges button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const range = btn.dataset.range;
      applyRange(range);
    });
  });
}

// ==============================
// FILTER RANGE
// ==============================
function applyRange(range) {
  if (range === "all") {
    updateChart();
    return;
  }

  const days = parseInt(range);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filtered = globalData.filter(d => new Date(d.fecha) >= cutoff);

  const labels = filtered.map(d => d.fecha);
  const values = filtered.map(d => d[currentColumn]);

  chart.data.labels = labels;
  chart.data.datasets[0].data = values;

  chart.update();
}

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  fetchData();
  setupRanges();
});
