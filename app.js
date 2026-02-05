document.addEventListener('DOMContentLoaded', () => {

  /* =====================
     CONFIG
  ===================== */
  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let comparePair = null;
  let currentRange = 'all';

  const hitos = [
    { fecha: '2024-09-30', texto: 'Opening C24, 3.75' },
    { fecha: '2025-09-29', texto: 'Op. C25, 4.10' }
  ];

  /* =====================
     SIDEBAR + TÍTULOS
  ===================== */
  const productTitle = document.getElementById('productTitle');
  const productPriceEl = document.getElementById('productPrice');
  const productChangeEl = document.getElementById('productChange');

  document.querySelectorAll('.ticker').forEach(ticker => {
    ticker.querySelector('.label').textContent = ticker.dataset.name;
  });

  productTitle.textContent =
    document.querySelector('.ticker.active').dataset.name;

  /* =====================
     CHART SETUP
  ===================== */
  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradientMain = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientMain.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradientMain.addColorStop(1, 'rgba(18,21,28,0)');

  const gradientCompare = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientCompare.addColorStop(0, 'rgba(120,124,135,0.1)');
  gradientCompare.addColorStop(1, 'rgba(120,124,135,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Principal',
          data: [],
          borderColor: '#12151c',
          backgroundColor: gradientMain,
          borderWidth: 0.6,
          tension: 0.28,
          fill: true,
          pointRadius: 0
        },
        {
          label: 'Comparación',
          data: [],
          borderColor: '#7a7f8a',
          backgroundColor: gradientCompare,
          borderWidth: 0.6,
          tension: 0.28,
          fill: false,
          pointRadius: 0,
          hidden: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        annotation: { annotations: {} },
        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          position: 'right',
          grace: '15%',
          ticks: { callback: v => v.toFixed(2) }
        }
      }
    }
  });

  /* =====================
     DATA FETCH
  ===================== */
  async function fetchSeries(pair) {
    let rangeFilter = '';
    if (currentRange !== 'all') {
      const fromDate = new Date(Date.now() - currentRange * 86400000)
        .toISOString().split('T')[0];
      rangeFilter = `&rate_date=gte.${fromDate}`;
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${rangeFilter}&order=rate_date.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    return await res.json();
  }

  async function fetchLatestPrices(pair) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}&order=rate_date.desc&limit=2`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    return await res.json();
  }

  /* =====================
     HITOS
  ===================== */
  function buildAnnotations(labels) {
    const annotations = {};
    hitos.forEach((h, i) => {
      const idx = labels.reduce((best, l, j) =>
        Math.abs(new Date(l) - new Date(h.fecha)) <
        Math.abs(new Date(labels[best]) - new Date(h.fecha)) ? j : best, 0);

      annotations[`hito_${i}`] = {
        type: 'line',
        xMin: labels[idx],
        xMax: labels[idx],
        borderColor: 'rgba(139,0,0,0.35)',
        borderWidth: 0.6,
        borderDash: [2, 4]
      };
    });
    return annotations;
  }

  /* =====================
     HEADER PRICE
  ===================== */
  async function updateHeaderPrice(pair) {
    const data = await fetchLatestPrices(pair);
    if (!data.length) return;

    const last = +data[0].value;
    const prev = data[1] ? +data[1].value : null;

    productPriceEl.textContent = last.toFixed(2);

    if (prev !== null) {
      const change = ((last - prev) / prev) * 100;
      productChangeEl.textContent =
        `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;

      productPriceEl.className =
        `price ${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}`;
      productChangeEl.className =
        `change ${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}`;
    }
  }

  /* =====================
     UPDATE CHART
  ===================== */
  async function updateChart() {
    const data = await fetchSeries(primaryPair);
    if (!data.length) return;

    const labels = data.map(d => d.rate_date);
    const values = data.map(d => +d.value);

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    chart.options.plugins.annotation.annotations =
      buildAnnotations(labels);

    chart.update();
    updateHeaderPrice(primaryPair);
  }

  /* =====================
     INTERACTIONS
  ===================== */
  document.querySelectorAll('.ticker').forEach(ticker => {
    const pair = ticker.dataset.pair;
    const checkbox = ticker.querySelector('.compare-checkbox');

    ticker.addEventListener('click', e => {
      if (e.target === checkbox) return;

      document.querySelectorAll('.ticker')
        .forEach(t => t.classList.remove('active'));
      ticker.classList.add('active');

      primaryPair = pair;
      comparePair = null;
      document.querySelectorAll('.compare-checkbox')
        .forEach(cb => cb.checked = false);

      productTitle.textContent = ticker.dataset.name;
      updateChart();
    });

    checkbox.addEventListener('change', () => {
      comparePair = checkbox.checked ? pair : null;
      chart.data.datasets[1].hidden = !comparePair;
      updateChart();
    });
  });

  document.querySelectorAll('.ranges button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ranges button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentRange = btn.dataset.range;
      updateChart();
    });
  });

  /* =====================
     INIT
  ===================== */
  updateChart();
});
