// Archivo preparado para futuras integraciones con APIs financieras
console.log("Web de cotizaciones cargada correctamente");
const ctx = document.getElementById('currencyChart').getContext('2d');

const ctx = document.getElementById('currencyChart').getContext('2d');

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

// luego tu fetch a Supabase y chart.update()
