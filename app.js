document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';

  // ✅ Tu anon public key correcta
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA
  let primaryPair = 'usdlb_std';

  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');
  const tickers = document.querySelectorAll('.ticker');

  // Inicializar labels
  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;
  });

  const activeTicker = document.querySelector('.ticker.active');
  productTitle.textContent = activeTicker ? activeTicker.dataset.name : '';

  const ctx = document.getElementById('currencyChart').getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradient.addColorStop(1, 'rgba(18,21,28,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#12151c',
        backgroundColor: gradient,
        borderWidth: 0.4,
        fill: true,
        tension: 0.28,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false
        },
        annotation: { annotations: {} }
      },
      scales: {
        x: { grid: { display: false } },
        y: { position: 'right', grace: '15%' }
      }
    }
  });

  async function fetchSeries() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pistachio1?select=*&order=fecha.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    return await res.json();
  }

  async function fetchLastTwo() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pistachio1?select=*&order=fecha.desc&limit=2`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    return await res.json();
  }

  async function updateHeader() {
    const d = await fetchLastTwo();
    if (!d.length) return;

    const last = +d[0][primaryPair];
    const prev = d[1] ? +d[1][primaryPair] : null;

    productPrice.textContent = last.toFixed(2);

    if (prev !== null) {
      const ch = ((last - prev) / prev) * 100;

      productChange.textContent =
        `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`;

      productPrice.className  = `price ${ch >= 0 ? 'up' : 'down'}`;
      productChange.className = `change ${ch >= 0 ? 'up' : 'down'}`;
    }
  }

  function buildHitos(labels) {
    const annotations = {};

    const hitos = [
      { fecha: '2023-10-02' },
      { fecha: '2024-09-30' },
      { fecha: '2025-09-29' }
    ];

    hitos.forEach((h, i) => {
      let idx = labels.findIndex(l => l >= h.fecha);
      if (idx === -1) return;

      annotations[`hito_${i}`] = {
        type: 'line',
        xMin: labels[idx],
        xMax: labels[idx],
        borderColor: 'rgba(139,0,0,0.45)',
        borderWidth: 0.6,
        borderDash: [2, 4]
      };
    });

    return annotations;
  }

  async function updateChart() {
    const d = await fetchSeries();
    if (!d.length) return;

    const labels = d.map(x => x.fecha);
    const values = d.map(x => +x[primaryPair]);

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.options.plugins.annotation.annotations =
      buildHitos(labels);

    chart.update();
    updateHeader();
  }

  tickers.forEach(t => {
    t.addEventListener('click', () => {
      tickers.forEach(x => x.classList.remove('active'));
      t.classList.add('active');

      primaryPair = t.dataset.column;
      productTitle.textContent = t.dataset.name;

      updateChart();
    });
  });

  updateChart();

});
