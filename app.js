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
let activeColumns = ["usdlb_std"];
let chart = null;

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", async () => {

  if (!checkDependencies()) return;

  showLoadingState();

  await fetchData();

  setupTickers();
  setupChart();
  updateUI();
});

// ==============================
// DEPENDENCIES
// ==============================
function checkDependencies() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js no cargado");
    return false;
  }
  return true;
}

// ==============================
// FETCH
// ==============================
async function fetchData() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=fecha.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: "0-10000"
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Supabase error", data);
      return;
    }

    globalData = data
      .filter(d => d.fecha)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    console.log("Datos cargados:", globalData.length);

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// ==============================
// UI
// ==============================
function showLoadingState() {
  document.getElementById("productTitle").textContent = "Loading...";
  document.getElementById("productPrice").textContent = "-";
  document.getElementById("productChange").textContent = "";
}

// ==============================
// TICKERS
// ==============================
function setupTickers() {
  const tickers = document.querySelectorAll(".ticker");

  tickers.forEach(t => {

    const labelEl = t.querySelector(".label");

    if (labelEl && t.dataset.name) {
      labelEl.textContent = t.dataset.name;
    }

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
// CHART
// ==============================
function setupChart() {
  const ctx = document.getElementById("currencyChart").getContext("2d");

  // ✅ FIX CRÍTICO
  Chart.register(window['chartjs-plugin-annotation']);

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
        annotation: { annotations: {} }
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
  if (!chart || !globalData.length) {
    console.warn("No hay datos para pintar el gráfico");
    return;
  }

  const sorted = globalData;

  const lastDate = new Date(sorted[sorted.length - 1].fecha);

  const minDate = new Date(lastDate);
  minDate.setFullYear(minDate.getFullYear() - 4);

  const filtered = sorted.filter(d => {
    const date = new Date(d.fecha);
    return !isNaN(date) && date >= minDate;
  });

  console.log("Puntos en gráfico:", filtered.length);

  const labels = filtered.map(d => d.fecha);

  chart.data.labels = labels;

  chart.data.datasets = activeColumns.map((col, i) => {

    const ticker = document.querySelector(`.ticker[data-column="${col}"]`);
    const label = ticker ? ticker.dataset.name : col;

    return {
      label: label,
      data: filtered.map(d => {
        const v = Number(d[col]);
        return isNaN(v) ? null : v;
      }),
      borderWidth: 1,
      tension: 0.2,
      pointRadius: 0,
      borderColor: i === 0 ? "#12151c" : "#8B0000"
    };
  });

  const annotations = {};

  hitos.forEach((h, i) => {

    const point = sorted.find(d => d.fecha === h.fecha);
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

  chart.options.plugins.annotation.annotations = annotations;

  const allValues = [];

  activeColumns.forEach(col => {
    filtered.forEach(d => {
      const v = Number(d[col]);
      if (!isNaN(v)) allValues.push(v);
    });
  });

  const max = Math.max(...allValues);
  const min = Math.min(...allValues);

  const range = max - min;
  const padding = range === 0 ? max * 0.20 : range * 0.20;

  chart.options.scales.y.min = min - padding;
  chart.options.scales.y.max = max + padding;
  
  chart.update();
}

// ==============================
// UI UPDATE
// ==============================
function updateUI() {
  if (!globalData.length) {
    console.warn("No hay datos en UI");
    return;
  }

  updateChart();

  const latest = globalData[globalData.length - 1];
  const prev = globalData[globalData.length - 2];

  const col = activeColumns[0];

  const ticker = document.querySelector(`.ticker[data-column="${col}"]`);
  const label = ticker ? ticker.dataset.name : col;

  const value = Number(latest[col]);
  const prevValue = prev ? Number(prev[col]) : value;

  if (isNaN(value)) {
    console.warn("Valor inválido en columna:", col);
    return;
  }

  document.getElementById("productTitle").textContent = label;
  document.getElementById("productPrice").textContent = value.toFixed(2);

  const change = ((value - prevValue) / prevValue) * 100;

  const isPositive = change >= 0;

  document.getElementById("productChange").textContent =
    `${isPositive ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}%`;

  document.getElementById("productChange").className =
    `change ${isPositive ? "down" : "up"}`;

  // ==============================
  // % VARIATION EN TICKERS
  // ==============================
  document.querySelectorAll(".ticker").forEach(t => {
    const colTicker = t.dataset.column;

    const latestVal = Number(latest[colTicker]);
    const prevVal = prev ? Number(prev[colTicker]) : latestVal;

    if (!isNaN(latestVal) && !isNaN(prevVal)) {
      const pct = ((latestVal - prevVal) / prevVal) * 100;

      const deltaEl = t.querySelector(".delta");
      if (deltaEl) {
        deltaEl.textContent = `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}%`;
      }
    }
  });
}
