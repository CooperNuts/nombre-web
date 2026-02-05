document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let currentRange = 'all';

  const hitos = [
    { fecha: '2024-09-30', texto: 'Opening C24, 3.75' },
    { fecha: '2025-09-29', texto: 'Op. C25, 4.10' }
  ];

  /* ---------- UI ---------- */
  const productTitle = document.getElementById('productTitle');
  const productPrice = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');

  document.querySelectorAll('.ticker').forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;
  });

  productTitle.textContent =
    document.querySelector('.ticker.active').dataset.name;

  /* ---------- CHART ---------- */
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

  /* ---------- DATA ---------- */
  async function fetchSeries(pair) {
    let range = '';
    if (currentRange !== 'all') {
      const d = new Date(Date.now() - currentRange * 86400000)
        .toISOString().split('T')[0];
      range = `&rate_date=gte.${d}`;
    }

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${range}&order=rate_date.asc`,
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

  /* ---------- UPDATE ---------- */
  async function updateHeader(pair) {
    const d = await fetchLastTwo(pair);
    if (!d.length) return;

    const last = +d[0].value;
    const prev = d[1] ? +d[1].value : null;

    productPrice.textContent = last.toFixed(2);

    if (prev) {
      const ch = ((last - prev) / prev) * 100;
      productChange.textContent = `${ch>=0?'+':''}${ch.toFixed(2)}%`;
      productPrice.className = `price ${ch>0?'up':'down'}`;
      productChange.className = `change ${ch>0?'up':'down'}`;
    }
  }

  async function updateSidebar() {
    document.querySelectorAll('.ticker').forEach(async t => {
      const d = await fetchLastTwo(t.dataset.pair);
      if (!d.length) return;

      const last = +d[0].value;
      const prev = d[1] ? +d[1].value : null;

      let cls = 'neutral';
      let txt = last.toFixed(2);

      if (prev) {
        const ch = ((last - prev) / prev) * 100;
        cls = ch>0?'up':ch<0?'down':'neutral';
        txt += ` · ${ch>=0?'+':''}${ch.toFixed(2)}%`;
      }

      t.querySelector('.delta').textContent = txt;
      t.querySelector('.delta').className = `delta ${cls}`;
    });
  }

  async function updateChart() {
    const d = await fetchSeries(primaryPair);
    if (!d.length) return;

    chart.data.labels = d.map(x=>x.rate_date);
    chart.data.datasets[0].data = d.map(x=>+x.value);

    chart.update();
    updateHeader(primaryPair);
  }

  /* ---------- EVENTS ---------- */
  document.querySelectorAll('.ticker').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.ticker').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      primaryPair = t.dataset.pair;
      productTitle.textContent = t.dataset.name;
      updateChart();
    });
  });

  document.querySelectorAll('.ranges button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.ranges button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentRange = b.dataset.range;
      updateChart();
    });
  });

  /* ---------- INIT ---------- */
  updateChart();
  updateSidebar();

});
