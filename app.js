document.addEventListener('DOMContentLoaded', () => {

  // ==============================
  // CONFIG
  // ==============================
  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nJNjTlpkRxQtA';

  // ==============================
  // HITOS
  // ==============================
  const hitos = [
    { fecha: '2023-10-02', texto: 'Op. C23' },
    { fecha: '2024-09-30', texto: 'Op. C24' },
    { fecha: '2025-09-29', texto: 'Op. C25' }
  ];

  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');

  // ==============================
  // ANNOTATIONS
  // ==============================
  if (window['chartjs-plugin-annotation']) {
    Chart.register(window['chartjs-plugin-annotation']);
  }

  // ==============================
  // CHART
  // ==============================
  const ctx = document.getElementById('currencyChart').getContext('2d');

  const gradient1 = ctx.createLinearGradient(0, 0, 0, 360);
  gradient1.addColorStop(0, 'rgba(18,21,28,0.15)');
  gradient1.addColorStop(1, 'rgba(18,21,28,0)');

  const gradient2 = ctx.createLinearGradient(0, 0, 0, 360);
  gradient2.addColorStop(0, 'rgba(90,0,0,0.12)');
  gradient2.addColorStop(1, 'rgba(90,0,0,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'USDLB STD',
          data: [],
          borderColor: '#12151c',
          backgroundColor: gradient1,
          borderWidth: 1,
          fill: true,
          tension: 0.28,
          pointRadius: 0
        },
        {
          label: 'USDLB LARGE',
          data: [],
          borderColor: '#5a0000',
          backgroundColor: gradient2,
          borderWidth: 1,
          fill: true,
          tension: 0.28,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: true },

        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: true,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${Number(context.raw).toFixed(2)}`;
            }
          }
        },

        annotation: {
          annotations: hitos.reduce((acc, h, i) => {
            acc['hito_' + i] = {
              type: 'line',
              xMin: h.fecha,
              xMax: h.fecha,
              borderColor: 'rgba(90, 0, 0, 0.5)',
              borderWidth: 1,
              label: {
                display: true,
                content: h.texto,
                position: 'start',
                color: '#5a0000',
                backgroundColor: 'rgba(255,255,255,0.8)'
              }
            };
            return acc;
          }, {})
        }
      },

      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          position: 'right',
          grace: '15%',
          ticks: {
            callback: function(value) {
              return Number(value).toFixed(2);
            }
          }
        }
      }
    }
  });

  // ==============================
  // FETCH
  // ==============================
  async function fetchData() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pistachio1?select=*`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error('❌ Error Supabase:', data);
        return [];
      }

      return data;

    } catch (err) {
      console.error('❌ Fetch error:', err);
      return [];
    }
  }

  // ==============================
  // UPDATE CHART
  // ==============================
  async function updateChart() {
    const data = await fetchData();
    if (!data.length) return;

    const sorted = data.sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    const labels = sorted.map(x => x.fecha.split('T')[0]);

    const stdValues = sorted.map(x => Number(x.usdlb_std));
    const largeValues = sorted.map(x => Number(x.usdlb_large));

    chart.data.labels = labels;

    chart.data.datasets[0].data = stdValues;
    chart.data.datasets[1].data = largeValues;

    chart.update();

    updateHeader(sorted);
  }

  // ==============================
  // HEADER (usa STD como referencia)
  // ==============================
  function updateHeader(data) {
    if (data.length < 1) return;

    const last = Number(data[data.length - 1].usdlb_std);
    const prev = Number(data[data.length - 2]?.usdlb_std);

    if (isNaN(last)) return;

    productPrice.textContent = last.toFixed(2);

    if (!isNaN(prev)) {
      const ch = ((last - prev) / prev) * 100;
      const arrow = ch >= 0 ? '▲' : '▼';

      productChange.textContent =
        `${arrow} ${Math.abs(ch).toFixed(2)}%`;

      productPrice.className  = `price ${ch >= 0 ? 'up' : 'down'}`;
      productChange.className = `change ${ch >= 0 ? 'up' : 'down'}`;
    }
  }

  // ==============================
  // INIT
  // ==============================
  updateChart();

});
