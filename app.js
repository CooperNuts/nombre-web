document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  const hitos = [
    { fecha: '2023-06-01' },
    { fecha: '2023-09-15' },
    { fecha: '2023-12-20' }
  ];

  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'USD / LB',
        data: [],
        borderColor: '#12151c',
        borderWidth: 0.8,
        tension: 0.28,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: { annotations: {} },
        tooltip: {
          callbacks: {
            label: ctx => Number(ctx.parsed.y).toFixed(2)
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { position: 'right' }
      }
    }
  });

  function buildHitos(labels, values) {
    const annotations = {};

    hitos.forEach((h, i) => {
      const idx = labels.indexOf(h.fecha);
      if (idx === -1) return;

      annotations[`hito_${i}`] = {
        type: 'line',
        xMin: h.fecha,
        xMax: h.fecha,
        borderColor: 'rgba(139,0,0,0.4)',
        borderWidth: 0.6,
        borderDash: [2, 4],
        label: {
          enabled: true,
          content: values[idx].toFixed(2),
          position: 'start',
          backgroundColor: 'rgba(139,0,0,0.85)',
          color: '#fff',
          font: { size: 9 },
          padding: 3
        }
      };
    });

    return annotations;
  }

  async function fetchSeries() {
    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.USDLB_STD&order=rate_date.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    return res.json();
  }

  async function updateChart() {
    const data = await fetchSeries();
    if (!data.length) return;

    const labels = data.map(d => d.rate_date);
    const values = data.map(d => Number(d.value));

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.options.plugins.annotation.annotations =
      buildHitos(labels, values);

    chart.update();
  }

  updateChart();
});
