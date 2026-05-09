// ═══════════════════════════════════════════════════════════════
//  barang.js — Report Barang & Sparepart: load, render, export
// ═══════════════════════════════════════════════════════════════

async function exportSparepart(){
  const bulan = document.getElementById('ots-filter-bulan')?.value || '';
  if(!bulan){ showToast('Pilih bulan dulu','info'); return; }

  showOverlay('Mengambil data sparepart...');

  try{
    // Ambil semua OTS bulan ini
    const json = await fetchGAS({action:'getOTS', pin:currentPin, bulan});
    if(json.status!=='ok'){
      hideOverlay();
      showToast('Gagal ambil data OTS','err');
      return;
    }

    const otsList = json.data || [];
    // Filter bulan yang dipilih
    const BN = ["Januari","Februari","Maret","April","Mei","Juni",
                "Juli","Agustus","September","Oktober","November","Desember"];
    const filtered = otsList.filter(r => {
      const d = new Date(r.tgl);
      return BN[d.getMonth()] === bulan;
    });

    if(!filtered.length){
      hideOverlay();
      showToast('Tidak ada data OTS bulan '+bulan,'info');
      return;
    }

    // Ambil detail setiap OTS untuk dapat serahKe
    const details = await Promise.all(
      filtered.map(r =>
        fetchGAS({action:'getOTSDetail', id:r.id, pin:currentPin})
          .then(j => (j.status==='ok' && j.data) ? j.data : r)
          .catch(() => r)
      )
    );

    hideOverlay();
    buildSparepartExcel(details, bulan);

  } catch(e){
    hideOverlay();
    showToast('Gagal: '+e.message,'err');
  }
}

function buildSparepartExcel(details, bulan){
  if(!details.length){ showToast('Tidak ada data','info'); return; }

  // Kumpulkan semua baris sparepart, sort by tanggal
  const rows = [];
  details
    .sort((a,b) => new Date(a.tgl) - new Date(b.tgl))
    .forEach(r => {
      const serahKe = r.serahKe || [];
      if(!serahKe.length) return;

      const tgl = r.tgl ? new Date(r.tgl) : null;
      const tglStr = tgl ? tgl.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}) : '-';
      const bo = (r.bo||'').toUpperCase();
      const pic = r.petugasSerah || (Array.isArray(r.timIT)?r.timIT[0]:r.timIT)||'';
      const ket = r.kegiatan?.map(k=>k.kegiatan).join(', ') || '';

      serahKe.forEach((item, i) => {
        rows.push({
          _tgl: tgl,
          _isFirst: i === 0,
          no: '', // diisi nanti
          tanggal: i===0 ? tglStr : '',
          nama_barang: item.nama||'',
          merk: item.merk||'',
          jumlah: item.code||'',  // pakai field code untuk jumlah sesuai form
          branch: i===0 ? bo : '',
          pic: i===0 ? pic : '',
          petugas: '',
          keterangan: i===0 ? ket : (item.ket||''),
        });
      });
    });

  if(!rows.length){
    showToast('Tidak ada data sparepart (serah terima barang) bulan '+bulan,'info');
    return;
  }

  // Nomor urut per grup tanggal+branch
  let no = 1;
  let lastKey = '';
  rows.forEach(r => {
    const key = r.tanggal + r.branch;
    if(r._isFirst){
      r.no = no++;
      lastKey = key;
    }
  });

  // Build workbook
  const wb = XLSX.utils.book_new();
  const PERIODE = bulan.toUpperCase() + ' ' + new Date().getFullYear();

  // Header rows
  const wsData = [
    [null, 'REKAP PENGGUNAAN BARANG INVENTARIS KANTOR', null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, `PERIODE ${PERIODE}`, null, null, null],
    [null, 'NO', 'TANGGAL', 'NAMA BARANG', 'MERK', 'JUMLAH', 'BRANCH OFFICE', 'PIC AREA', 'PETUGAS', 'KETERANGAN PENGGUNAAN'],
  ];

  rows.forEach(r => {
    wsData.push([
      null,
      r.no||null,
      r.tanggal||null,
      r.nama_barang,
      r.merk,
      r.jumlah,
      r.branch||null,
      r.pic||null,
      r.petugas||null,
      r.keterangan||null,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths — sesuai template
  ws['!cols'] = [
    {wch:3},   // A (spacer)
    {wch:5},   // B NO
    {wch:13},  // C TANGGAL
    {wch:28},  // D NAMA BARANG
    {wch:15},  // E MERK
    {wch:10},  // F JUMLAH
    {wch:18},  // G BRANCH OFFICE
    {wch:22},  // H PIC AREA
    {wch:18},  // I PETUGAS
    {wch:40},  // J KETERANGAN
  ];

  // Merge header title (B1:J1)
  ws['!merges'] = [
    {s:{r:0,c:1}, e:{r:0,c:9}}, // REKAP PENGGUNAAN...
    {s:{r:1,c:6}, e:{r:1,c:9}}, // PERIODE
  ];

  const sheetName = bulan.substring(0,3).toUpperCase();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `Rekap_Sparepart_${bulan}_${new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(wb, filename);
  showToast('✅ Export berhasil: '+filename,'ok');
}

async function loadReportBarang(){
  const bulan = document.getElementById('barang-filter-bulan')?.value || '';
  const tahun = document.getElementById('barang-filter-tahun')?.value || '';
  const el = document.getElementById('report-barang-content');
  if(el) el.innerHTML = '<div class="loading-text">⏳ Memuat data OTS...</div>';

  try{
    const json = await fetchGAS({action:'getOTS', pin:currentPin, bulan:''});
    if(json.status!=='ok'){ el.innerHTML='<div class="no-data">Gagal load data.</div>'; return; }

    let records = json.data || [];

    // Filter bulan & tahun
    records = records.filter(r=>{
      const d = new Date(r.tgl);
      const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli',
                   'Agustus','September','Oktober','November','Desember'][d.getMonth()];
      const thn = String(d.getFullYear());
      if(bulan && bln !== bulan) return false;
      if(tahun && thn !== tahun) return false;
      return true;
    });

    // Hanya yang ada serah terima
    const withSerah = records.filter(r => r.adaSerah==='Ya' || r.adaSerah===true);

    if(!withSerah.length){
      el.innerHTML = '<div class="no-data"><div class="no-data-icon">📦</div>Tidak ada data penggunaan barang pada periode ini.</div>';
      _barangRawData = [];
      return;
    }

    // Load detail dari Drive untuk semua record (ambil serahKe lengkap)
    el.innerHTML = '<div class="loading-text">⏳ Memuat detail barang dari Drive...</div>';
    const detailed = await Promise.all(withSerah.map(async r => {
      try{
        const det = await fetchGAS({action:'getOTSDetail', id:r.id, pin:currentPin});
        return (det.status==='ok' && det.data) ? det.data : r;
      } catch(e){ return r; }
    }));

    _barangRawData = detailed;
    renderReportBarang(detailed, bulan, tahun);
  } catch(e){
    document.getElementById('report-barang-content').innerHTML = '<div class="no-data">Gagal koneksi.</div>';
  }
}

function renderReportBarang(records, bulan, tahun){
  const el = document.getElementById('report-barang-content');
  if(!el) return;

  const rows = records
    .filter(r => (r.serahKe||[]).some(b=>b.nama))
    .sort((a,b)=>String(a.tgl).localeCompare(String(b.tgl)));

  if(!rows.length){
    el.innerHTML = '<div class="no-data"><div class="no-data-icon">📦</div>Tidak ada data penggunaan barang.</div>';
    return;
  }

  const periodLabel = [bulan||'Semua Bulan', tahun||''].filter(x=>x).join(' ') || 'Semua Periode';
  const totalBarang = rows.reduce((a,r)=>a+(r.serahKe||[]).filter(b=>b.nama).length, 0);

  let html = `
  <div style="background:linear-gradient(135deg,#0891b2,#0e7490);border-radius:var(--radius);padding:14px 20px;margin-bottom:14px;color:#fff;">
    <div style="font-size:11px;opacity:0.7;letter-spacing:2px;text-transform:uppercase;">Rekap Penggunaan Barang Inventaris</div>
    <div style="font-size:16px;font-weight:700;margin-top:2px;">Periode: ${periodLabel}</div>
  </div>
  <div class="metric-row" style="margin-bottom:14px;">
    <div class="metric-box" style="border-top:3px solid #0891b2;">
      <div class="metric-num" style="color:#0891b2;">${rows.length}</div>
      <div class="metric-lbl">Kunjungan OTS</div>
    </div>
    <div class="metric-box" style="border-top:3px solid #0891b2;">
      <div class="metric-num" style="color:#0891b2;">${totalBarang}</div>
      <div class="metric-lbl">Total Item Barang</div>
    </div>
  </div>
  <div style="overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff;border:1px solid #cbd5e1;">
    <thead>
      <tr style="background:#0891b2;color:#fff;">
        <th style="padding:9px 8px;text-align:center;width:36px;border:1px solid #0369a1;">No</th>
        <th style="padding:9px 8px;text-align:left;width:90px;border:1px solid #0369a1;white-space:nowrap;">Tanggal</th>
        <th style="padding:9px 8px;text-align:left;min-width:140px;border:1px solid #0369a1;">Barang</th>
        <th style="padding:9px 8px;text-align:left;min-width:80px;border:1px solid #0369a1;">Merk</th>
        <th style="padding:9px 8px;text-align:left;min-width:100px;border:1px solid #0369a1;">Status</th>
        <th style="padding:9px 8px;text-align:left;min-width:90px;border:1px solid #0369a1;">Branch Office</th>
        <th style="padding:9px 8px;text-align:left;min-width:110px;border:1px solid #0369a1;">PIC Area</th>
        <th style="padding:9px 8px;text-align:left;min-width:180px;border:1px solid #0369a1;">Keterangan Penggunaan</th>
      </tr>
    </thead>
    <tbody>`;

  let no = 1;
  rows.forEach((r, ri) => {
    const tgl = String(r.tgl||'').slice(0,10);
    const tglStr = tgl ? new Date(tgl).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
    const serahKe = (r.serahKe||[]).filter(b=>b.nama);
    const kegiatan = r.kegiatan||[];
    const branch = r.bo||'—';
    const pic = r.petugasSerah||'—';
    const rowspan = serahKe.length;
    const bg = ri%2===0?'#fff':'#f0f9ff';
    const borderColor = ri%2===0?'#e2e8f0':'#bae6fd';

    serahKe.forEach((b, bi) => {
      const isFirst = bi === 0;
      // Tiap baris barang dapat keterangan dari kegiatan index yang sama
      // Jika index melebihi jumlah kegiatan, ambil yang terakhir atau kosong
      const ket = kegiatan[bi] ? (kegiatan[bi].hasil||'—') : '—';

      html += `<tr style="background:${bg};">`;

      // No & Tanggal — rowspan, hanya baris pertama
      if(isFirst){
        html += `<td rowspan="${rowspan}" style="padding:9px 8px;text-align:center;font-weight:700;border:1px solid ${borderColor};vertical-align:top;">${no++}</td>`;
        html += `<td rowspan="${rowspan}" style="padding:9px 8px;font-weight:600;color:#0369a1;border:1px solid ${borderColor};vertical-align:top;white-space:nowrap;">${tglStr}</td>`;
      }

      // Barang, Merk, Status — setiap baris
      html += `<td style="padding:8px 8px;border:1px solid ${borderColor};">${b.nama}</td>`;
      html += `<td style="padding:8px 8px;color:var(--text2);border:1px solid ${borderColor};">${b.merk||'—'}</td>`;
      html += `<td style="padding:8px 8px;color:var(--text2);border:1px solid ${borderColor};">${b.ket||'—'}</td>`;

      // Branch & PIC — rowspan, hanya baris pertama
      if(isFirst){
        html += `<td rowspan="${rowspan}" style="padding:9px 8px;font-weight:600;border:1px solid ${borderColor};vertical-align:top;">${branch}</td>`;
        html += `<td rowspan="${rowspan}" style="padding:9px 8px;border:1px solid ${borderColor};vertical-align:top;">${pic}</td>`;
      }

      // Keterangan Penggunaan — per baris dari hasil kegiatan
      html += `<td style="padding:8px 8px;font-size:11px;color:var(--text2);border:1px solid ${borderColor};">${ket}</td>`;

      html += `</tr>`;
    });
  });

  html += `</tbody></table></div>`;
  el.innerHTML = html;
}

function exportExcelBarang(){
  if(!_barangRawData.length){
    showToast('Tampilkan report dulu sebelum export','info'); return;
  }
  const bulan = document.getElementById('barang-filter-bulan')?.value || '';
  const tahun = document.getElementById('barang-filter-tahun')?.value || '';

  const rows = [];
  let no = 1;
  const sortedRecords = [..._barangRawData].sort((a,b)=>String(a.tgl).localeCompare(String(b.tgl)));

  sortedRecords.forEach(r => {
    const tgl = String(r.tgl||'').slice(0,10);
    const tglFormatted = tgl ? new Date(tgl).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
    const serahKe = (r.serahKe||[]).filter(b=>b.nama);
    if(!serahKe.length) return;
    const hasilKeg = (r.kegiatan||[]).map(k=>k.hasil||'').filter(x=>x).join('; ') || '-';
    const currentNo = no++;

    // 1 baris per barang — Tanggal, Branch, PIC, Keterangan hanya di baris pertama
    serahKe.forEach((b, bi) => {
      rows.push({
        'NO'                    : bi===0 ? currentNo : '',
        'TANGGAL'               : bi===0 ? tglFormatted : '',
        'BARANG'                : b.nama||'-',
        'MERK'                  : b.merk||'-',
        'STATUS'                : b.ket||'-',
        'BRANCH OFFICE'         : bi===0 ? (r.bo||'-') : '',
        'PIC AREA'              : bi===0 ? (r.petugasSerah||'-') : '',
        'KETERANGAN PENGGUNAAN' : (r.kegiatan||[])[bi] ? ((r.kegiatan||[])[bi].hasil||'-') : '-',
      });
    });
  });

  if(!rows.length){ showToast('Tidak ada data barang','info'); return; }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:5},{wch:18},{wch:35},{wch:20},{wch:30},{wch:18},{wch:22},{wch:50}];
  XLSX.utils.book_append_sheet(wb, ws, 'Penggunaan Barang');

  const fname = ['Laporan_Barang', bulan, tahun, new Date().toISOString().slice(0,10)].filter(x=>x).join('_') + '.xlsx';
  XLSX.writeFile(wb, fname);
  showToast('✅ Excel berhasil didownload','ok');
}

async function exportOTSExcel(){
  const bulan = document.getElementById('ots-filter-bulan')?.value || new Date().toLocaleString('id',{month:'long'});
  const tahun = String(new Date().getFullYear());
  showOverlay('Mengambil data OTS...');
  try {
    const json = await fetchGAS({action:'getOTS', pin:currentPin, bulan});
    hideOverlay();
    if(json.status!=='ok'||!json.data?.length){
      showToast('Tidak ada data OTS periode ini','info'); return;
    }
    showOverlay('Menyusun Excel OTS...');
    const wb = XLSX.utils.book_new();

    // Sheet Rekap
    const rekapRows = [];
    for(const r of json.data){
      // Ambil detail kegiatan dari Drive
      let kegText = 'Kunjungan OTS ke '+(r.bo||'').toUpperCase();
      try {
        const det = await fetchGAS({action:'getOTSDetail', id:r.id, pin:currentPin});
        if(det.status==='ok' && det.data?.kegiatan?.length){
          kegText = (r.bo||'').toUpperCase()+': '+det.data.kegiatan.map(k=>{
            let t=(k.kegiatan||'').trim();
            if(k.hasil&&k.hasil.trim()) t+=', '+k.hasil.trim();
            return t;
          }).filter(Boolean).join(', ');
        }
      } catch(e){}
      const tglFmt = r.tgl ? new Date(r.tgl).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}) : r.tgl;
      const timArr = Array.isArray(r.timIT) ? r.timIT.join(', ') : (r.timIT||'');
      rekapRows.push({
        'Tanggal': tglFmt,
        'Branch Office': r.bo||'',
        'Tim IT': timArr,
        'Kegiatan': kegText,
        'Petugas BO': r.namaBo||r.petugasBO||'',
        'Jabatan BO': r.jabatanBo||'',
        'Jml Kegiatan': r.jumlahKegiatan||'',
        'Serah Terima': r.adaSerah?'Ya':'Tidak',
      });
    }
    const ws = XLSX.utils.json_to_sheet(rekapRows);
    // Set col widths
    ws['!cols']=[{wch:18},{wch:22},{wch:28},{wch:55},{wch:22},{wch:18},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb,'Laporan OTS '+bulan+' '+tahun,ws);

    const fname = 'Laporan_OTS_'+bulan+'_'+tahun+'.xlsx';
    hideOverlay();
    XLSX.writeFile(wb, fname);
    showToast('File '+fname+' diunduh!','ok');
  } catch(e){
    hideOverlay();
    showToast('Gagal: '+e.message,'err');
  }
}