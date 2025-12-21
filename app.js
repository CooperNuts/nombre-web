document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     CONFIGURACIÓN SUPABASE
  ========================== */
  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let currentPair = 'USDLB_STD';
  let currentRange = 'all';

  /* =========================
     CHART.JS SETUP
  ========================== */
  const canvas = document.getElementById('currencyChart');
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradient.addColorStop(1, 'rgba(18,21,28,0)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#12151c',     // casi negro
        backgroundColor: gradient,
        borderWidth: 0.6,           // línea ultrafina
        tension: 0.28,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3
      }]
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
          enabled: true,
          backgroundColor: '#12151c',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const d = new Date(items[0].label);
              return d.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            },
            label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`
          }
        }
      },

      scales: {
        x: { grid: { display: false } },
        y: {
          position: 'right',
          grid: { color: '#eee' },
          ticks: {
            callback: v => `$${v.toFixed(2)}`
          }
        }
      }
    }
  });

  /* =========================
     CARGA DE DATOS DEL GRÁFICO
  ========================== */
  async function loadChartData() {

    let rangeFilter = '';
    if (currentRange !== 'all') {
      const fromDate = new Date(Date.now() - currentRange * 86400000)
        .toISOString()
        .split('T')[0];
      rangeFilter = `&rate_date=gte.${fromDate}`;
    }

    const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${currentPair}${rangeFilter}&order=rate_date.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await res.json();
    if (!data.length) return;

    const labels = data.map(d => d.rate_date);
    const values = data.map(d => Number(d.value));

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    // Auto-scale estilo XE
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15 || 0.1;

    chart.options.scales.y.min = min - pad;
    chart.options.scales.y.max = max + pad;
    chart.update();

    // Precio grande + % diario
    const last = values.at(-1);
    const prev = values.at(-2) ?? last;
    const change = ((last - prev) / prev) * 100;

    document.getElementById('productPrice').textContent = `$${last.toFixed(2)}`;

    const changeEl = document.getElementById('productChange');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeEl.className = `change ${change >= 0 ? 'pos' : 'neg'}`;
  }

  /* =========================
     % DIARIO EN SIDEBAR
  ========================== */
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

      // ⚠️ Colores invertidos como pediste
      deltaEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
      deltaEl.className = `delta ${change >= 0 ? 'pos' : 'neg'}`;
    });
  }

  /* =========================
     EVENTOS
  ========================== */
  document.querySelectorAll('.ticker').forEach(ticker => {
    ticker.addEventListener('click', () => {
      document.querySelectorAll('.ticker').forEach(t => t.classList.remove('active'));
      ticker.classList.add('active');

      currentPair = ticker.dataset.pair;
      document.getElementById('productTitle').textContent = ticker.dataset.name;

      loadChartData();
    });
  });

  document.querySelectorAll('.ranges button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ranges button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentRange = btn.dataset.range;
      loadChartData();
    });
  });

  /* =========================
     INICIALIZACIÓN
  ========================== */
  document.getElementById('productTitle').textContent =
    document.querySelector('.ticker.active').dataset.name;

  loadSidebarChanges();
  loadChartData();
});
