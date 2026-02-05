document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let currentRange = 'all';

  const hitos = [
    { fecha: '2024-09-30', texto: 'Opening C24, 3.75' },
    { fecha: '2025-09-29', texto: 'Op. C25, 4.10' }
  ];

  /* ==========================
     UI ELEMENTS
  ========================== */
  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');

  const tickers = document.querySelectorAll('.ticker');

  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;

    // crear canvas sparkline
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

  const gradient = ctx.createLinearGradient(0,0,0,360);
  gradient.addColorStop(0,'rgba(18,21,28,0.12)');
  gradient.addColorStop(1,'rgba(18,21,28,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{
      data: [],
      borderColor: '#12151c',
      backgroundColor: gradient,
      fill: true,
      tension: 0.28,
      pointRadius: 0
    }]},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: { annotations: {} }
      },
      scales: {
        x: { grid: { display: false }},
        y: { position: 'right' }
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
      productChange.textContent = `${ch>=0?'+':''}${ch.toFixed(2)}%`;
      productPrice.className  = `price ${ch>=0?'up':'down'}`;
      productChange.className = `change ${ch>=0?'up':'down'}`;
    }
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

      const data = await fetchSeries(pair, 30);
      if (data.length < 2) return;

      const values = data.map(x => +x.value);
      const last = values.at(-1);
      const prev = values.at(-2);

      const ch = ((last - prev) / prev) * 100;
      const cls = ch>0?'up':ch<0?'down':'neutral';

      deltaEl.textContent =
        `${last.toFixed(2)} · ${ch>=0?'+':''}${ch.toFixed(2)}%`;
      deltaEl.className = `delta ${cls}`;

      // sparkline
      new Chart(sctx, {
        type: 'line',
        data: {
          labels: values.map((_,i)=>i),
          datasets: [{
            data: values,
            borderColor: ch>=0 ? '#1a7f37' : '#b42318',
            borderWidth: 1,
            tension: 0.3,
            pointRadius: 0
          }]
        },
        options: {
          responsive: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false }},
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

    chart.data.labels = d.map(x=>x.rate_date);
    chart.data.datasets[0].data = d.map(x=>+x.value);
    chart.update();

    updateHeader(primaryPair);
  }

  /* ==========================
     EVENTS
  ========================== */
  tickers.forEach(t => {
    t.addEventListener('click', () => {
      tickers.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      primaryPair = t.dataset.pair;
      productTitle.textContent = t.dataset.name;
      updateChart();
    });
  });

  document.querySelectorAll('.ranges button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.ranges button')
        .forEach(x=>x.classList.remove('active'));
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
