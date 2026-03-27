document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let globalData = [];
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

  // 👉 Inicializar labels
  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;
  });

  productTitle.textContent =
    document.querySelector('.ticker.active').dataset.name;

  const ctx = document.getElementById('currencyChart').getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradient.addColorStop(1, 'rgba(18,21,28,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Price',
          data: [],
          borderColor: '#12151c',
          backgroundColor: gradient,
          borderWidth: 0.8,
          fill: true,
          tension: 0.28,
          pointRadius: 0
        },
        {
          label: 'Hitos',
          data: [],
          showLine: false,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: '#6b0f1a',
          pointBorderColor: '#4a0710',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true },
      plugins: {
        legend: { display: true },
        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false,
          callbacks: {
            label: function(context) {
              if (context.dataset.label === 'Hitos') {
                return context.raw.hito + ' — ' + context.raw.y.toFixed(2);
              }
              return context.raw?.toFixed(2);
            }
          }
        },
        annotation: { annotations: {} }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          position: 'right',
          grace: '15%',
          beginAtZero: false
        }
      }
    }
  });

  // 🔌 FETCH ÚNICO (tabla pistachio1)
  async function fetchAllData() {
    let url = `${SUPABASE_URL}/rest/v1/pistachio1?select=*&order=fecha.asc`;

    if (currentRange !== 'all') {
      const days = parseInt(currentRange, 10);
      const fromDate = new Date(Date.now() - days * 86400000)
        .toISOString()
        .split('T')[0];

      url += `&fecha=gte.${fromDate}`;
    }

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) return [];

    return await res.json();
  }

  function buildHitos(labels, values) {
    const annotations = [];
    const puntos = [];

    hitos.forEach(h => {
      const idx = labels.findIndex(l => l >= h.fecha);
      if (idx === -1) return;

      const precio = values[idx];
      if (precio == null) return;

      puntos.push({ x: labels[idx], y: precio, hito: h.texto });

      annotations.push({
        type: 'line',
        xMin: labels[idx],
        xMax: labels[idx],
        borderColor: 'rgba(139,0,0,0.2)',
        borderWidth: 1,
        borderDash: [2, 4]
      });
    });

    chart.data.datasets[1].data = puntos;

    return annotations.reduce((obj, item, i) => {
      obj[`hito_${i}`] = item;
      return obj;
    }, {});
  }

  function updateChart() {
    if (!globalData.length) return;

    const active = document.querySelector('.ticker.active');
    const column = active.dataset.column;

    const labels = globalData.map(d => d.fecha);
    const values = globalData.map(d => parseFloat(d[column]));

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    chart.options.plugins.annotation.annotations =
      buildHitos(labels, values);

    chart.update();

    updateHeader();
  }

  function updateHeader() {
    if (globalData.length < 1) return;

    const active = document.querySelector('.ticker.active');
    const column = active.dataset.column;

    const last = parseFloat(globalData.at(-1)[column]);
    const prev = parseFloat(globalData.at(-2)?.[column]);

    if (isNaN(last)) return;

    productPrice.textContent = last.toFixed(2);

    if (!isNaN(prev)) {
      const ch = ((last - prev) / prev) * 100;
      const arrow = ch >= 0 ? '▲' : '▼';

      productChange.textContent =
        `${arrow} ${Math.abs(ch).toFixed(2)}%`;
    }
  }

  function updateAllTickers() {
    if (globalData.length < 2) return;

    const last = globalData.at(-1);
    const prev = globalData.at(-2);

    tickers.forEach(t => {
      const column = t.dataset.column;

      const v1 = parseFloat(last[column]);
      const v2 = parseFloat(prev[column]);

      if (isNaN(v1) || isNaN(v2)) return;

      const ch = ((v1 - v2) / v2) * 100;
      const arrow = ch >= 0 ? '▲' : '▼';

      t.querySelector('.delta').textContent =
        `${arrow} ${Math.abs(ch).toFixed(2)}%`;
    });
  }

  // 🎯 EVENTOS TICKERS
  tickers.forEach(t => {
    t.addEventListener('click', () => {
      tickers.forEach(x => x.classList.remove('active'));
      t.classList.add('active');

      productTitle.textContent = t.dataset.name;

      updateChart();
    });
  });

  // 📅 RANGOS
  document.querySelectorAll('.ranges button').forEach(b => {
    b.addEventListener('click', async () => {
      document.querySelectorAll('.ranges button')
        .forEach(x => x.classList.remove('active'));

      b.classList.add('active');
      currentRange = b.dataset.range;

      globalData = await fetchAllData();

      updateAllTickers();
      updateChart();
    });
  });

  // 🚀 INIT
  async function init() {
    globalData = await fetchAllData();

    if (!globalData.length) return;

    updateAllTickers();
    updateChart();
  }

  init();

});
