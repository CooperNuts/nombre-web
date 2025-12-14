document.addEventListener('DOMContentLoaded', () => {

  console.log("Web de cotizaciones cargada correctamente");

  // 🔹 Supabase
  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  // 🔹 Canvas
  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  // 🔹 Gradiente tipo XE
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(31,79,216,0.18)');
  gradient.addColorStop(1, 'rgba(31,79,216,0)');

  // 🔹 Chart
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
        pointRadius: 0,
        pointHoverRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f4fd8',
          displayColors: false,
          callbacks: {
            label: ctx => `$${ctx.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 6 }
        },
        y: {
          position: 'right',
          grid: { color: '#eee' },
          ticks: {
            callback: v => `$${v.toFixed(2)}`
          }
        }
      }
    }
  });

  // 🔹 Cargar datos desde Supabase
  async function loadChartData() {
    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.USDLB&order=rate_date.asc`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) return;

    chart.data.labels = data.map(r => r.rate_date);
    chart.data.datasets[0].data = data.map(r => Number(r.value));

    // 🔹 Ajuste automático de eje Y (como XE)
    const values = chart.data.datasets[0].data;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 0.05;

    chart.options.scales.y.min = min - padding;
    chart.options.scales.y.max = max + padding;

    chart.update();
  }

  loadChartData();

});
