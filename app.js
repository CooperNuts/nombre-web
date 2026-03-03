document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let currentRange = 'all';

  const hitos = [
    { fecha: '2023-10-02', texto: 'Op. C23' },
    { fecha: '2024-09-30', texto: 'Op. C24' },
    { fecha: '2025-09-29', texto: 'Op. C25' }
  ];

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

  async function fetchSeries(pair) {

    let query = '';
    let order = 'rate_date.desc';
    let limit = 1000;

    if (currentRange !== 'all') {
      const days = parseInt(currentRange, 10);
      const fromDate = new Date(Date.now() - days * 86400000)
        .toISOString()
        .split('T')[0];

      query += `&rate_date=gte.${fromDate}`;
      order = 'rate_date.asc';
    } else {
      // 🔥 En ALL traemos solo últimos 3000 registros
      limit = 3000;
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${query}&order=${order}&limit=${limit}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();

    return currentRange === 'all' ? data.reverse() : data;
  }

  async function fetchLastTwo(pair) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=value&pair=eq.${pair}&order=rate_date.desc&limit=2`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    return await r.json();
  }

  async function updateHeader(pair) {
    const d = await fetchLastTwo(pair);
    if (!d.length) return;

    const last = +d[0].value;
    const prev = d[1] ? +d[1].value : null;

    productPrice.textContent = last.toFixed(2);

    if (prev !== null) {
      const ch = ((last - prev) / prev) * 100;
      productChange.textContent =
        `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`;

      productPrice.className  = `price ${ch >= 0 ? 'up' : 'down'}`;
      productChange.className = `change ${ch >= 0 ? 'up' : 'down'}`;
    }
  }

  function buildHitos(labels, values) {
    const annotations = {};

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
    const d = await fetchSeries(primaryPair);
    if (!d.length) return;

    const labels = d.map(x => x.rate_date);
    const values = d.map(x => +x.value);

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.options.plugins.annotation.annotations =
      buildHitos(labels, values);

    chart.update();
    updateHeader(primaryPair);
  }

  tickers.forEach(t => {
    t.addEventListener('click', () => {
      tickers.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      primaryPair = t.dataset.pair;
      productTitle.textContent = t.dataset.name;
      updateChart();
    });
  });

  document.querySelectorAll('.ranges button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.ranges button')
        .forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      currentRange = b.dataset.range;
      updateChart();
    });
  });

  updateChart();

});
