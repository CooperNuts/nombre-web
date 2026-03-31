// ==============================
// CONFIG
// ==============================
const SUPABASE_URL = "https://pqtbmnqsftqyvkhoszyy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA";
const TABLE = "pistachio1";

// ==============================
// HITOS
// ==============================
const hitos = [
  { fecha: '2023-10-02', texto: 'Op. C23' },
  { fecha: '2024-09-30', texto: 'Op. C24' },
  { fecha: '2025-09-29', texto: 'Op. C25' }
];

// ==============================
// STATE
// ==============================
let globalData = [];
let activeColumns = ["usdlb_std"]; // ✅ multi-series
let chart = null;

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 App iniciada");

  if (!checkDependencies()) return;

  showLoadingState();

  await fetchData();

  setupTickers();
  setupChart();
  updateUI();
});

// ==============================
// DEPENDENCIES CHECK
// ==============================
function checkDependencies() {
  if (typeof Chart === "undefined") {
    console.error("❌ Chart.js no está cargado");
    showError("Chart.js no disponible");
    return false;
  }
  return true;
}

// ==============================
// FETCH DATA
// ==============================
async function fetchData(retry = 1) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Supabase error:", data);
      if (retry > 0) return fetchData(retry - 1);
      showError("Error cargando datos");
      return;
    }

    globalData = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  } catch (err) {
    console.error("❌ Fetch error:", err);
    showError("Error conexión");
  }
}

// ==============================
// UI STATES
// ==============================
function showLoadingState() {
  document.getElementById("productTitle").textContent = "Loading...";
  document.getElementById("productPrice").textContent = "-";
  document.getElementById("productChange").textContent = "";
}

function showError(message) {
  document.getElementById("productTitle").textContent = "Error";
  document.getElementById("productPrice").textContent = "-";
  document.getElementById("productChange").textContent = message;
}

// ==============================
// TICKERS (MULTI SELECT)
// ==============================
function setupTickers() {
  const tickers = document.querySelectorAll(".ticker");

  tickers.forEach(t => {
    t.addEventListener("click", () => {

      const col = t.dataset.column;

      if (activeColumns.includes(col)) {
        activeColumns = activeColumns.filter(c => c !== col);
        t.classList.remove("active");
      } else {
        activeColumns.push(col);
        t.classList.add("active");
      }

      if (activeColumns.length === 0) {
        activeColumns = [col];
        t.classList.add("active");
      }

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

  const col = activeColumns[0];
  const value = latest[col];
  const prevValue = prev ? prev[col] : value;

  if (value === undefined) return;

  const change = value - prevValue;
  const changePct = prevValue ? (change / prevValue) * 100 : 0;

  document.getElementById("productTitle").textContent = activeColumns.join(" + ");
  document.getElementById("productPrice").textContent = Number(value).toFixed(2);

  // ✅ COLOR INVERTIDO
  const isPositive = changePct >= 0;

  document.getElementById("productChange").textContent =
    `${isPositive ? "▲" : "▼"} ${Math.abs(changePct).toFixed(2)}%`;

  document.getElementById("productPrice").className =
    `price ${isPositive ? "down" : "up"}`;
  document.getElementById("productChange").className =
    `change ${isPositive ? "down" : "up"}`;

  updateChart();
}

// ==============================
// CHART
// ==============================
function setupChart() {
  const ctx = document.getElementById("currencyChart");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(2)}`
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          position: "right",
          ticks: {
            callback: v => Number(v).toFixed(2)
          }
        }
      }
    }
  });
}

// ==============================
// UPDATE CHART
// ==============================
function updateChart() {
  if (!chart || !globalData.length) return;

  const labels = globalData.map(d => d.fecha);
  chart.data.labels = labels;

  // ✅ MULTI SERIES
  chart.data.datasets = activeColumns.map((col, i) => ({
    label: col,
    data: globalData.map(d => Number(d[col])),
    borderWidth: 1,
    tension: 0.2,
    pointRadius: 0,
    borderColor: i === 0 ? "#12151c" : "#8B0000"
  }));

  // ==============================
  // HITOS
  // ==============================
  const annotations = {};

  hitos.forEach((h, i) => {

    const point = globalData.find(d => d.fecha === h.fecha);
    if (!point) return;

    const y = Number(point[activeColumns[0]]);
    if (isNaN(y)) return;

    annotations[`line_${i}`] = {
      type: "line",
      xMin: h.fecha,
      xMax: h.fecha,
      borderColor: "rgba(139,0,0,0.25)",
      borderWidth: 1
    };

    annotations[`point_${i}`] = {
      type: "point",
      xValue: h.fecha,
      yValue: y,
      backgroundColor: "#8B0000",
      radius: 4
    };

    annotations[`label_${i}`] = {
      type: "label",
      xValue: h.fecha,
      yValue: y,
      content: `${h.texto} · ${y.toFixed(2)}`,
      backgroundColor: "#ffffff",
      color: "#8B0000",
      font: { size: 10 },
      padding: 6,
      borderRadius: 4,
      yAdjust: -12
    };

  });

  chart.options.plugins.annotation.annotations = annotations;

  chart.update();
}
