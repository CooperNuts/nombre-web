document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA';

  let primaryPair = 'usdlb_std';
  let currentRange = 'all';

  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');
  const tickers = document.querySelectorAll('.ticker');

  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;
  });

  productTitle.textContent =
    document.querySelector('.ticker.active').dataset.name;

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

  // ============================
  // FETCH FROM NEW TABLE
  // ============================
  async function fetchSeries() {

    let url = `${SUPABASE_URL}/rest/v1/pistachio1?select=*&order=fecha.asc`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    return data;
  }

  async function fetchLastTwo() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pistachio1?select=*&order=fecha.desc&limit=2`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    return await res.json();
  }

  async function updateHeader() {
    const d = await fetchLastTwo();
    if (!d.length) return;

    const lastRow = d[0];
    const prevRow = d[1];

    const last = +lastRow[primaryPair];
    const prev = prevRow ? +prevRow[primaryPair] : null;

    productPrice.textContent = last.toFixed(2);

    if (prev !== null) {
      const ch = ((last - prev) / prev) * 100;

      productChange.textContent =
        `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`;

      productPrice.className  = `price ${ch >= 0 ? 'up' : 'down'}`;
      productChange.className = `change ${ch >= 0 ? 'up' : 'down'}`;
    }
  }

  function buildSeries(data) {
    const labels = data.map(x => x.fecha);
    const values = data.map(x => +x[primaryPair]);

    return { labels, values };
  }

  async function updateChart() {
    const d = await fetchSeries();
    if (!d.length) return;

    const { labels, values } = buildSeries(d);

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

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
