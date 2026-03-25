document.addEventListener('DOMContentLoaded', () => {

  const SUPABASE_URL = 'https://pqtbmnqsftqyvkhoszyy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9aXVVpDd5YGd5nIRh27v_g_04494V6s';

  let primaryPair = 'USDLB_STD';
  let currentRange = 'all';
  const hitos = [
    { fecha: '2023-10-02', texto: 'Op. C23' },
    { fecha: '2024-09-30', texto: 'Op. C24' },
    { fecha: '2025-09-29', texto: 'Op. C25' }
  ];

  const productTitle  = document.getElementById('productTitle');
  const productPrice  = document.getElementById('productPrice');
  const productChange = document.getElementById('productChange');
  const tickers = document.querySelectorAll('.ticker');
  const ctx = document.getElementById('currencyChart').getContext('2d');

  tickers.forEach(t => t.querySelector('.label').textContent = t.dataset.name);
  productTitle.textContent = document.querySelector('.ticker.active').dataset.name;

  const gradient = ctx.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, 'rgba(18,21,28,0.12)');
  gradient.addColorStop(1, 'rgba(18,21,28,0)');

  // Estado de visibilidad de líneas USDLB
  let usdVisible = { std: true, large: true };

  let chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true },
      plugins: {
        legend: {
          display: true,
          onClick: function(e, legendItem) {
            const index = legendItem.datasetIndex;
            const label = chart.data.datasets[index].label;
            if(label === 'Standard (USDLB)') usdVisible.std = !usdVisible.std;
            if(label === 'Large (USDLB)') usdVisible.large = !usdVisible.large;
            updateUSDLBChart(true); // actualizar solo visualmente
          }
        },
        tooltip: {
          backgroundColor: '#12151c',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false,
          callbacks: {
            label: function(context) {
              if(context.dataset.label === 'Hitos') return context.raw.hito + ' — ' + context.raw.y.toFixed(2);
              return context.raw.toFixed(2);
            }
          }
        },
        annotation: { annotations: {} }
      },
      scales: {
        x: { grid: { display: false } },
        y: { position: 'right', grace: '15%' }
      }
    }
  });

  // Fetch series
  async function fetchSeries(pair) {
    let query = '';
    let order = 'rate_date.desc';
    let limit = 1000;
    if(currentRange !== 'all') {
      const days = parseInt(currentRange,10);
      const fromDate = new Date(Date.now()-days*86400000).toISOString().split('T')[0];
      query += `&rate_date=gte.${fromDate}`;
      order = 'rate_date.asc';
    } else limit = 3000;

    const r = await fetch(`${SUPABASE_URL}/rest/v1/us_std?select=rate_date,value&pair=eq.${pair}${query}&order=${order}&limit=${limit}`,
      { headers: { apikey: SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` } });
    if(!r.ok) return [];
    const data = await r.json();
    return currentRange === 'all' ? data.reverse() : data;
  }

  async function fetchLastTwo(pair) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/us_std?select=value&pair=eq.${pair}&order=rate_date.desc&limit=2`,
      { headers: { apikey: SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` } });
    if(!r.ok) return [];
    return await r.json();
  }

  async function updateHeader(pair) {
    const d = await fetchLastTwo(pair);
    if(!d.length) return;
    const last = +d[0].value;
    const prev = d[1]? +d[1].value:null;

    productPrice.textContent = last.toFixed(2);
    if(prev!==null){
      const ch = ((last-prev)/prev)*100;
      const arrow = ch>=0?'▲':'▼';
      const formatted = `${arrow} ${Math.abs(ch).toFixed(2)}%`;

      productChange.textContent = formatted;
      productPrice.className  = `price ${ch>=0?'up':'down'}`;
      productChange.className = `change ${ch>=0?'up':'down'}`;

      const activeTicker = document.querySelector('.ticker.active');
      const deltaEl = activeTicker.querySelector('.delta');
      deltaEl.textContent = formatted;
      deltaEl.className = `delta ${ch>=0?'up':'down'}`;
    }
  }

  async function updateAllTickers(){
    for(const t of tickers){
      const pair = t.dataset.pair;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/us_std?select=value&pair=eq.${pair}&order=rate_date.desc&limit=2`,
        { headers:{ apikey: SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` } });
      if(!r.ok) continue;
      const d = await r.json();
      if(d.length<2) continue;

      const last = +d[0].value;
      const prev = +d[1].value;
      const ch = ((last-prev)/prev)*100;
      const arrow = ch>=0?'▲':'▼';
      const formatted = `${arrow} ${Math.abs(ch).toFixed(2)}%`;

      const deltaEl = t.querySelector('.delta');
      deltaEl.textContent = formatted;
      deltaEl.className = `delta ${ch>=0?'up':'down'}`;
    }
  }

  function buildHitos(labels, values){
    const annotations = [];
    const puntos = [];
    hitos.forEach(h=>{
      const idx = labels.findIndex(l=>l>=h.fecha);
      if(idx===-1) return;
      const precio = values[idx];
      puntos.push({ x:labels[idx], y:precio, hito:h.texto });
      annotations.push({
        type:'line', xMin:labels[idx], xMax:labels[idx],
        borderColor:'rgba(139,0,0,0.2)', borderWidth:1, borderDash:[2,4]
      });
    });
    const hitoDataset = chart.data.datasets.find(d=>d.label==='Hitos');
    if(hitoDataset) hitoDataset.data = puntos;
    return annotations.reduce((obj,item,i)=>{ obj[`hito_${i}`]=item; return obj; },{});
  }

  async function updateUSDLBChart(toggle=false){
    // Si toggle=true, solo cambiar hidden sin refetch
    let stdData, largeData;
    if(!toggle){
      [stdData, largeData] = await Promise.all([fetchSeries('USDLB_STD'), fetchSeries('USDLB_LARGE')]);
      chart._usdStdData = stdData; // guardar para toggle
      chart._usdLargeData = largeData;
    } else {
      stdData = chart._usdStdData;
      largeData = chart._usdLargeData;
    }
    if(!stdData.length) return;

    const labels = stdData.map(d=>d.rate_date);
    chart.data.labels = labels;

    chart.data.datasets = [
      {
        label:'Standard (USDLB)',
        data: stdData.map(d=>+d.value),
        borderColor:'#12151c',
        backgroundColor:gradient,
        borderWidth:0.8,
        fill:true,
        tension:0.28,
        pointRadius:0,
        hidden: !usdVisible.std
      },
      {
        label:'Large (USDLB)',
        data: largeData.map(d=>+d.value),
        borderColor:'#4a0710',
        backgroundColor:'rgba(107,15,26,0.1)',
        borderWidth:0.8,
        fill:true,
        tension:0.28,
        pointRadius:0,
        hidden: !usdVisible.large
      },
      {
        label:'Hitos',
        data:[],
        showLine:false,
        pointRadius:5,
        pointHoverRadius:8,
        pointBackgroundColor:'#6b0f1a',
        pointBorderColor:'#4a0710',
        pointBorderWidth:2
      }
    ];

    chart.options.plugins.annotation.annotations = buildHitos(labels,stdData.map(d=>+d.value));
    chart.update();
    updateHeader('USDLB_STD');
  }

  async function updateChart(){
    const d = await fetchSeries(primaryPair);
    if(!d.length) return;
    const labels = d.map(x=>x.rate_date);
    const values = d.map(x=>+x.value);

    chart.data.labels = labels;
    chart.data.datasets = [
      {
        label:primaryPair,
        data:values,
        borderColor:'#12151c',
        backgroundColor:gradient,
        borderWidth:0.8,
        fill:true,
        tension:0.28,
        pointRadius:0
      },
      {
        label:'Hitos',
        data:[],
        showLine:false,
        pointRadius:5,
        pointHoverRadius:8,
        pointBackgroundColor:'#6b0f1a',
        pointBorderColor:'#4a0710',
        pointBorderWidth:2
      }
    ];

    chart.options.plugins.annotation.annotations = buildHitos(labels,values);
    chart.update();
    updateHeader(primaryPair);
  }

  tickers.forEach(t=>{
    t.addEventListener('click',()=>{
      tickers.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      productTitle.textContent = t.dataset.name;
      if(t.dataset.pair.startsWith('USDLB')){
        updateUSDLBChart();
        primaryPair='USDLB_STD';
      } else {
        primaryPair=t.dataset.pair;
        updateChart();
      }
    });
  });

  document.querySelectorAll('.ranges button').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.ranges button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentRange = b.dataset.range;
      const activeTicker = document.querySelector('.ticker.active');
      if(activeTicker.dataset.pair.startsWith('USDLB')){
        updateUSDLBChart();
      } else {
        updateChart();
      }
    });
  });

  // Inicialización
  const activeTicker = document.querySelector('.ticker.active');
  if(activeTicker.dataset.pair.startsWith('USDLB')) updateUSDLBChart();
  else { primaryPair=activeTicker.dataset.pair; updateChart(); }

  updateAllTickers();
});
