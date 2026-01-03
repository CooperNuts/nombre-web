document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let comparePair = null;
  let currentRange = 'all';

  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradientMain = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientMain.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradientMain.addColorStop(1, 'rgba(18,21,28,0)');

  const gradientCompare = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientCompare.addColorStop(0, 'rgba(120,124,135,0.1)');
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
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { position: 'right' }
      }
    }
  });

  // ----- Precio dinámico en card central (solo número) -----
  const productPriceEl = document.getElementById('productPrice');
  const lastPriceMap = {};

  async function fetchLatestPrice(pair) {
    const url = `${SUPABASE_URL}/rest/v1/us_std?select=value&pair=eq.${pair}&order=rate_date.desc&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await res.json();
    return data.length ? Number(data[0].value) : null;
  }

  async function updateCardPrice(pair) {
    const newPrice = await fetchLatestPrice(pair);
    if (newPrice === null) {
      productPriceEl.textContent = 'N/A';
      productPriceEl.className = 'price neutral';
      return;
    }

    const lastPrice = lastPriceMap[pair];

    if (lastPrice === undefined) {
      productPriceEl.className = 'price neutral';
    } else if (newPrice > lastPrice) {
      productPriceEl.className = 'price up';
    } else if (newPrice < lastPrice) {
      productPriceEl.className = 'price down';
    } else {
      productPriceEl.className = 'price neutral';
    }

    // Mostramos solo el número
    productPriceEl.textContent = newPrice.toFixed(2);
    lastPriceMap[pair] = newPrice;
  }

  // ----- Funciones existentes -----
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
    const mainValues = mainData.map(d => Number(d.value));

    chart.data.labels = labels;
    chart.data.datasets[0].data = mainValues;

    let allValues = [...mainValues];

    if (comparePair) {
      const compData = await fetchSeries(comparePair);
      const map = Object.fromEntries(compData.map(d => [d.rate_date, Number(d.value)]));
      const compValues = labels.map(l => map[l] ?? null);

      chart.data.datasets[1].data = compValues;
      chart.data.datasets[1].hidden = false;
      allValues.push(...compValues.filter(v => v !== null));
    } else {
      chart.data.datasets[1].hidden = true;
    }

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.15 || 0.1;

    chart.options.scales.y.min = min - pad;
    chart.options.scales.y.max = max + pad;

    chart.update();

    // ----- Actualizamos el precio en la card central -----
    updateCardPrice(primaryPair);
  }

  async function loadSidebarChanges() {
    document.querySelectorAll('.ticker').forEach(async ticker => {

      ticker.querySelector('.label').textContent = ticker.dataset.name;

      const url = `${SUPABASE_URL}/rest/v1/us_std?select=value&pair=eq.${ticker.dataset.pair}&order=rate_date.desc&limit=2`;

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      const data = await res.json();
      if (data.length < 2) return;

      const change = ((data[0].value - data[1].value) / data[1].value) * 100;
      const deltaEl = ticker.querySelector('.delta');

      deltaEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
      deltaEl.className = `delta ${change >= 0 ? 'pos' : 'neg'}`;
    });
  }

  document.querySelectorAll('.ticker').forEach(ticker => {

    const checkbox = ticker.querySelector('.compare-checkbox');
    const pair = ticker.dataset.pair;

    ticker.addEventListener('click', (e) => {

      if (e.target.classList.contains('compare-checkbox')) return;

      document.querySelectorAll('.ticker').forEach(t => t.classList.remove('active'));
      ticker.classList.add('active');

      primaryPair = pair;
      comparePair = null;

      document.querySelectorAll('.compare-checkbox').forEach(cb => cb.checked = false);

      document.getElementById('productTitle').textContent = ticker.dataset.name;
      updateChart();
    });

    checkbox.addEventListener('change', () => {

      document.querySelectorAll('.compare-checkbox').forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
      });

      comparePair = checkbox.checked ? pair : null;
      updateChart();
    });
  });

  document.querySelectorAll('.ranges button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ranges button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      updateChart();
    });
  });

  document.getElementById('productTitle').textContent =
    document.querySelector('.ticker.active').dataset.name;

  loadSidebarChanges();
  updateChart();

});
