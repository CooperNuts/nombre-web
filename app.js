document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';

  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA';

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

  tickers.forEach(t => {
    t.querySelector('.label').textContent = t.dataset.name;
  });

  const activeTicker = document.querySelector('.ticker.active');
  if (activeTicker) {
    primaryColumn = activeTicker.dataset.column;
    productTitle.textContent = activeTicker.dataset.name;
  }

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
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => Number(ctx.raw).toFixed(2)
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        x: {
          grid: { display: false },
          bounds: 'ticks'
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

    // ==============================
    // ✅ MOSTRAR SOLO ÚLTIMO AÑO
    // ==============================
    const lastDate = new Date(sorted[sorted.length - 1].fecha);
    const cutoff = new Date(lastDate);
    cutoff.setDate(cutoff.getDate() - 365);

    const filtered = sorted.filter(d => new Date(d.fecha) >= cutoff);

    const labels = filtered.map(x => x.fecha);
    const values = filtered.map(x => Number(x[primaryColumn]));

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    // ==============================
    // ✅ HITOS
    // ==============================
    const annotations = {};

    hitos.forEach((hito, i) => {

      const point = sorted.find(d => d.fecha === hito.fecha);
      if (!point) return;

      const yValue = Number(point[primaryColumn]);
      if (isNaN(yValue)) return;

      annotations[`line_${i}`] = {
        type: 'line',
        xMin: hito.fecha,
        xMax: hito.fecha,
        borderColor: 'rgba(139,0,0,0.25)',
        borderWidth: 1
      };

      annotations[`point_${i}`] = {
        type: 'point',
        xValue: hito.fecha,
        yValue: yValue,
        backgroundColor: '#8B0000',
        radius: 4
      };

      annotations[`label_${i}`] = {
        type: 'label',
        xValue: hito.fecha,
        yValue: yValue,
        content: `${hito.texto} · ${yValue.toFixed(2)}`,
        backgroundColor: '#ffffff',
        color: '#8B0000',
        font: {
          size: 10,
          weight: '500'
        },
        padding: 6,
        borderRadius: 4,
        yAdjust: -12
      };

    });

    chart.options.plugins.annotation.annotations = annotations;

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
