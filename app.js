document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';

  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA';

  let primaryColumn = 'usdlb_std';

  const hitos = [
    { fecha: '2023-10-02', texto: 'Op. C23' },
    { fecha: '2024-09-30', texto: 'Op. C24' },
    { fecha: '2025-09-29', texto: 'Op. C25' }
  ];

  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');
  const tickers = document.querySelectorAll('.ticker');

  // labels de tickers
  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;
  });

  const activeTicker = document.querySelector('.ticker.active');
  if (activeTicker) {
    primaryColumn = activeTicker.dataset.column;
    productTitle.textContent = activeTicker.dataset.name;
  }

  // annotation plugin
  if (window['chartjs-plugin-annotation']) {
    Chart.register(window['chartjs-plugin-annotation']);
  }

  const ctx = document.getElementById('currencyChart').getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradient.addColorStop(1, 'rgba(18,21,28,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'USDLB STD',
          data: [],
          borderColor: '#12151c',
          backgroundColor: gradient,
          borderWidth: 0.8,
          fill: true,
          tension: 0.28,
          pointRadius: 0
        },
        {
          label: 'USDLB LARGE',
          data: [],
          borderColor: '#5a0000',
          borderWidth: 0.8,
          fill: false,
          tension: 0.28,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },

      plugins: {
        legend: { display: true },

        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: true,
          callbacks: {
            label: ctx =>
              `${ctx.dataset.label}: ${Number(ctx.raw.y).toFixed(2)}`
          }
        },

        annotation: {
          annotations: hitos.reduce((acc, h, i) => {
            acc['hito_' + i] = {
              type: 'line',
              xMin: new Date(h.fecha),
              xMax: new Date(h.fecha),
              borderColor: 'rgba(90,0,0,0.6)',
              borderWidth: 1,
              label: {
                display: true,
                content: h.texto
              }
            };
            return acc;
          }, {})
        }
      },

      // 🔥 FIX REAL DEL PROBLEMA
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month'
          },
          grid: { display: false }
        },
        y: {
          position: 'right',
          grace: '15%',
          ticks: {
            callback: value => Number(value).toFixed(2)
          }
        }
      }
    }
  });

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

  async function updateChart() {
    const data = await fetchData();
    if (!data.length) return;

    const sorted = data.sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    // 🔥 CAMBIO CLAVE: usar objetos {x,y}
    chart.data.datasets[0].data = sorted.map(x => ({
      x: new Date(x.fecha),
      y: Number(x.usdlb_std)
    }));

    chart.data.datasets[1].data = sorted.map(x => ({
      x: new Date(x.fecha),
      y: Number(x.usdlb_large)
    }));

    chart.update();

    updateHeader(sorted);
    updateAllTickers(sorted);
  }

  function updateHeader(data) {
    if (data.length < 1) return;

    const last = Number(data[data.length - 1][primaryColumn]);
    const prev = Number(data[data.length - 2]?.[primaryColumn]);

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

  function updateAllTickers(data) {

    tickers.forEach(t => {

      const col = t.dataset.column;

      const last = Number(data[data.length - 1]?.[col]);
      const prev = Number(data[data.length - 2]?.[col]);

      if (isNaN(last) || isNaN(prev)) return;

      const ch = ((last - prev) / prev) * 100;
      const arrow = ch >= 0 ? '▲' : '▼';

      t.querySelector('.delta').textContent =
        `${arrow} ${Math.abs(ch).toFixed(2)}%`;
    });
  }

  tickers.forEach(t => {
    t.addEventListener('click', () => {

      tickers.forEach(x => x.classList.remove('active'));
      t.classList.add('active');

      primaryColumn = t.dataset.column;

      productTitle.textContent = t.dataset.name;

      updateChart();
    });
  });

  updateChart();

});
