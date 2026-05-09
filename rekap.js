// ═══════════════════════════════════════════════════════════════
//  rekap.js — Rekap Maintenance & OTS: load, render, export
// ═══════════════════════════════════════════════════════════════

async function loadRekap(){
  // Alias - dipanggil saat switch submenu, langsung load report
  loadReportMaintenance();
}

async function loadReportMaintenance(){
  const bulan = document.getElementById('rekap-bulan')?.value || '';
  const pic   = document.getElementById('rekap-pic')?.value || '';
  const kat   = document.getElementById('rekap-kat')?.value || '';
  const el    = document.getElementById('rekap-content');

  if(el) el.innerHTML='<div class="loading-text">⏳ Memuat data...</div>';

  try{
    // Ambil raw log dari Apps Script
    const json = await fetchGAS({action:'getLogByMonth', pin:currentPin, bulan});
    if(json.status!=='ok'){
      if(el) el.innerHTML='<div class="no-data">Gagal load data.</div>';
      return;
    }
    _rekapRawData = json.data || [];
    renderReportMaintenance(_rekapRawData, bulan, pic, kat);
  }catch(e){
    if(el) el.innerHTML='<div class="no-data">Gagal koneksi ke Sheets.</div>';
  }
}

function renderReportMaintenance(rawData, bulan, picFilter, katFilter){
  const el = document.getElementById('rekap-content');
  if(!el) return;

  // Apply filters
  let data = rawData;
  if(picFilter) data = data.filter(r => r.pic === picFilter);
  if(katFilter) data = data.filter(r => r.kat === katFilter);

  if(!data.length){
    el.innerHTML = `<div class="no-data"><div class="no-data-icon">📊</div>
      Tidak ada data${picFilter?' untuk '+picFilter:''}${katFilter?' kategori '+katFilter:''}${bulan?' bulan '+bulan:''}.
    </div>`;
    return;
  }

  // ── Hitung statistik ──────────────────────────────
  const hw  = data.filter(r=>r.tipe==='Hardware');
  const net = data.filter(r=>r.tipe==='Jaringan');
  const selesai  = data.filter(r=>r.status==='Selesai').length;
  const proses   = data.filter(r=>r.status==='Proses').length;
  const eskalasi = data.filter(r=>r.status==='Eskalasi').length;

  // Unique IDs = unique laporan
  const uniqueIds = new Set(data.map(r=>r.id));
  const uniqueDays = new Set(data.map(r=>r.tgl));

  // Filter label
  const filterLabel = [
    bulan||'Semua Bulan',
    picFilter||'Semua PIC',
    katFilter||(data.some(r=>r.tipe==='Hardware')&&data.some(r=>r.tipe==='Jaringan')?'Semua Kategori':data[0]?.tipe||'Semua')
  ].join(' · ');

  // ── Summary Cards ─────────────────────────────────
  let html = `
  <div style="background:linear-gradient(135deg,var(--primary-dark),var(--primary));border-radius:var(--radius);padding:16px 20px;margin-bottom:14px;color:#fff;">
    <div style="font-size:11px;opacity:0.6;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Report Maintenance</div>
    <div style="font-size:16px;font-weight:700;">${filterLabel}</div>
  </div>

  <div class="metric-row" style="margin-bottom:14px;">
    <div class="metric-box" style="border-top:3px solid var(--accent);">
      <div class="metric-num" style="color:var(--accent);">${uniqueIds.size}</div>
      <div class="metric-lbl">Total Laporan</div>
    </div>
    <div class="metric-box" style="border-top:3px solid #1e40af;">
      <div class="metric-num" style="color:#1e40af;">${hw.length}</div>
      <div class="metric-lbl">Tiket Hardware</div>
    </div>
    <div class="metric-box" style="border-top:3px solid var(--green);">
      <div class="metric-num" style="color:var(--green);">${net.length}</div>
      <div class="metric-lbl">Tiket Jaringan</div>
    </div>
  </div>

  <div class="metric-row" style="margin-bottom:20px;">
    <div class="metric-box" style="border-top:3px solid var(--green);">
      <div class="metric-num" style="color:var(--green);font-size:22px;">${selesai}</div>
      <div class="metric-lbl">✓ Selesai</div>
    </div>
    <div class="metric-box" style="border-top:3px solid var(--warn);">
      <div class="metric-num" style="color:var(--warn);font-size:22px;">${proses}</div>
      <div class="metric-lbl">⏳ Proses</div>
    </div>
    <div class="metric-box" style="border-top:3px solid var(--red);">
      <div class="metric-num" style="color:var(--red);font-size:22px;">${eskalasi}</div>
      <div class="metric-lbl">⚠️ Eskalasi</div>
    </div>
  </div>`;

  // ── Per PIC breakdown ─────────────────────────────
  const pics = [...new Set(data.map(r=>r.pic))];
  html += `<div class="sec-title" style="margin-bottom:10px;">👤 REKAP PER PIC</div>`;

  pics.forEach(pic => {
    const pData = data.filter(r=>r.pic===pic);
    const pHw  = pData.filter(r=>r.tipe==='Hardware');
    const pNet = pData.filter(r=>r.tipe==='Jaringan');
    const pSelesai  = pData.filter(r=>r.status==='Selesai').length;
    const pProses   = pData.filter(r=>r.status==='Proses').length;
    const pEskalasi = pData.filter(r=>r.status==='Eskalasi').length;
    const pDays = [...new Set(pData.map(r=>r.tgl))].length;

    // Kategori terbanyak
    const katCount = {};
    pData.forEach(r=>{ katCount[r.kat]=(katCount[r.kat]||0)+1; });
    const topKat = Object.entries(katCount).sort((a,b)=>b[1]-a[1]).slice(0,3);

    // BO yang dikunjungi
    const boList = [...new Set(pData.map(r=>r.branch))];

    // Detail tiket per tanggal
    const byDate = {};
    pData.forEach(r=>{
      if(!byDate[r.tgl]) byDate[r.tgl]=[];
      byDate[r.tgl].push(r);
    });

    const dateRows = Object.entries(byDate)
      .sort(([a],[b])=>b.localeCompare(a))
      .map(([tgl, tickets])=>{
        const tglStr = new Date(tgl).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
        const ticketRows = tickets.map(t=>`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:7px 10px;">
              <span class="badge ${t.tipe==='Hardware'?'badge-hw':'badge-net'}" style="font-size:10px;">
                ${t.tipe==='Hardware'?'🔧':'🌐'} ${t.kat}
              </span>
            </td>
            <td style="padding:7px 10px;font-size:12px;color:var(--text2);">${t.sub||'-'}</td>
            <td style="padding:7px 10px;font-size:12px;">${t.branch}</td>
            <td style="padding:7px 10px;font-size:12px;color:var(--text2);">${t.lokasi||'-'}</td>
            <td style="padding:7px 10px;">
              <span class="badge badge-${t.status==='Selesai'?'selesai':t.status==='Proses'?'proses':'eskalasi'}" style="font-size:10px;">${t.status}</span>
            </td>
          </tr>`).join('');
        return `
          <div style="margin-bottom:4px;">
            <div style="font-size:11px;font-weight:700;color:var(--text2);padding:6px 10px;background:var(--surface3);border-radius:6px 6px 0 0;border-left:3px solid var(--accent);">
              📅 ${tglStr}
            </div>
            <div style="overflow-x:auto;border-radius:0 0 6px 6px;border:1px solid var(--border);border-top:none;">
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:var(--surface2);">
                    <th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text2);font-weight:700;text-transform:uppercase;">Kategori</th>
                    <th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text2);font-weight:700;text-transform:uppercase;">Sub</th>
                    <th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text2);font-weight:700;text-transform:uppercase;">Branch</th>
                    <th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text2);font-weight:700;text-transform:uppercase;">Lokasi</th>
                    <th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text2);font-weight:700;text-transform:uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>${ticketRows}</tbody>
              </table>
            </div>
          </div>`;
      }).join('');

    html += `
    <div class="card" style="margin-bottom:14px;border-left:4px solid var(--primary);">
      <!-- Header PIC -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <div style="font-weight:800;font-size:16px;">${pic}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px;">${pDays} hari aktif · ${pData.length} tiket total</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
          <span class="badge badge-hw">HW ${pHw.length}</span>
          <span class="badge badge-net">NET ${pNet.length}</span>
        </div>
      </div>

      <!-- Status bar -->
      <div style="display:flex;gap:8px;margin-bottom:14px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm);">
        <div style="flex:1;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:var(--green);">${pSelesai}</div>
          <div style="font-size:10px;color:var(--text2);">Selesai</div>
        </div>
        <div style="width:1px;background:var(--border);"></div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:var(--warn);">${pProses}</div>
          <div style="font-size:10px;color:var(--text2);">Proses</div>
        </div>
        <div style="width:1px;background:var(--border);"></div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:var(--red);">${pEskalasi}</div>
          <div style="font-size:10px;color:var(--text2);">Eskalasi</div>
        </div>
        ${topKat.length?`<div style="width:1px;background:var(--border);"></div>
        <div style="flex:2;padding-left:8px;">
          <div style="font-size:10px;color:var(--text2);margin-bottom:4px;">Top Kategori:</div>
          ${topKat.map(([k,n])=>`<div style="font-size:11px;font-weight:600;">${k} <span style="color:var(--text3);">(${n}x)</span></div>`).join('')}
        </div>`:''}
      </div>

      <!-- Detail per tanggal -->
      <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px;">Detail Perbaikan:</div>
      ${dateRows}
    </div>`;
  });

  el.innerHTML = html;
}

function renderRekap(data){ renderReportMaintenance([], '', '', ''); }

async function loadReportOTS(forceReload=false){
  const el=document.getElementById('report-ots-content');
  const bulan=document.getElementById('ots-filter-bulan')?.value||'';
  if(!forceReload && otsReportLoaded && otsRecords.length>0){
    renderReportOTS(otsRecords,bulan); return;
  }
  if(el) el.innerHTML='<div class="loading-text">⏳ Memuat data OTS...</div>';
  try{
    const json=await fetchGAS({action:'getOTS',pin:currentPin,bulan});
    if(json.status!=='ok'){if(el)el.innerHTML='<div class="no-data">Gagal load data OTS.</div>';return;}
    otsRecords=json.data||[];
    otsReportLoaded=true;
    renderReportOTS(otsRecords,bulan);
  }catch(e){if(el)el.innerHTML='<div class="no-data">Gagal koneksi.</div>';}
}

function renderReportOTS(records,bulan){
  const el=document.getElementById('report-ots-content');
  if(!el)return;
  const filtered=bulan?records.filter(r=>{
    const d=new Date(r.tgl);
    const BN=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return BN[d.getMonth()]===bulan;
  }):records;
  if(!filtered.length){
    el.innerHTML='<div class="no-data"><div class="no-data-icon">📋</div>Belum ada data OTS'+(bulan?' bulan '+bulan:'')+'.</div>';return;
  }
  const rows=filtered.map(r=>{
    const tglStr=r.tgl?new Date(r.tgl).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'-';
    const timIT=Array.isArray(r.timIT)?r.timIT.join(', '):(r.timIT||'-');
    return `<tr>
      <td>${tglStr}</td>
      <td><strong>${(r.bo||'').toUpperCase()}</strong></td>
      <td style="font-size:12px;">${timIT}</td>
      <td><span class="badge badge-blue">${r.jumlahKegiatan||0} kegiatan</span></td>
      <td>${r.adaSerah==='Ya'?'<span class="badge badge-green">✓ Ada</span>':'<span class="badge" style="background:#f1f5f9;color:#94a3b8;">Tidak</span>'}</td>
      <td>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="btn-sm-edit" onclick="showOTSDetailFull('${r.id}')">👁 Detail</button>
          <button class="btn-sm-edit" style="background:#faf5ff;color:#7c3aed;border-color:#e9d5ff;" onclick="reexportOTSPDF('${r.id}')">🖨️ Export</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  el.innerHTML=`<div style="overflow-x:auto;">
    <table class="report-table">
      <thead><tr><th>Tanggal</th><th>Branch Office</th><th>Tim IT</th><th>Kegiatan</th><th>Serah Terima</th><th>Aksi</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="font-size:12px;color:var(--text3);margin-top:8px;text-align:right;">Total: ${filtered.length} kunjungan OTS</div>
  </div>`;
}

function exportExcel(){
  // Gunakan data yang sudah di-filter (WYSIWYG)
  if(!_rekapRawData || !_rekapRawData.length){
    showToast('Tampilkan report dulu sebelum export','info');
    return;
  }

  const bulan  = document.getElementById('rekap-bulan')?.value || '';
  const pic    = document.getElementById('rekap-pic')?.value || '';
  const kat    = document.getElementById('rekap-kat')?.value || '';

  // Apply filter sama persis dengan yang ditampilkan
  let data = _rekapRawData;
  if(pic) data = data.filter(r => r.pic === pic);
  if(kat) data = data.filter(r => r.kat === kat);

  if(!data.length){
    showToast('Tidak ada data untuk diexport','info');
    return;
  }

  showToast('Menyiapkan Excel...','info');

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: DETAIL (sesuai filter) ──────────────────
  const detailRows = data.map(r => ({
    'Tanggal'     : r.tgl,
    'Bulan'       : r.bulan,
    'PIC'         : r.pic,
    'Branch Office': r.branch,
    'Area'        : r.branchKode || '-',
    'Tipe'        : r.tipe,
    'Kategori'    : r.kat,
    'Sub Kategori': r.sub || '-',
    'Lokasi/Unit' : r.lokasi || '-',
    'Status'      : r.status,
    'Keterangan'  : r.ket || '-'
  }));

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);

  // Style kolom lebar
  wsDetail['!cols'] = [
    {wch:12},{wch:14},{wch:22},{wch:20},{wch:14},
    {wch:10},{wch:22},{wch:24},{wch:18},{wch:10},{wch:40}
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Perbaikan');

  // ── Sheet 2: REKAP PER PIC ────────────────────────────
  const pics = [...new Set(data.map(r=>r.pic))];
  const rekapRows = pics.map(p => {
    const pd = data.filter(r=>r.pic===p);
    const katCount = {};
    pd.forEach(r=>{ katCount[r.kat]=(katCount[r.kat]||0)+1; });
    const topKat = Object.entries(katCount).sort((a,b)=>b[1]-a[1])
      .map(([k,n])=>k+' ('+n+'x)').join(', ');
    return {
      'PIC'              : p,
      'Total Tiket'      : pd.length,
      'Hardware'         : pd.filter(r=>r.tipe==='Hardware').length,
      'Jaringan'         : pd.filter(r=>r.tipe==='Jaringan').length,
      'Selesai'          : pd.filter(r=>r.status==='Selesai').length,
      'Proses'           : pd.filter(r=>r.status==='Proses').length,
      'Eskalasi'         : pd.filter(r=>r.status==='Eskalasi').length,
      'Hari Aktif'       : new Set(pd.map(r=>r.tgl)).size,
      'Branch Dikunjungi': [...new Set(pd.map(r=>r.branch))].join(', '),
      'Top Kategori'     : topKat
    };
  });

  const wsRekap = XLSX.utils.json_to_sheet(rekapRows);
  wsRekap['!cols'] = [{wch:22},{wch:12},{wch:12},{wch:12},{wch:10},{wch:10},{wch:10},{wch:12},{wch:40},{wch:50}];
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap Per PIC');

  // ── Sheet 3: REKAP PER KATEGORI ───────────────────────
  const kats = [...new Set(data.map(r=>r.kat))];
  const katRows = kats.map(k => {
    const kd = data.filter(r=>r.kat===k);
    return {
      'Kategori'   : k,
      'Tipe'       : kd[0]?.tipe||'-',
      'Total Tiket': kd.length,
      'Selesai'    : kd.filter(r=>r.status==='Selesai').length,
      'Proses'     : kd.filter(r=>r.status==='Proses').length,
      'Eskalasi'   : kd.filter(r=>r.status==='Eskalasi').length,
      'PIC Terlibat': [...new Set(kd.map(r=>r.pic))].join(', '),
      'Branch'     : [...new Set(kd.map(r=>r.branch))].join(', ')
    };
  }).sort((a,b)=>b['Total Tiket']-a['Total Tiket']);

  const wsKat = XLSX.utils.json_to_sheet(katRows);
  wsKat['!cols'] = [{wch:24},{wch:12},{wch:12},{wch:10},{wch:10},{wch:10},{wch:40},{wch:50}];
  XLSX.utils.book_append_sheet(wb, wsKat, 'Rekap Per Kategori');

  // ── Nama file sesuai filter ───────────────────────────
  const nameParts = ['Laporan_HN'];
  if(bulan) nameParts.push(bulan);
  if(pic) nameParts.push(pic.replace(/ /g,'_'));
  if(kat) nameParts.push(kat.replace(/ /g,'_').replace(/\//g,'-'));
  nameParts.push(new Date().toISOString().slice(0,10));
  const filename = nameParts.join('_') + '.xlsx';

  XLSX.writeFile(wb, filename);
  showToast('✅ Excel berhasil didownload: '+filename,'ok');
}