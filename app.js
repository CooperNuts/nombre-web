document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let comparePair = null;
  let currentRange = 'all';

  // 🔴 HITOS
  const hitos = [
    { fecha: '2023-06-01', texto: 'Resultados' },
    { fecha: '2023-09-15', texto: 'Regulación' },
    { fecha: '2023-12-20', texto: 'Anuncio' }
  ];

  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradientMain = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientMain.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradientMain.addColorStop(1, 'rgba(18,21,28,0)');

  const gradientCompare = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientCompare.addColorStop(0, 'rgba(120,124,135,0.1)');
  gradientCompare.addColorStop(1, 'rgba(120,124,135,0)');

  // 🧠 Hitos minimalistas + cotización
  function buildHitoAnnotations(labels, values) {
    const annotations = {};

    hitos.forEach((hito, i) => {
      const index = labels.indexOf(hito.fecha);
      if (index === -1 || values[index] == null) return;

      annotations[`hito_${i}`] = {
        type: 'line',
        xMin: hito.fecha,
        xMax: hito.fecha,
        borderColor: 'rgba(139,0,0,0.45)',
        borderWidth: 0.7,
        borderDash: [2, 4],
        label: {
          enabled: true,
          content: `${values[index].toFixed(2)}`,
          position: 'start',
          backgroundColor: 'rgba(139,0,0,0.85)',
          color: '#fff',
          font: { size: 9, weight: '500' },
          padding: 4
        }
      };
    });

    return annotations;
  }

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Principal',
          data: [],
          borderColor: '#12151c',
          backgroundColor: gradientMain,
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
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false }, // tu leyenda izquierda es externa
        annotation: { annotations: {} },
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
            label: ctx =>
              `${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(2)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          position: 'right',
          grace: '15%',
          ticks: {
            precision: 2,
            callback: v => Number(v).toFixed(2)
          }
        }
      }
    }
  });

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

  async function updateChart() {
    const mainData = await fetchSeries(primaryPair);
    if (!mainData.length) return;

    const labels = mainData.map(d => d.rate_date);
    const values = mainData.map(d => Number(d.value));

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    chart.options.plugins.annotation.annotations =
      buildHitoAnnotations(labels, values);

    chart.update();
  }

  document.querySelectorAll('.ranges button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ranges button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      updateChart();
    });
  });

  updateChart();
});
