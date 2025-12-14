// Archivo preparado para futuras integraciones con APIs financieras
console.log("Web de cotizaciones cargada correctamente");
const ctx = document.getElementById('currencyChart').getContext('2d');

new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [{
      label: 'EUR/USD',
      data: [1.09, 1.092, 1.095, 1.093, 1.097, 1.099, 1.101],
      borderColor: '#2bb673',
      backgroundColor: 'rgba(43, 182, 115, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 0
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
