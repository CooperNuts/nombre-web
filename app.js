document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(31,79,216,0.18)');
  gradient.addColorStop(1, 'rgba(31,79,216,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#1f4fd8',
        backgroundColor: gradient,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          position: 'right',
          grid: { color: '#eee' },
          ticks: { callback: v => `$${v.toFixed(2)}` }
        }
      }
    }
  });

  async function loadChart(pair) {
    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}&order=rate_date.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await res.json();
    if (!data.length) return;

    chart.data.labels = data.map(d => d.rate_date);
    chart.data.datasets[0].data = data.map(d => Number(d.value));

    const values = chart.data.datasets[0].data;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.1 || 0.05;

    chart.options.scales.y.min = min - pad;
    chart.options.scales.y.max = max + pad;

    chart.update();
  }

  // 🔹 Click en el menú
  document.querySelectorAll('.ticker').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.ticker').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const pair = item.dataset.pair;
      loadChart(pair);
    });
  });

  // 🔹 Carga inicial
  loadChart('USDLB_STD');

});
