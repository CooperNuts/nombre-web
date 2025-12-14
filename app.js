document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let currentPair = 'USDLB_STD';
  let currentRange = 'all';

  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(31,79,216,0.18)');
  gradient.addColorStop(1, 'rgba(31,79,216,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#0b3ea8', backgroundColor: gradient, borderWidth: 1.5, tension: 0.35, fill: true, pointRadius: 0, pointHoverRadius: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { position: 'right' } }
    }
  });

  async function loadChartData() {

    let rangeFilter = '';
    if (currentRange !== 'all') {
      const fromDate = new Date(Date.now() - currentRange * 86400000)
        .toISOString().split('T')[0];
      rangeFilter = `&rate_date=gte.${fromDate}`;
    }

    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${currentPair}${rangeFilter}&order=rate_date.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await res.json();
    if (!data.length) return;

    const labels = data.map(d => d.rate_date);
    const values = data.map(d => Number(d.value));

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15 || 0.1;

    chart.options.scales.y.min = min - pad;
    chart.options.scales.y.max = max + pad;
    chart.update();

    const last = values.at(-1);
    const prev = values.at(-2) ?? last;
    const change = ((last - prev) / prev) * 100;

    document.getElementById('productPrice').textContent = `$${last.toFixed(2)}`;

    const changeEl = document.getElementById('productChange');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeEl.className = `change ${change >= 0 ? 'pos' : 'neg'}`;
  }

  async function loadSidebarChanges() {
    document.querySelectorAll('.ticker').forEach(async ticker => {
      ticker.querySelector('.label').textContent = ticker.dataset.name;

      const url = `${SUPABASE_URL}/rest/v1/us_std?select=value&pair=eq.${ticker.dataset.pair}&order=rate_date.desc&limit=2`;

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      const data = await res.json();
      if (data.length < 2) return;

      const change = ((data[0].value - data[1].value) / data[1].value) * 100;
      const deltaEl = ticker.querySelector('.delta');

      deltaEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
      deltaEl.className = `delta ${change >= 0 ? 'pos' : 'neg'}`;
    });
  }

  document.querySelectorAll('.ticker').forEach(ticker => {
    ticker.addEventListener('click', () => {
      document.querySelectorAll('.ticker').forEach(t => t.classList.remove('active'));
      ticker.classList.add('active');

      currentPair = ticker.dataset.pair;
      document.getElementById('productTitle').textContent = ticker.dataset.name;
      loadChartData();
    });
  });

  document.querySelectorAll('.ranges button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ranges button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      loadChartData();
    });
  });

  document.getElementById('productTitle').textContent =
    document.querySelector('.ticker.active').dataset.name;

  loadSidebarChanges();
  loadChartData();
});
