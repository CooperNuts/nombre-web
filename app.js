console.log("Web de cotizaciones cargada correctamente");

const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU_PUBLIC_ANON_KEY';

const canvas = document.getElementById('currencyChart');
const ctx = canvas.getContext('2d');

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      borderColor: '#1f4fd8',
      backgroundColor: 'rgba(31,79,216,0.12)',
      tension: 0.45,
      fill: true,
      pointRadius: 0
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  }
});

async function loadChartData() {
  const url = `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.USDLB&order=rate_date.asc`;

  console.log('Fetching:', url);

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await response.json();
  console.log('Datos Supabase:', data);

  chart.data.labels = data.map(r => r.rate_date);
  chart.data.datasets[0].data = data.map(r => Number(r.value));
  chart.update();
}

loadChartData();
