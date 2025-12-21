document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     CONFIGURACIÓN SUPABASE
  ========================== */
  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let comparePair = null;
  let currentRange = 'all';

  /* =========================
     CHART.JS SETUP
  ========================== */
  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradientPrimary = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientPrimary.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradientPrimary.addColorStop(1, 'rgba(18,21,28,0)');

  const gradientCompare = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientCompare.addColorStop(0, 'rgba(120,124,135,0.10)');
  gradientCompare.addColorStop(1, 'rgba(120,124,135,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Principal',
          data: [],
          borderColor: '#12151c',
          backgroundColor: gradientPrimary,
          borderWidth: 0.6,
          tension: 0.28,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 3
        },
        {
          label: 'Comparación',
          data: [],
          borderColor: '#7a7f8a',
          backgroundColor: gradientCompare,
          borderWidth: 0.6,
          tension: 0.28,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 3,
          hidden: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: 'index',
        intersect: false
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false,
          callbacks: {
            title: items => {
              const d = new Date(items[0].label);
              return d.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            },
            label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`
          }
        }
      },

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

  /* =========================
     FETCH DATOS
  ========================== */
  async function fetchSeries(pair) {

    let rangeFilter = '';
    if (currentRange !== 'all') {
      const fromDate = new Date(Date.now() - currentRange * 86400000)
        .toISOString().split('T')[0];
      rangeFilter = `&rate_date=gte.${fromDate}`;
    }

    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${rangeFilter}&order=rate_date.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    return await res.json();
  }

  /* =========================
     ACTUALIZAR GRÁFICO
  ========================== */
  async function updateChart() {

    const primaryData = await fetchSeries(primaryPair);
    if (!primaryData.length) return;

    const labels = primaryData.map(d => d.rate_date);
    const primaryValues = primaryData.map(d => Number(d.value));

    chart.data.labels = labels;
    chart.data.datasets[0].data = primaryValues;

    let allValues = [...primaryValues];

    if (comparePair) {
      const compareData = await fetchSeries(comparePair);
      const map = Object.fromEntries(compareData.map(d => [d.rate_date, Number(d.value)]));
      const compareValues = labels.map(l => map[l] ?? null);

      chart.data.datasets[1].data = compareValues;
      chart.data.datasets[1].hidden = false;

      allValues = allValues.concat(compareValues.filter(v => v !== null));
    } else {
      chart.data.datasets[1].hidden = true;
    }

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.15 || 0.1;

    chart.options.scales.y.min = min - pad;
    chart.options.scales.y.max = max + pad;
    chart.update();
  }

  /* =========================
     EVENTOS SIDEBAR
  ========================== */
  document.querySelectorAll('.ticker').forEach(ticker => {

    ticker.querySelector('.label').textContent = ticker.dataset.name;

    ticker.addEventListener('click', (e) => {

      if (e.ctrlKey || e.metaKey) {
        comparePair = comparePair === ticker.dataset.pair ? null : ticker.dataset.pair;
      } else {
        primaryPair = ticker.dataset.pair;
        comparePair = null;

        document.querySelectorAll('.ticker')
          .forEach(t => t.classList.remove('active'));

        ticker.classList.add('active');
        document.getElementById('productTitle').textContent = ticker.dataset.name;
      }

      updateChart();
    });
  });

  /* =========================
     RANGOS
  ========================== */
  document.querySelectorAll('.ranges button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ranges button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      updateChart();
    });
  });

  /* =========================
     INIT
  ========================== */
  document.getElementById('productTitle').textContent =
    document.querySelector('.ticker.active').dataset.name;

  updateChart();
});
