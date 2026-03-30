document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';

  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA';

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
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { position: 'right', grace: '15%' }
      }
    }
  });

  // 🔥 FIX CRÍTICO: asegurar render correcto del chart
  setTimeout(() => {
    chart.resize();
  }, 0);

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

    const labels = sorted.map(x => x.fecha);

    // 🔥 Validación numérica
    const values = sorted.map(x => {
      const v = Number(x[primaryColumn]);
      return isNaN(v) ? null : v;
    });

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    chart.update();
    chart.resize(); // 🔥 asegura render correcto

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
