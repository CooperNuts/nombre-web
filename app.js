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

  let primaryColumn = 'usdlb_std';

  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');
  const tickers = document.querySelectorAll('.ticker');

  // ==============================
  // LABELS TICKERS
  // ==============================
  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;
  });

  const activeTicker = document.querySelector('.ticker.active');
  if (activeTicker) {
    primaryColumn = activeTicker.dataset.column;
    productTitle.textContent = activeTicker.dataset.name;
  }

  // ==============================
  // REGISTER ANNOTATIONS PLUGIN
  // ==============================
  if (window['chartjs-plugin-annotation']) {
    Chart.register(window['chartjs-plugin-annotation']);
  }

  // ==============================
  // CHART INIT
  // ==============================
  const ctx = document.getElementById('currencyChart').getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradient.addColorStop(1, 'rgba(18,21,28,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#12151c',
        backgroundColor: gradient,
        borderWidth: 0.8,
        fill: true,
        tension: 0.28,
        pointRadius: (context) => {
          const label = context.chart.data.labels[context.dataIndex];
          return hitos.some(h => h.fecha === label) ? 5 : 0;
        },
        pointBackgroundColor: (context) => {
          const label = context.chart.data.labels[context.dataIndex];
          return hitos.some(h => h.fecha === label)
            ? '#5a0000'
            : 'transparent';
        },
        pointBorderColor: '#5a0000',
        pointBorderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false
        },
        annotation: {
          annotations: hitos.reduce((acc, h, i) => {
            acc['hito_' + i] = {
              type: 'line',
              xMin: h.fecha,
              xMax: h.fecha,
              borderColor: 'rgba(90, 0, 0, 0.6)',
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
        x: { grid: { display: false } },
        y: { position: 'right', grace: '15%' }
      }
    }
  });

  // ==============================
  // FETCH DATA
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

    // Normalizar fechas (clave para hitos)
    const labels = sorted.map(x => x.fecha.split('T')[0]);
    const values = sorted.map(x => Number(x[primaryColumn]));

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    chart.update();

    updateHeader(sorted);
    updateAllTickers(sorted);
  }

  // ==============================
  // HEADER
  // ==============================
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

  // ==============================
  // TICKERS UPDATE
  // ==============================
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

  // ==============================
  // TICKER SWITCH
  // ==============================
  tickers.forEach(t => {
    t.addEventListener('click', () => {

      tickers.forEach(x => x.classList.remove('active'));
      t.classList.add('active');

      primaryColumn = t.dataset.column;
      productTitle.textContent = t.dataset.name;

      updateChart();
    });
  });

  // ==============================
  // INIT
  // ==============================
  updateChart();

});
