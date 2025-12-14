// Archivo preparado para futuras integraciones con APIs financieras
console.log("Web de cotizaciones cargada correctamente");

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
    plugins: {
      legend: { display: false }
    }
  }
});
const SUPABASE_URL = 'https://TU_PROJECT_URL.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY';

async function loadChartData() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.USDLB&order=rate_date.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  const data = await response.json();

  console.log('Datos Supabase:', data);

  chart.data.labels = data.map(row => row.rate_date);
  chart.data.datasets[0].data = data.map(row => row.value);

  chart.update();
}

loadChartData();
