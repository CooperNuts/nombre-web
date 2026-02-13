document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = ACTIVE_PAIRS[0];
  let currentRange = 'all';


  const ACTIVE_PAIRS = [
  'USDLB_STD',
  'USDLB_LARGE',
  'USDLB_KERNEL'
  // 'EURKG_ES2125',
  // 'EURKG_ESKERNEL'
];

  /* ==========================
     HITOS IMPORTANTES
  ========================== */
  const hitos = [
    { fecha: '2024-09-30', texto: 'Op. C24' },
    { fecha: '2025-09-29', texto: 'Op. C25' }
  ];

  /* ==========================
     UI ELEMENTS
  ========================== */
  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');

  const allTickers = document.querySelectorAll('.ticker');

  const tickers = Array.from(allTickers).filter(t => {
    if (!ACTIVE_PAIRS.includes(t.dataset.pair)) {
      t.style.display = 'none'; // los oculta
      return false;
    }
    return true;
  });
  ;

  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;

    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 40;
    canvas.className = 'sparkline';
    t.appendChild(canvas);
  });

  productTitle.textContent =
    document.querySelector('.ticker.active').dataset.name;

  /* ==========================
     MAIN CHART
  ========================== */
  const ctx = document.getElementById('currencyChart').getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradient.addColorStop(1, 'rgba(18,21,28,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Price',
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

  /* ==========================
     FETCH HELPERS
  ========================== */
  async function fetchSeries(pair, limit = null) {
    let q = '';
    if (currentRange !== 'all' && !limit) {
      const d = new Date(Date.now() - currentRange * 86400000)
        .toISOString().split('T')[0];
      q += `&rate_date=gte.${d}`;
    }
    if (limit) q += `&limit=${limit}`;

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${q}&order=rate_date.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    return await r.json();
  }

  async function fetchLastTwo(pair) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=value&pair=eq.${pair}&order=rate_date.desc&limit=2`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    return await r.json();
  }

  /* ==========================
     HEADER UPDATE
  ========================== */
  async function updateHeader(pair) {
    const d = await fetchLastTwo(pair);
    if (!d.length) return;

    const last = +d[0].value;
    const prev = d[1] ? +d[1].value : null;

    productPrice.textContent = last.toFixed(2);

    if (prev) {
      const ch = ((last - prev) / prev) * 100;
      productChange.textContent = `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`;
      productPrice.className  = `price ${ch >= 0 ? 'up' : 'down'}`;
      productChange.className = `change ${ch >= 0 ? 'up' : 'down'}`;
    }
  }

  /* ==========================
     HITOS → ANNOTATIONS
  ========================== */
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
        borderDash: [2, 4],

        label: {
          display: false,
          content: `${h.texto} · ${values[idx].toFixed(2)}`,
          backgroundColor: 'rgba(139,0,0,0.9)',
          color: '#fff',
          font: { size: 11, weight: '500' },
          padding: 6,
          position: 'start'
        },

        enter({ element }) {
          element.label.options.display = true;
          return true;
        },
        leave({ element }) {
          element.label.options.display = false;
          return true;
        }
      };
    });

    return annotations;
  }

  /* ==========================
     SIDEBAR + SPARKLINES
  ========================== */
  async function updateSidebar() {
  tickers.forEach(async t => {

    const pair = t.dataset.pair;
    const deltaEl = t.querySelector('.delta');
    const canvas  = t.querySelector('.sparkline');
    const sctx    = canvas.getContext('2d');

    /* ===== PRECIO ACTUAL (HOY vs AYER) ===== */
    const lastTwo = await fetchLastTwo(pair);
    if (!lastTwo.length) return;

    const last = +lastTwo[0].value;
    const prev = lastTwo[1] ? +lastTwo[1].value : null;

    let ch = 0;
    let cls = 'neutral';

    if (prev !== null) {
      ch = ((last - prev) / prev) * 100;
      cls = ch > 0 ? 'up' : ch < 0 ? 'down' : 'neutral';
    }

    deltaEl.textContent =
      `${last.toFixed(2)} · ${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`;
    deltaEl.className = `delta ${cls}`;

    /* ===== SPARKLINE (HISTÓRICO) ===== */
    const series = await fetchSeries(pair, 30);
    if (series.length < 2) return;

    const values = series.map(x => +x.value);

    new Chart(sctx, {
      type: 'line',
      data: {
        labels: values.map((_, i) => i),
        datasets: [{
          data: values,
          borderColor: cls === 'up'
            ? '#1a7f37'
            : cls === 'down'
            ? '#b42318'
            : '#6b7280',
          borderWidth: 1,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });

  });
}


  /* ==========================
     MAIN CHART UPDATE
  ========================== */
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

  /* ==========================
     EVENTS
  ========================== */
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

  /* ==========================
     INIT
  ========================== */
  updateChart();
  updateSidebar();

});
