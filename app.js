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
    data: { labels: [], datasets: [{ data: [], borderColor: '#1f4fd8', backgroundColor: gradient, tension: 0.4, fill: true, pointRadius: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { position: 'right' } }
    }
  });

  async function loadData() {

    let rangeFilter = '';
    if (currentRange !== 'all') {
      rangeFilter = `&rate_date=gte.${new Date(Date.now() - currentRange * 86400000).toISOString().split('T')[0]}`;
    }

    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${currentPair}${rangeFilter}&order=rate_date.asc`;

    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
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

    // 🔹 Precio y % diario
    const last = values.at(-1);
    const prev = values.at(-2) ?? last;
    const change = ((last - prev) / prev) * 100;

    document.getElementById('productPrice').textContent = `$${last.toFixed(2)}`;

    const changeEl = document.getElementById('productChange');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeEl.className = `change ${change >= 0 ? 'pos' : 'neg'}`;
  }

  // 🔹 Productos
  document.querySelectorAll('.ticker').forEach(item => {
    item.textContent = item.dataset.name;
    item.addEventListener('click', () => {
      document.querySelectorAll('.ticker').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentPair = item.dataset.pair;
      document.getElementById('productTitle').textContent = item.dataset.name;
      loadData();
    });
  });

  // 🔹 Rangos
  document.querySelectorAll('.ranges button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ranges button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      loadData();
    });
  });

  // 🔹 Inicial
  document.getElementById('productTitle').textContent =
    document.querySelector('.ticker.active').dataset.name;

  loadData();
});
