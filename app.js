document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'TU_PUBLIC_KEY_AQUI';

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

  const ctx = document.getElementById('currencyChart').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#12151c', tension: 0.25, pointRadius: 0 }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, annotation: { annotations: {} } },
      scales: { x: { grid: { display: false } }, y: { position: 'right' } }
    }
  });

  async function fetchSeries(pair) {

    let query = '';
    let order = 'rate_date.desc';
    let limit = 1000;

    if (currentRange !== 'all') {
      const days = parseInt(currentRange, 10);
      const fromDate = new Date(Date.now() - days * 86400000)
        .toISOString().split('T')[0];
      query += `&rate_date=gte.${fromDate}`;
      order = 'rate_date.asc';
    } else {
      limit = 3000;
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${query}&order=${order}&limit=${limit}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );

    const data = await response.json();
    return currentRange === 'all' ? data.reverse() : data;
  }

  async function updateChart() {
    const d = await fetchSeries(primaryPair);
    if (!d.length) return;

    chart.data.labels = d.map(x => x.rate_date);
    chart.data.datasets[0].data = d.map(x => +x.value);
    chart.update();
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
