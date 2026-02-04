document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let comparePair = null;
  let currentRange = 'all';

  // 🔹 HITOS
  const hitos = [
    { fecha: '2024-09-30', texto: 'Opening C24, 3.75' },
    { fecha: '2025-09-29', texto: 'Op. C25, 4.10' }
  ];

  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradientMain = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientMain.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradientMain.addColorStop(1, 'rgba(18,21,28,0)');

  const gradientCompare = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientCompare.addColorStop(0, 'rgba(120,124,135,0.1)');
  gradientCompare.addColorStop(1, 'rgba(120,124,135,0)');

  // Chart
  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        annotation: { annotations: {} },
        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false,
          callbacks: {
            title: items => new Date(items[0].label).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
            label: ctx => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(2)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { position: 'right', grace: '15%', ticks: { precision: 2, callback: v => Number(v).toFixed(2) } }
      }
    },
    plugins: [Chart.registry.getPlugin('annotation')]
  });

  async function fetchSeries(pair) {
    let rangeFilter = '';
    if (currentRange !== 'all') {
      const fromDate = new Date(Date.now() - currentRange * 86400000).toISOString().split('T')[0];
      rangeFilter = `&rate_date=gte.${fromDate}`;
    }
    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${rangeFilter}&order=rate_date.asc`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    return await res.json();
  }

  function buildAnnotations(labels, values) {
    const annotations = {};
    hitos.forEach((h, i) => {
      // Buscar índice más cercano
      let closestIndex = 0, minDiff = Infinity;
      labels.forEach((l, idx) => {
        const diff = Math.abs(new Date(l) - new Date(h.fecha));
        if (diff < minDiff) { minDiff = diff; closestIndex = idx; }
      });

      annotations[`hito_${i}`] = {
        type: 'line',
        xMin: labels[closestIndex],
        xMax: labels[closestIndex],
        borderColor: 'rgba(139,0,0,0.35)',
        borderWidth: 0.6,
        borderDash: [2, 4],
        label: {
          enabled: false,
          position: 'start',
          backgroundColor: 'rgba(139,0,0,0.85)',
          color: '#fff',
          font: { size: 9, weight: '500' },
          padding: 4,
          content: `${values[closestIndex].toFixed(2)} – ${h.texto}`,
          display: ctx => ctx.hovered
        }
      };
    });
    return annotations;
  }

  async function updateChart() {
    const mainData = await fetchSeries(primaryPair);
    if (!mainData.length) return;

    const labels = mainData.map(d => d.rate_date);
    const mainValues = mainData.map(d => Number(d.value));

    chart.data.labels = labels;
    chart.data.datasets = [
      { label: 'Principal', data: mainValues, borderColor: '#12151c', backgroundColor: gradientMain, borderWidth: 0.6, tension: 0.28, fill: true, pointRadius: 0, pointHoverRadius: 3 },
      { label: 'Comparación', data: [], borderColor: '#7a7f8a', backgroundColor: gradientCompare, borderWidth: 0.6, tension: 0.28, fill: false, pointRadius: 0, pointHoverRadius: 3, hidden: true }
    ];

    chart.options.plugins.annotation.annotations = buildAnnotations(labels, mainValues);

    const min = Math.min(...mainValues);
    const max = Math.max(...mainValues);
    const pad = (max - min) * 0.15 || 0.1;
    chart.options.scales.y.min = min - pad;
    chart.options.scales.y.max = max + pad;

    chart.update();
  }

  // Inicializar
  updateChart();
});
