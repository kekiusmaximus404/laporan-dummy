// ═══════════════════════════════════════════════════════════════
//  grafik.js — Dashboard Grafik: Maintenance & OTS (Manager Only)
//  Live data dari GAS · Export JPEG & Excel
// ═══════════════════════════════════════════════════════════════

var _grafikTab     = 'maintenance';
var _grafikCharts  = {};   // registered Chart instances
var _grafikRawData = null; // last fetched raw data
var _grafikInited  = false;

var _PICS = ['Abet Nego','Goprid Tendo Padagi','Petrus Evan Budiargo','Hardianto Candra'];

var _COLORS = {
  blue:   '#3b82f6', cyan:   '#0891b2', green:  '#059669',
  purple: '#7c3aed', amber:  '#d97706', red:    '#dc2626',
  pink:   '#db2777', indigo: '#4338ca', teal:   '#0d9488',
  orange: '#ea580c', lime:   '#65a30d', rose:   '#e11d48',
};
var _PALETTE = Object.values(_COLORS);

// ── Init ─────────────────────────────────────────────────────
function _initGrafik(){
  if(!_grafikInited){
    // Set default bulan/tahun
    var now = new Date();
    var bulanNames = ['Januari','Februari','Maret','April','Mei','Juni',
                      'Juli','Agustus','September','Oktober','November','Desember'];
    var selBulan = document.getElementById('grafik-bulan');
    if(selBulan) selBulan.value = bulanNames[now.getMonth()];
    var selTahun = document.getElementById('grafik-tahun');
    if(selTahun){
      selTahun.innerHTML = '';
      for(var y = now.getFullYear(); y >= now.getFullYear()-3; y--){
        var o = document.createElement('option');
        o.value = y; o.textContent = y;
        selTahun.appendChild(o);
      }
    }
    _grafikInited = true;
  }
  _loadGrafikData();
}

// ── Tab switch ───────────────────────────────────────────────
function _switchGrafikTab(tab){
  _grafikTab = tab;
  var tabs = ['maintenance','ots'];
  tabs.forEach(function(t){
    var btn = document.getElementById('gtab-'+t);
    if(!btn) return;
    if(t === tab){
      btn.style.background = '#1e3a5f';
      btn.style.color = '#fff';
      btn.style.borderColor = '#1e3a5f';
    } else {
      btn.style.background = 'var(--surface2)';
      btn.style.color = 'var(--text2)';
      btn.style.borderColor = 'var(--border2)';
    }
  });
  document.getElementById('grafik-maintenance-wrap').style.display = tab==='maintenance' ? '' : 'none';
  document.getElementById('grafik-ots-wrap').style.display = tab==='ots' ? '' : 'none';

  // Render charts for the active tab if data already loaded
  if(_grafikRawData) _renderGrafikCharts(_grafikRawData);
}

// ── Load data from GAS ───────────────────────────────────────
async function _loadGrafikData(){
  var bulan = document.getElementById('grafik-bulan')?.value || '';
  var tahun = document.getElementById('grafik-tahun')?.value || new Date().getFullYear();

  _showGrafikLoading(true);
  try {
    var json = await fetchGAS({
      action: 'getDashboardGrafik',
      pin:    currentPin,
      bulan:  bulan,
      tahun:  tahun
    });
    _showGrafikLoading(false);
    if(json.status !== 'ok'){
      _showGrafikError('Gagal: '+(json.message||'Data tidak tersedia'));
      return;
    }
    _grafikRawData = json.data;
    _renderGrafikCharts(json.data);
  } catch(e){
    _showGrafikLoading(false);
    _showGrafikError('Tidak dapat terhubung ke server: '+e.message);
  }
}

function _showGrafikLoading(show){
  var el = document.getElementById('grafik-loading');
  var er = document.getElementById('grafik-error');
  if(el) el.style.display = show ? 'block' : 'none';
  if(er) er.style.display = 'none';
}
function _showGrafikError(msg){
  var el = document.getElementById('grafik-error');
  if(el){ el.textContent = msg; el.style.display = 'block'; }
}

// ── Destroy & rebuild a chart safely ────────────────────────
function _mkChart(id, config){
  if(_grafikCharts[id]){ _grafikCharts[id].destroy(); }
  var canvas = document.getElementById(id);
  if(!canvas) return null;
  var chart = new Chart(canvas.getContext('2d'), config);
  _grafikCharts[id] = chart;
  return chart;
}

// ── Render all charts ────────────────────────────────────────
function _renderGrafikCharts(data){
  if(_grafikTab === 'maintenance') _renderMaintenanceCharts(data);
  else _renderOtsCharts(data);
}

// ═══════════════════════════════════════════════════════════════
//  MAINTENANCE CHARTS
// ═══════════════════════════════════════════════════════════════
function _renderMaintenanceCharts(data){
  var mData = data.maintenance || {};
  var pics  = mData.pics || _PICS;

  // ── A: Tiket per PIC (bar) ──
  _mkChart('chart-tiket-pic', {
    type: 'bar',
    data: {
      labels: pics,
      datasets: [{
        label: 'Total Tiket',
        data: pics.map(function(p){ return (mData.tiketPerPic||{})[p] || 0; }),
        backgroundColor: pics.map(function(_,i){ return _PALETTE[i % _PALETTE.length]+'cc'; }),
        borderRadius: 6,
      }]
    },
    options: _barOpts('Jumlah Tiket')
  });

  // ── B: Stacked bar breakdown jenis per PIC ──
  _mkChart('chart-jenis-pic', {
    type: 'bar',
    data: {
      labels: pics,
      datasets: [
        { label:'Hardware', backgroundColor:'#3b82f6cc', borderRadius:4,
          data: pics.map(function(p){ return ((mData.jenisByPic||{})[p]||{}).hw||0; }) },
        { label:'Jaringan', backgroundColor:'#0891b2cc', borderRadius:4,
          data: pics.map(function(p){ return ((mData.jenisByPic||{})[p]||{}).net||0; }) },
        { label:'Daily Activity', backgroundColor:'#d97706cc', borderRadius:4,
          data: pics.map(function(p){ return ((mData.jenisByPic||{})[p]||{}).daily||0; }) },
      ]
    },
    options: Object.assign(_barOpts('Jumlah'), { scales:{ x:{ stacked:true, ticks:{font:{size:10}} }, y:{ stacked:true, beginAtZero:true, ticks:{stepSize:1} } } })
  });

  // ── C: Donut kategori Hardware ──
  var hwKat = mData.hwKategori || {};
  _mkChart('chart-hw-kat', {
    type: 'doughnut',
    data: {
      labels: Object.keys(hwKat),
      datasets: [{ data: Object.values(hwKat),
        backgroundColor: _PALETTE, borderWidth:2, borderColor:'var(--surface)' }]
    },
    options: _donutOpts()
  });

  // ── D: Donut kategori Jaringan ──
  var netKat = mData.netKategori || {};
  _mkChart('chart-net-kat', {
    type: 'doughnut',
    data: {
      labels: Object.keys(netKat),
      datasets: [{ data: Object.values(netKat),
        backgroundColor: _PALETTE, borderWidth:2, borderColor:'var(--surface)' }]
    },
    options: _donutOpts()
  });

  // ── E: Stacked status per PIC ──
  _mkChart('chart-status-pic', {
    type: 'bar',
    data: {
      labels: pics,
      datasets: [
        { label:'Selesai',  backgroundColor:'#059669cc', borderRadius:4,
          data: pics.map(function(p){ return ((mData.statusByPic||{})[p]||{}).selesai||0; }) },
        { label:'Proses',   backgroundColor:'#d97706cc', borderRadius:4,
          data: pics.map(function(p){ return ((mData.statusByPic||{})[p]||{}).proses||0; }) },
        { label:'Eskalasi', backgroundColor:'#dc2626cc', borderRadius:4,
          data: pics.map(function(p){ return ((mData.statusByPic||{})[p]||{}).eskalasi||0; }) },
      ]
    },
    options: Object.assign(_barOpts('Tiket'), { scales:{ x:{ stacked:true, ticks:{font:{size:10}} }, y:{ stacked:true, beginAtZero:true, ticks:{stepSize:1} } } })
  });

  // ── F: Tren harian (line) ──
  var tren = mData.trenHarian || {};
  var days = Object.keys(tren).sort();
  _mkChart('chart-tren-harian', {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label:'Tiket',
        data: days.map(function(d){ return tren[d]; }),
        borderColor: '#3b82f6', backgroundColor: '#3b82f620',
        tension:0.4, fill:true, pointRadius:3,
      }]
    },
    options: { responsive:true, plugins:{ legend:{display:false} },
      scales:{ x:{ticks:{font:{size:9},maxRotation:45}}, y:{beginAtZero:true,ticks:{stepSize:1}} } }
  });
}

// ═══════════════════════════════════════════════════════════════
//  OTS CHARTS
// ═══════════════════════════════════════════════════════════════
function _renderOtsCharts(data){
  var oData = data.ots || {};
  var pics  = oData.pics || _PICS;

  // ── A: Bar kunjungan per PIC ──
  _mkChart('chart-ots-pic', {
    type: 'bar',
    data: {
      labels: pics,
      datasets: [{
        label: 'Kunjungan',
        data: pics.map(function(p){ return (oData.perPic||{})[p]||0; }),
        backgroundColor: pics.map(function(_,i){ return _PALETTE[i%_PALETTE.length]+'cc'; }),
        borderRadius: 6,
      }]
    },
    options: _barOpts('Kunjungan')
  });

  // ── B: Bar per Branch Office ──
  var bo = oData.perBo || {};
  var boKeys = Object.keys(bo).sort(function(a,b){ return (bo[b]||0)-(bo[a]||0); }).slice(0,12);
  _mkChart('chart-ots-bo', {
    type: 'bar',
    data: {
      labels: boKeys,
      datasets: [{
        label: 'Kunjungan',
        data: boKeys.map(function(k){ return bo[k]; }),
        backgroundColor: '#7c3aedcc',
        borderRadius: 6,
      }]
    },
    options: Object.assign(_barOpts('Kunjungan'), {
      indexAxis:'y',
      scales:{ x:{beginAtZero:true,ticks:{stepSize:1}}, y:{ticks:{font:{size:10}}} }
    })
  });

  // ── C: Line tren per minggu ──
  var trenMinggu = oData.trenMinggu || {};
  var weekKeys = Object.keys(trenMinggu).sort();
  _mkChart('chart-ots-tren', {
    type: 'line',
    data: {
      labels: weekKeys.map(function(w){ return 'Minggu '+w; }),
      datasets: [{
        label:'Kunjungan',
        data: weekKeys.map(function(w){ return trenMinggu[w]; }),
        borderColor:'#7c3aed', backgroundColor:'#7c3aed20',
        tension:0.4, fill:true, pointRadius:4,
      }]
    },
    options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ x:{ticks:{font:{size:10}}}, y:{beginAtZero:true,ticks:{stepSize:1}} } }
  });

  // ── D: Heatmap kalender ──
  _renderOtsHeatmap(oData.perHari || {});
}

function _renderOtsHeatmap(perHari){
  var el = document.getElementById('ots-heatmap');
  if(!el) return;
  var bulan = document.getElementById('grafik-bulan')?.value || 'Mei';
  var tahun = parseInt(document.getElementById('grafik-tahun')?.value) || new Date().getFullYear();
  var bulanNames = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
  var bulanIdx = bulanNames.indexOf(bulan);
  var daysInMonth = new Date(tahun, bulanIdx+1, 0).getDate();
  var firstDay = new Date(tahun, bulanIdx, 1).getDay(); // 0=Sun

  var maxVal = Math.max.apply(null, Object.values(perHari).concat([1]));
  var dayLabels = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  var html = '<div style="font-size:10px;color:var(--text3);display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;margin-bottom:4px;">';
  dayLabels.forEach(function(d){ html += '<div>'+d+'</div>'; });
  html += '</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">';

  // Empty cells before first day
  for(var i=0;i<firstDay;i++) html += '<div></div>';

  for(var d=1; d<=daysInMonth; d++){
    var dateStr = tahun+'-'+String(bulanIdx+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var val = perHari[dateStr] || 0;
    var intensity = val > 0 ? Math.max(0.2, val/maxVal) : 0;
    var bg = val>0 ? 'rgba(124,58,237,'+intensity+')' : 'var(--border)';
    var color = val>0 && intensity>0.5 ? '#fff' : 'var(--text1)';
    html += '<div title="'+dateStr+': '+val+' kunjungan" style="background:'+bg+';color:'+color+';border-radius:4px;padding:4px 2px;font-size:10px;font-weight:600;text-align:center;cursor:default;">'+d+(val>0?'<br><span style="font-size:9px;">'+val+'</span>':'')+'</div>';
  }
  html += '</div>';
  html += '<div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10px;color:var(--text3);"><span>0</span>';
  for(var s=1;s<=5;s++) html += '<div style="width:14px;height:14px;border-radius:3px;background:rgba(124,58,237,'+(s*0.2)+');"></div>';
  html += '<span>'+maxVal+'+ kunjungan</span></div>';
  el.innerHTML = html;
}

// ── Chart option helpers ─────────────────────────────────────
function _barOpts(yLabel){
  return {
    responsive: true,
    plugins: { legend:{ display:false } },
    scales: {
      x: { ticks:{ font:{size:10} } },
      y: { beginAtZero:true, ticks:{ stepSize:1 }, title:{ display:!!yLabel, text:yLabel, font:{size:10} } }
    }
  };
}
function _donutOpts(){
  return {
    responsive: true,
    plugins: {
      legend:{ position:'right', labels:{ font:{size:10}, boxWidth:12, padding:8 } }
    }
  };
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT: JPEG
// ═══════════════════════════════════════════════════════════════
function _exportGrafikJpeg(){
  var zoneId = _grafikTab === 'maintenance' ? 'grafik-capture-zone' : 'grafik-capture-zone-ots';
  var zone   = document.getElementById(zoneId);
  if(!zone){ showToast('Muat grafik dulu','info'); return; }

  // Kumpulkan semua canvas dalam zone
  var canvases = zone.querySelectorAll('canvas');
  if(!canvases.length){ showToast('Tidak ada grafik untuk diexport','info'); return; }

  var bulan = document.getElementById('grafik-bulan')?.value || '';
  var tahun = document.getElementById('grafik-tahun')?.value || '';

  // Buat satu canvas gabungan
  var W = 900, margin = 20, chartW = (W-margin*3)/2, chartH = 220, rows = Math.ceil(canvases.length/2);
  var H = margin + rows*(chartH+margin) + 60; // extra for header

  var masterCanvas = document.createElement('canvas');
  masterCanvas.width  = W;
  masterCanvas.height = H;
  var ctx = masterCanvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(0, 0, W, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Dashboard Grafik ' + (_grafikTab==='maintenance'?'Maintenance':'OTS') + ' — ' + bulan + ' ' + tahun, 16, 30);

  // Draw each chart canvas
  canvases.forEach(function(c, i){
    var col = i % 2, row = Math.floor(i/2);
    var x = margin + col*(chartW+margin);
    var y = 56 + row*(chartH+margin);
    ctx.drawImage(c, x, y, chartW, chartH);
  });

  // Watermark
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#1e3a5f';
  ctx.font = 'bold 40px Arial';
  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.rotate(-0.3);
  ctx.fillText('ITD CU Keling Kumang', -180, 0);
  ctx.restore();
  ctx.globalAlpha = 1;

  masterCanvas.toBlob(function(blob){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Grafik_'+(_grafikTab==='maintenance'?'Maintenance':'OTS')+'_'+bulan+'_'+tahun+'.jpg';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
    showToast('✅ JPEG berhasil diunduh!','ok');
  }, 'image/jpeg', 0.92);
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT: Excel
// ═══════════════════════════════════════════════════════════════
function _exportGrafikExcel(){
  if(!_grafikRawData){ showToast('Muat grafik dulu','info'); return; }
  var bulan = document.getElementById('grafik-bulan')?.value || '';
  var tahun = document.getElementById('grafik-tahun')?.value || '';

  var wb = XLSX.utils.book_new();

  if(_grafikTab === 'maintenance'){
    var mData = _grafikRawData.maintenance || {};
    var pics  = mData.pics || _PICS;

    // Sheet 1: Ringkasan per PIC
    var rows1 = [['Nama PIC','Total Tiket','Hardware','Jaringan','Daily','Selesai','Proses','Eskalasi']];
    pics.forEach(function(p){
      var j = (mData.jenisByPic||{})[p]||{};
      var s = (mData.statusByPic||{})[p]||{};
      rows1.push([p,(mData.tiketPerPic||{})[p]||0,j.hw||0,j.net||0,j.daily||0,s.selesai||0,s.proses||0,s.eskalasi||0]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows1), 'Tiket per PIC');

    // Sheet 2: Kategori HW
    var hwKat = mData.hwKategori||{};
    var rows2 = [['Kategori Hardware','Jumlah']];
    Object.keys(hwKat).forEach(function(k){ rows2.push([k,hwKat[k]]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows2), 'Kategori Hardware');

    // Sheet 3: Kategori Net
    var netKat = mData.netKategori||{};
    var rows3 = [['Kategori Jaringan','Jumlah']];
    Object.keys(netKat).forEach(function(k){ rows3.push([k,netKat[k]]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows3), 'Kategori Jaringan');

    // Sheet 4: Tren harian
    var tren = mData.trenHarian||{};
    var rows4 = [['Tanggal','Jumlah Tiket']];
    Object.keys(tren).sort().forEach(function(d){ rows4.push([d,tren[d]]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows4), 'Tren Harian');

  } else {
    var oData = _grafikRawData.ots || {};
    var pics  = oData.pics || _PICS;

    // Sheet 1: Per PIC
    var rows1 = [['Nama PIC','Jumlah Kunjungan']];
    pics.forEach(function(p){ rows1.push([p,(oData.perPic||{})[p]||0]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows1), 'OTS per PIC');

    // Sheet 2: Per BO
    var bo = oData.perBo||{};
    var rows2 = [['Branch Office','Jumlah Kunjungan']];
    Object.keys(bo).sort(function(a,b){return (bo[b])-(bo[a]);}).forEach(function(k){ rows2.push([k,bo[k]]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows2), 'OTS per BO');

    // Sheet 3: Tren mingguan
    var tm = oData.trenMinggu||{};
    var rows3 = [['Minggu ke-','Jumlah Kunjungan']];
    Object.keys(tm).sort().forEach(function(w){ rows3.push(['Minggu '+w,tm[w]]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows3), 'Tren Mingguan');

    // Sheet 4: Per hari
    var ph = oData.perHari||{};
    var rows4 = [['Tanggal','Jumlah Kunjungan']];
    Object.keys(ph).sort().forEach(function(d){ rows4.push([d,ph[d]]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows4), 'Per Hari');
  }

  var fname = 'Grafik_'+(_grafikTab==='maintenance'?'Maintenance':'OTS')+'_'+bulan+'_'+tahun+'.xlsx';
  XLSX.writeFile(wb, fname);
  showToast('✅ Excel berhasil diunduh!','ok');
}
