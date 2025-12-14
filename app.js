// Archivo preparado para futuras integraciones con APIs financieras
console.log("Web de cotizaciones cargada correctamente");
const ctx = document.getElementById('currencyChart').getContext('2d');

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [{
      label: 'Std. Size, USX1, USDLB FAS California',
      data: [1.09, 1.092, 1.095, 1.093, 1.097, 1.099, 1.101],
      borderColor: '#1f4fd8',                 // Azul XE
      backgroundColor: 'rgba(31, 79, 216, 0.12)',
      borderWidth: 2,
      tension: 0.45,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#1f4fd8'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: '#eee'
        }
      }
    }
  }
});
// --- Supabase configuration ---
const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGJtbnFzZnRxeXZraG9zenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjEyMDgsImV4cCI6MjA4MTIzNzIwOH0.fS2Wp0lp-GEJXVUpfhcaFRQzxtOY7nhJNjTlpkRxQtA';

fetch(`${SUPABASE_URL}/rest/v1/exchange_rates?pair=eq.EURUSD&order=rate_date.asc`, {
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  }
})
.then(res => res.json())
.then(data => {
  const labels = data.map(row => row.rate_date);
  const values = data.map(row => row.value);

  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.update();
})
.catch(err => {
  console.error('Error cargando datos de Supabase:', err);
});
