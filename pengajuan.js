// ═══════════════════════════════════════════════════════════════
//  pengajuan.js — Form & Report Pengajuan Barang + Nota Upload
//  Includes: form input, submit, list report, detail, edit, nota
// ═══════════════════════════════════════════════════════════════

// ── State variables ──────────────────────────────────────────
let _pjbRecords   = [];
let _editNotaBase = [];   // nota existing saat edit
let _editNotaNew  = [];   // nota baru saat edit


function addPjbRow(){
  const tbody = document.getElementById('pjb-barang-body');
  const n = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="padding:6px;border:1px solid var(--border);text-align:center;">${n}</td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Nama barang..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Type..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Brand..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Jumlah..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);text-align:center;">
      <button class="btn-del-row" onclick="this.closest('tr').remove();renumberPjbRows()">×</button>
    </td>`;
  tbody.appendChild(tr);
}

function renumberPjbRows(){
  const rows = document.getElementById('pjb-barang-body')?.rows||[];
  Array.from(rows).forEach((tr,i)=>{ tr.cells[0].textContent=i+1; });
}

function getPjbBarang(){
  const rows = document.getElementById('pjb-barang-body')?.rows||[];
  return Array.from(rows).map((tr,i)=>({
    no: i+1,
    nama: tr.cells[1]?.querySelector('input')?.value?.trim()||'',
    type: tr.cells[2]?.querySelector('input')?.value?.trim()||'',
    brand: tr.cells[3]?.querySelector('input')?.value?.trim()||'',
    jumlah: tr.cells[4]?.querySelector('input')?.value?.trim()||''
  })).filter(r=>r.nama);
}

function resetPengajuan(){
  document.getElementById('pjb-tempat').value='';
  document.getElementById('pjb-tgl').valueAsDate=new Date();
  document.getElementById('pjb-diajukan').value='';
  document.getElementById('pjb-ket').value='';
  const tbody=document.getElementById('pjb-barang-body');
  tbody.innerHTML=`<tr>
    <td style="padding:6px;border:1px solid var(--border);text-align:center;">1</td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Nama barang..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Type..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Brand..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);"><input type="text" placeholder="Jumlah..." style="width:100%;border:none;padding:4px;font-family:inherit;font-size:13px;"></td>
    <td style="padding:4px;border:1px solid var(--border);text-align:center;"></td>
  </tr>`;
  const st=document.getElementById('pjb-status');
  if(st) st.style.display='none';
}

async function submitPengajuan(){
  const tempat  = document.getElementById('pjb-tempat').value.trim();
  const tgl     = document.getElementById('pjb-tgl').value;
  const diajukan= document.getElementById('pjb-diajukan').value.trim();
  const ket     = document.getElementById('pjb-ket').value.trim();
  const barang  = getPjbBarang();

  if(!tempat){ showToast('Isi Nama Tempat/Area dulu','info'); return; }
  if(!tgl){ showToast('Pilih Tanggal dulu','info'); return; }
  if(!diajukan){ showToast('Isi nama yang mengajukan','info'); return; }
  if(!barang.length){ showToast('Tambah minimal 1 barang','info'); return; }

  showOverlay('Menyimpan pengajuan...');

  const id = 'PJB-' + Date.now();
  const payload = { action:'savePengajuan', pin:currentPin, id, tempat, tgl, diajukan, ket, barang, notas:[] };
  const fd = new FormData();
  fd.append('data', JSON.stringify(payload));

  try{
    const res = await fetch(getUrl(),{method:'POST',body:fd});
    const json = await res.json();
    hideOverlay();
    if(json.status==='ok'){
      showToast('Pengajuan berhasil disimpan!','ok');
      // Export PDF langsung
      exportPengajuanPDF({id, tempat, tgl, diajukan, ket, barang, notas:[]});
      resetPengajuan();
    } else {
      showToast('Gagal: '+(json.message||'error'),'err');
    }
  } catch(e){
    hideOverlay();
    showToast('Gagal koneksi: '+e.message,'err');
  }
}

function renderRepPengajuan(records, bulan, tahun){
  const el = document.getElementById('rep-pengajuan-content');
  if(!el) return;

  // Filter
  let filtered = records.filter(r=>{
    const d = new Date(r.tgl);
    const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()];
    const thn = String(d.getFullYear());
    if(bulan && bln!==bulan) return false;
    if(tahun && thn!==tahun) return false;
    return true;
  });

  if(!filtered.length){
    el.innerHTML='<div class="no-data"><div class="no-data-icon">📝</div>Belum ada data pengajuan.</div>';
    return;
  }

  filtered.sort((a,b)=>String(b.tgl).localeCompare(String(a.tgl)));

  el.innerHTML = filtered.map((r,i)=>{
    const tglStr = r.tgl ? new Date(r.tgl).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '-';
    const jmlBarang = (r.barang||[]).length;
    const hasNota = (r.notas||[]).length > 0;
    return `<div class="card" style="margin-bottom:10px;">
      <div class="log-header">
        <div>
          <div class="log-name">${r.tempat||'-'}</div>
          <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge badge-purple">📝 Pengajuan</span>
            ${hasNota?'<span class="badge badge-sent">📎 Ada Nota</span>':'<span class="badge" style="background:#fef3c7;color:#92400e;">📎 Belum Ada Nota</span>'}
          </div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px;">${r.ket||''}</div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <div style="font-size:11px;color:var(--text3);">${tglStr}</div>
          <div style="font-size:11px;color:var(--text2);">${jmlBarang} barang</div>
          <div class="log-actions">
            <button class="btn-sm-edit" onclick="showDetailPengajuan('${r.id}')">👁 Detail</button>
            <button class="btn-sm-edit" style="background:#faf5ff;color:#7c3aed;border-color:#e9d5ff;" onclick="exportPengajuanPDF(pjbById('${r.id}'))">🖨️ PDF</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function pjbById(id){ return _pjbRecords.find(r=>r.id===id)||{}; }

function showDetailPengajuan(id){
  const r = pjbById(id);
  if(!r.id){ showToast('Data tidak ditemukan','info'); return; }
  const tglStr = r.tgl ? new Date(r.tgl).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '-';
  const barang = r.barang||[];
  const notas = r.notas||[];

  // Buka modal detail OTS (gunakan modal yang sama)
  document.getElementById('modal-ots-title').textContent = '📝 Detail Pengajuan — '+r.tempat;
  document.getElementById('modal-ots-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:var(--surface3);border-radius:var(--radius-sm);margin-bottom:14px;">
      <div><div class="detail-label">Tempat / Area</div><div class="detail-val"><strong>${r.tempat}</strong></div></div>
      <div><div class="detail-label">Tanggal</div><div class="detail-val">${tglStr}</div></div>
      <div><div class="detail-label">Diajukan Oleh</div><div class="detail-val">${r.diajukan}</div></div>
      <div><div class="detail-label">Keterangan</div><div class="detail-val">${r.ket||'-'}</div></div>
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px;">Daftar Barang (${barang.length} item)</div>
    <div style="overflow-x:auto;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:var(--surface3);">
          <th style="padding:7px;border:1px solid var(--border);text-align:center;width:36px;">No</th>
          <th style="padding:7px;border:1px solid var(--border);">Nama Barang</th>
          <th style="padding:7px;border:1px solid var(--border);width:100px;">Type</th>
          <th style="padding:7px;border:1px solid var(--border);width:100px;">Brand</th>
          <th style="padding:7px;border:1px solid var(--border);width:80px;">Jumlah</th>
        </tr></thead>
        <tbody>${barang.map((b,i)=>`<tr>
          <td style="padding:7px;border:1px solid var(--border);text-align:center;">${i+1}</td>
          <td style="padding:7px;border:1px solid var(--border);">${b.nama}</td>
          <td style="padding:7px;border:1px solid var(--border);">${b.type||'-'}</td>
          <td style="padding:7px;border:1px solid var(--border);">${b.brand||'-'}</td>
          <td style="padding:7px;border:1px solid var(--border);">${b.jumlah||'-'}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px;">
      📎 Nota Pembelian (${notas.length} foto)
    </div>
    ${notas.length>0
      ?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
          ${notas.map((src,i)=>`<img src="${src}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid var(--border);">`).join('')}
        </div>`
      :'<div style="font-size:12px;color:var(--text3);font-style:italic;margin-bottom:12px;">Belum ada nota pembelian.</div>'
    }
    <!-- Upload Nota -->
    <div style="padding:10px;background:var(--surface3);border-radius:var(--radius-sm);margin-bottom:16px;">
      <div style="font-size:12px;font-weight:600;margin-bottom:8px;">Upload Nota Pembelian:</div>
      <input type="file" id="nota-upload-${r.id}" accept="image/*" multiple style="display:none;" onchange="uploadNota('${r.id}',this)">
      <button class="btn-add-row" onclick="document.getElementById('nota-upload-${r.id}').click()">📷 Pilih Foto Nota</button>
      <div id="nota-preview-${r.id}" style="margin-top:8px;font-size:12px;color:var(--text3);"></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:10px;">
      <button onclick="exportPengajuanPDF(pjbById('${r.id}'))" style="padding:10px 18px;background:#faf5ff;color:#7c3aed;border:1.5px solid #e9d5ff;border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">🖨️ PDF</button>
      <button onclick="closeOTSModal()" style="padding:10px 24px;background:var(--surface3);color:var(--text2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">✕ Tutup</button>
    </div>`;
  document.getElementById('ots-modal').classList.add('show');
}

function uploadNota(id, input){
  const files = Array.from(input.files);
  const previewEl = document.getElementById('nota-preview-'+id);
  if(previewEl) previewEl.textContent = `⏳ Mengupload ${files.length} foto...`;

  Promise.all(files.map(file=>new Promise(res=>{
    const reader=new FileReader();
    reader.onload=e=>res(e.target.result);
    reader.readAsDataURL(file);
  }))).then(async base64s=>{
    const r = pjbById(id);
    const existingNotas = r.notas||[];
    const allNotas = [...existingNotas, ...base64s];

    showOverlay('Menyimpan nota...');
    const payload={action:'updatePengajuanNota', pin:currentPin, id, notas:allNotas};
    const fd=new FormData(); fd.append('data',JSON.stringify(payload));
    try{
      const res=await fetch(getUrl(),{method:'POST',body:fd});
      const json=await res.json();
      hideOverlay();
      if(json.status==='ok'){
        // Update cache
        const idx=_pjbRecords.findIndex(x=>x.id===id);
        if(idx>=0) _pjbRecords[idx]={..._pjbRecords[idx],notas:allNotas};
        showToast('Nota berhasil diupload!','ok');
        closeOTSModal();
        // Re-open detail dengan data baru
        setTimeout(()=>showDetailPengajuan(id),200);
      } else {
        if(previewEl) previewEl.textContent='❌ Gagal upload';
        showToast('Gagal: '+(json.message||'error'),'err');
      }
    } catch(e){
      hideOverlay();
      if(previewEl) previewEl.textContent='❌ Error: '+e.message;
    }
  });
  input.value='';
}

function addPengajuanItem(){
  const nama   = document.getElementById('pjn-b-nama').value.trim();
  const type   = document.getElementById('pjn-b-type').value.trim();
  const brand  = document.getElementById('pjn-b-brand').value.trim();
  const jumlah = document.getElementById('pjn-b-jumlah').value.trim();
  if(!nama){ showToast('Isi Nama Barang dulu','info'); return; }
  pjnItems.push({ no: pjnItems.length+1, nama, type, brand, jumlah });
  renderPjnItems();
  // Clear input field
  document.getElementById('pjn-b-nama').value='';
  document.getElementById('pjn-b-type').value='';
  document.getElementById('pjn-b-brand').value='';
  document.getElementById('pjn-b-jumlah').value='';
  document.getElementById('pjn-b-nama').focus();
}

function deletePjnItem(idx){
  pjnItems.splice(idx,1);
  pjnItems.forEach((b,i)=>b.no=i+1);
  renderPjnItems();
}

function renderPjnItems(){
  const el = document.getElementById('pjn-items-list');
  if(!el) return;
  if(!pjnItems.length){
    el.innerHTML='<div style="font-size:12px;color:var(--text3);font-style:italic;padding:8px 0;">Belum ada barang ditambahkan.</div>';
    return;
  }
  el.innerHTML=`
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:6px;">Daftar Barang (${pjnItems.length} item)</div>
    <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:var(--surface3);">
        <th style="padding:7px 8px;width:30px;">No</th>
        <th style="padding:7px 8px;text-align:left;">Nama Barang</th>
        <th style="padding:7px 8px;text-align:left;">Type</th>
        <th style="padding:7px 8px;text-align:left;">Brand</th>
        <th style="padding:7px 8px;text-align:left;">Jumlah</th>
        <th style="width:30px;"></th>
      </tr></thead>
      <tbody>
        ${pjnItems.map((b,i)=>`<tr style="background:${i%2===0?'#fff':'var(--surface2)'};">
          <td style="padding:7px 8px;text-align:center;">${b.no}</td>
          <td style="padding:7px 8px;">${b.nama}</td>
          <td style="padding:7px 8px;">${b.type||'-'}</td>
          <td style="padding:7px 8px;">${b.brand||'-'}</td>
          <td style="padding:7px 8px;">${b.jumlah||'-'}</td>
          <td style="padding:7px 8px;text-align:center;"><button class="btn-del-row" onclick="deletePjnItem(${i})">×</button></td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
}

function getPengajuanItems(){
  return [...pjnItems];
}

function renumberPengajuanRows(){}

function resetPengajuanForm(){
  document.getElementById('pjn-tempat').value='';
  document.getElementById('pjn-tgl').valueAsDate=new Date();
  document.getElementById('pjn-ket').value='';
  document.getElementById('pjn-b-nama').value='';
  document.getElementById('pjn-b-type').value='';
  document.getElementById('pjn-b-brand').value='';
  document.getElementById('pjn-b-jumlah').value='';
  pjnItems=[];
  renderPjnItems();
  const s=document.getElementById('pjn-status');
  if(s){s.style.display='none';}
}

async function simpanPengajuan(){
  const tempat = document.getElementById('pjn-tempat').value.trim();
  const tgl    = document.getElementById('pjn-tgl').value;
  const ket    = document.getElementById('pjn-ket').value.trim();
  const items  = getPengajuanItems();

  if(!tempat){showToast('Isi Nama Tempat dulu','info');return;}
  if(!tgl){showToast('Pilih Tanggal dulu','info');return;}
  if(!items.length){showToast('Isi minimal 1 barang','info');return;}

  const statusEl = document.getElementById('pjn-status');
  statusEl.style.display='block';
  statusEl.style.background='#e3f2fd';
  statusEl.style.color='#1565c0';
  statusEl.textContent='⏳ Menyimpan...';

  const id = 'PJN-'+Date.now();
  const payload = {
    action:'savePengajuan', pin:currentPin,
    id, tempat, tgl, ket, items,
    notas:[] // foto nota belum ada saat pertama simpan
  };

  try{
    const fd=new FormData();
    fd.append('data',JSON.stringify(payload));
    const res=await fetch(getUrl(),{method:'POST',body:fd});
    const json=await res.json();
    if(json.status==='ok'){
      statusEl.style.background='#e8f5e9';
      statusEl.style.color='#2e7d32';
      statusEl.textContent='✅ Berhasil disimpan!';
      // Cetak PDF
      exportPengajuanPDF({id,tempat,tgl,ket,items,notas:[]});
      setTimeout(()=>{resetPengajuanForm();},1500);
    } else {
      statusEl.style.background='#ffebee';
      statusEl.style.color='#c62828';
      statusEl.textContent='❌ Gagal: '+(json.message||'error');
    }
  } catch(e){
    statusEl.style.background='#ffebee';
    statusEl.style.color='#c62828';
    statusEl.textContent='❌ Error: '+e.message;
  }
}

function exportPengajuanPDF(r){
  const tglStr = r.tgl ? new Date(r.tgl).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
  const itemRows = (r.items||[]).map((b,i)=>`<tr>
    <td style="border:1px solid #000;padding:7px 8px;text-align:center;">${b.no||i+1}</td>
    <td style="border:1px solid #000;padding:7px 8px;">${b.nama||''}</td>
    <td style="border:1px solid #000;padding:7px 8px;">${b.type||''}</td>
    <td style="border:1px solid #000;padding:7px 8px;">${b.brand||''}</td>
    <td style="border:1px solid #000;padding:7px 8px;">${b.jumlah||''}</td>
  </tr>`).join('');

  // Nota foto
  const notaHtml = (r.notas||[]).length>0
    ? `<div style="margin-top:20px;"><div style="font-weight:700;font-size:12pt;margin-bottom:10px;">Nota Pembelian:</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
          ${(r.notas||[]).map(src=>`<img src="${src}" style="width:100%;object-fit:contain;border:1px solid #ccc;">`).join('')}
        </div></div>` : '';

  const KOP_PDF = `<table width="100%" style="border-collapse:collapse;margin-bottom:0;"><tr>
    <td width="85" style="border:none;padding:0;vertical-align:middle;">
      <img src="${LOGO_KOP_B64}" style="height:68px;width:auto;display:block;">
    </td>
    <td style="border:none;padding:0 8px;vertical-align:middle;text-align:center;">
      <div style="font-weight:700;font-size:12.5pt;font-family:Arial;">CU KELING KUMANG</div>
      <div style="font-size:7.5pt;font-family:Arial;margin-top:2px;">Jln. Sekadau - Sintang Km 27, Dusun Tapang Sambas-Tapang Kemayau</div>
      <div style="font-size:7.5pt;font-family:Arial;">Desa Tapang Semadak, Kecamatan Sekadau Hilir, 79513, Kabupaten Sekadau, Kalimantan Barat</div>
      <div style="font-size:7.5pt;font-family:Arial;">E-mail: invictus93@cukelingkumang.com | Website: www.cukelingkumang.com | Telp./WA: (+628)115711132</div>
    </td>
    <td width="85" style="border:none;padding:0;vertical-align:middle;text-align:right;">
      <img src="${LOGO_CUKK_B64}" style="height:68px;width:auto;display:block;margin-left:auto;">
    </td>
  </tr></table>
  <div style="border-top:3px double #000;margin:6px 0 12px;"></div>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Pengajuan Barang - ${r.tempat}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;font-size:11pt;color:#000;padding:15mm 15mm 12mm 15mm;}
  @page{size:A4 portrait;margin:0;}
  @media print{body{padding:15mm 15mm 12mm 15mm;}button{display:none!important;}}
  table{border-collapse:collapse;width:100%;}
  th,td{border:1px solid #000;padding:7px 8px;}
  th{background:#f0f0f0;font-weight:700;text-align:center;}
</style>
</head>
<body>
  ${KOP_PDF}
  <div style="text-align:center;font-weight:700;font-size:15pt;margin-bottom:12px;text-decoration:underline;">PENGAJUAN BARANG INVENTARIS KANTOR</div>
  <div style="margin-bottom:12px;font-size:11pt;">${r.ket||'Berikut daftar barang yang diajukan:'}</div>
  <table style="margin-bottom:20px;">
    <thead>
      <tr>
        <th style="width:36px;">NO</th>
        <th>NAMA BARANG</th>
        <th style="width:130px;">TYPE</th>
        <th style="width:110px;">BRAND</th>
        <th style="width:100px;">JUMLAH</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div style="margin-bottom:24px;font-size:11pt;">${r.tempat}, ${tglStr}</div>
  <table style="border:none;width:100%;">
    <tr>
      <td style="border:none;width:33%;vertical-align:top;">
        <div>Diajukan oleh :</div>
        <div style="font-weight:700;">Manager Bidang H&amp;N</div>
        <div style="height:60px;"></div>
        <div style="border-top:1px solid #000;padding-top:4px;">&nbsp;</div>
        <div>Tgl:</div>
      </td>
      <td style="border:none;width:33%;vertical-align:top;text-align:center;">
        <div>Diketahui oleh:</div>
        <div style="font-weight:700;">DEM ITD</div>
        <div style="height:60px;"></div>
        <div style="border-top:1px solid #000;padding-top:4px;">&nbsp;</div>
        <div>Tgl:</div>
      </td>
      <td style="border:none;width:33%;vertical-align:top;text-align:center;">
        <div>Diketahui oleh:</div>
        <div style="font-weight:700;">DEM APD</div>
        <div style="height:60px;"></div>
        <div style="border-top:1px solid #000;padding-top:4px;">&nbsp;</div>
        <div>Tgl:</div>
      </td>
    </tr>
  </table>
  ${notaHtml}
  <div class="no-print" style="position:fixed;bottom:20px;right:20px;">
    <button onclick="window.print()" style="padding:10px 20px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">🖨️ Print / Simpan PDF</button>
  </div>
</body></html>`;

  const w=window.open('','_blank','width=850,height=1100');
  if(!w||w.closed){
    const blob=new Blob([html],{type:'text/html'});
    window.open(URL.createObjectURL(blob),'_blank');
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(),600);
}

async function loadReportPengajuan(){
  const bulan = document.getElementById('pjn-filter-bulan')?.value||'';
  const el = document.getElementById('report-pengajuan-content');
  el.innerHTML='<div class="loading-text">⏳ Memuat data...</div>';
  try{
    const json=await fetchGAS({action:'getPengajuan',pin:currentPin,bulan});
    if(json.status!=='ok'){el.innerHTML='<div class="no-data">Gagal load data.</div>';return;}
    _pengajuanRecords=json.data||[];
    renderReportPengajuan(_pengajuanRecords,bulan);
  }catch(e){
    el.innerHTML='<div class="no-data">Gagal koneksi.</div>';
  }
}

function renderReportPengajuan(records, bulan){
  const el=document.getElementById('report-pengajuan-content');
  if(!el)return;
  const filtered=bulan?records.filter(r=>{
    const d=new Date(r.tgl);
    const BN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return BN[d.getMonth()]===bulan;
  }):records;

  if(!filtered.length){
    el.innerHTML='<div class="no-data"><div class="no-data-icon">🛒</div>Belum ada data pengajuan'+(bulan?' bulan '+bulan:'')+'.</div>';
    return;
  }

  const rows=filtered.map(r=>{
    const tglStr=r.tgl?new Date(r.tgl).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'-';
    let items = r.items||[];
    if(typeof items==='string'){try{items=JSON.parse(items);}catch(e){items=[];}}
    const jumlahItem=items.length;
    const hasNota=(r.notas||[]).length>0;
    return `<tr style="border-bottom:1px solid var(--border);">
      <td style="padding:10px 8px;font-weight:600;color:#7c3aed;white-space:nowrap;">${tglStr}</td>
      <td style="padding:10px 8px;font-weight:600;">${r.tempat||'-'}</td>
      <td style="padding:10px 8px;font-size:12px;color:var(--text2);">${r.ket||'-'}</td>
      <td style="padding:10px 8px;text-align:center;"><span class="badge" style="background:#7c3aed20;color:#7c3aed;">${jumlahItem} item</span></td>
      <td style="padding:10px 8px;text-align:center;">${hasNota?'<span class="badge badge-green">✓ Ada</span>':'<span class="badge" style="background:#f1f5f9;color:#94a3b8;">Belum</span>'}</td>
      <td style="padding:10px 8px;">
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="btn-sm-edit" style="background:#eff6ff;color:#2563eb;" onclick="editPengajuanReport('${r.id}')">✏️ Edit</button>
          <button class="btn-sm-edit" style="background:#fef2f2;color:#b91c1c;border-color:#fca5a5;" onclick="hapusPengajuan('${r.id}')">🗑 Hapus</button>
          <button class="btn-sm-edit" style="background:#faf5ff;color:#7c3aed;border-color:#e9d5ff;" onclick="exportPengajuanPDF(pengajuanById('${r.id}'))">📄 PDF</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML=`<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:var(--surface3);">
        <th style="padding:9px 8px;text-align:left;">Tanggal</th>
        <th style="padding:9px 8px;text-align:left;">Tempat</th>
        <th style="padding:9px 8px;text-align:left;">Keterangan</th>
        <th style="padding:9px 8px;text-align:center;">Item</th>
        <th style="padding:9px 8px;text-align:center;">Nota</th>
        <th style="padding:9px 8px;text-align:left;">Aksi</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="font-size:12px;color:var(--text3);margin-top:8px;text-align:right;">Total: ${filtered.length} pengajuan</div>
  </div>`;
}

async function hapusPengajuan(id){
  if(!confirm('Hapus pengajuan ini? Data tidak bisa dikembalikan.')) return;
  showOverlay('Menghapus pengajuan...');
  try {
    var fd=new FormData();
    fd.append('data',JSON.stringify({action:'deletePengajuan',pin:currentPin,id}));
    var res=await fetch(getUrl(),{method:'POST',body:fd});
    var json=await res.json();
    hideOverlay();
    if(json.status==='ok'){
      _pengajuanRecords=(_pengajuanRecords||[]).filter(r=>r.id!==id);
      showToast('Pengajuan dihapus','ok');
      renderReportPengajuan(_pengajuanRecords,'');
    } else showToast('Gagal: '+(json.message||'error'),'err');
  } catch(e){hideOverlay();showToast('Gagal: '+e.message,'err');}
}

function pengajuanById(id){
  return _pengajuanRecords.find(r=>r.id===id)||{};
}

function detailPengajuan(id){
  const r=_pengajuanRecords.find(x=>x.id===id);
  if(!r){showToast('Data tidak ditemukan','info');return;}
  // Pastikan items dan notas sudah di-parse (bukan string JSON)
  if(typeof r.items === 'string') try{r.items=JSON.parse(r.items);}catch(e){r.items=[];}
  if(typeof r.notas === 'string') try{r.notas=JSON.parse(r.notas);}catch(e){r.notas=[];}
  const tglStr=r.tgl?new Date(r.tgl).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'-';
  const itemRows=(r.items||[]).map((b,i)=>`<tr style="background:${i%2===0?'#fff':'var(--surface2)'};">
    <td style="padding:7px 8px;text-align:center;">${b.no||i+1}</td>
    <td style="padding:7px 8px;">${b.nama||'-'}</td>
    <td style="padding:7px 8px;">${b.type||'-'}</td>
    <td style="padding:7px 8px;">${b.brand||'-'}</td>
    <td style="padding:7px 8px;">${b.jumlah||'-'}</td>
  </tr>`).join('');

  const notaHtml=(r.notas||[]).length>0
    ?`<div style="margin-top:14px;"><div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px;">Nota Pembelian</div>
       <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
         ${(r.notas||[]).map((src,i)=>`<div style="position:relative;">
           <img src="${src}" style="width:100%;border-radius:6px;border:1px solid var(--border);object-fit:contain;">
           <button onclick="deleteNota('${id}',${i})" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;">×</button>
         </div>`).join('')}
       </div></div>`
    :'<div style="font-size:12px;color:var(--text3);font-style:italic;margin-top:10px;">Belum ada nota pembelian</div>';

  // Modal
  document.getElementById('modal-ots-title').textContent='🛒 Detail Pengajuan — '+r.tempat;
  document.getElementById('modal-ots-body').innerHTML=`
    <div style="background:var(--surface3);padding:12px;border-radius:var(--radius-sm);margin-bottom:14px;">
      <div style="font-size:12px;"><b>Tempat:</b> ${r.tempat}</div>
      <div style="font-size:12px;margin-top:4px;"><b>Tanggal:</b> ${tglStr}</div>
      <div style="font-size:12px;margin-top:4px;"><b>Keterangan:</b> ${r.ket||'-'}</div>
    </div>
    <div style="overflow-x:auto;margin-bottom:12px;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:var(--surface3);">
          <th style="padding:7px 8px;width:36px;text-align:center;">No</th>
          <th style="padding:7px 8px;text-align:left;">Nama Barang</th>
          <th style="padding:7px 8px;text-align:left;">Type</th>
          <th style="padding:7px 8px;text-align:left;">Brand</th>
          <th style="padding:7px 8px;text-align:left;">Jumlah</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    ${notaHtml}
    <!-- Upload Nota -->
    <div style="margin-top:14px;padding:12px;border:2px dashed var(--border2);border-radius:var(--radius-sm);text-align:center;">
      <div style="font-size:12px;color:var(--text2);margin-bottom:8px;">📷 Upload Nota Pembelian</div>
      <input type="file" id="nota-upload-input" accept="image/*" multiple style="display:none;" onchange="uploadNota('${id}',event)">
      <button class="btn-outline" onclick="document.getElementById('nota-upload-input').click()">+ Pilih Foto Nota</button>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button onclick="exportPengajuanPDF(pengajuanById('${id}'))" style="flex:1;padding:10px;background:#faf5ff;color:#7c3aed;border:1.5px solid #e9d5ff;border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">🖨️ Export PDF</button>
      <button onclick="closeOTSModal()" style="padding:10px 20px;background:var(--surface3);color:var(--text2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">✕ Tutup</button>
    </div>`;
  document.getElementById('ots-modal').classList.add('show');
}

function editPengajuanReport(id){
  var r = (_pengajuanRecords||[]).find(function(x){return x.id===id;});
  if(!r){showToast('Data tidak ditemukan','info');return;}
  try{if(typeof r.items==='string') r.items=JSON.parse(r.items);}catch(e){r.items=[];}
  try{if(typeof r.notas==='string')  r.notas=JSON.parse(r.notas);}catch(e){r.notas=[];}
  _editingPjnId = id;

  var itemRows = '';
  var items = r.items||[];
  for(var ii=0;ii<items.length;ii++){
    var b=items[ii];
    itemRows += '<tr id="pjn-edit-row-'+ii+'">';
    itemRows += '<td style="padding:4px;"><input class="pjn-input" value="'+(b.nama||'')+'" id="pe-nama-'+ii+'" placeholder="Nama Barang"></td>';
    itemRows += '<td style="padding:4px;"><input class="pjn-input" value="'+(b.type||'')+'" id="pe-type-'+ii+'" placeholder="Type"></td>';
    itemRows += '<td style="padding:4px;"><input class="pjn-input" value="'+(b.brand||'')+'" id="pe-brand-'+ii+'" placeholder="Brand"></td>';
    itemRows += '<td style="padding:4px;"><input class="pjn-input" value="'+(b.jumlah||'')+'" id="pe-jumlah-'+ii+'" placeholder="Jumlah"></td>';
    itemRows += '<td style="padding:4px;text-align:center;"><button onclick="removePjnEditRow('+ii+')" class="btn-danger-sm">✕</button></td>';
    itemRows += '</tr>';
  }

  var bodyHtml = '';
  bodyHtml += '<div style="background:var(--surface3);padding:12px;border-radius:var(--radius-sm);margin-bottom:14px;">';
  bodyHtml += '<div class="form-row">';
  bodyHtml += '<div class="form-group"><label>Tempat</label><input type="text" id="pe-tempat" class="input-field" value="'+(r.tempat||'')+'"></div>';
  bodyHtml += '<div class="form-group"><label>Tanggal</label><input type="date" id="pe-tgl" class="input-field" value="'+(r.tgl||'')+'"></div>';
  bodyHtml += '</div>';
  bodyHtml += '<div class="form-group"><label>Keterangan</label><input type="text" id="pe-ket" class="input-field" value="'+(r.ket||'')+'"></div>';
  bodyHtml += '</div>';
  bodyHtml += '<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px;">Daftar Barang</div>';
  bodyHtml += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;" id="pjn-edit-table">';
  bodyHtml += '<thead><tr style="background:var(--surface3);"><th style="padding:7px 8px;text-align:left;">Nama</th><th style="padding:7px 8px;text-align:left;">Type</th><th style="padding:7px 8px;text-align:left;">Brand</th><th style="padding:7px 8px;text-align:left;">Jumlah</th><th></th></tr></thead>';
  bodyHtml += '<tbody id="pjn-edit-tbody">'+itemRows+'</tbody></table></div>';
  bodyHtml += '<button onclick="addPjnEditRow()" class="btn-outline" style="margin-top:8px;width:100%;">+ Tambah Baris</button>';

  // ── Nota Pembelian ───────────────────────────────────────
  var existNotas = r.notas||[];
  window._editNotaBase = existNotas.slice(); // existing nota refs
  window._editNotaNew  = [];                 // new images as base64
  bodyHtml += '<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">';
  bodyHtml += '<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;margin-bottom:8px;">📎 Nota Pembelian</div>';
  bodyHtml += '<div id="nota-edit-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">';
  existNotas.forEach(function(src,i){
    bodyHtml += '<div id="nota-edit-img-'+i+'" style="position:relative;">';
    bodyHtml += '<img src="'+src+'" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid var(--border);">';
    bodyHtml += '<button onclick="_removeNotaEdit('+i+')" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.65);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;line-height:1;">×</button>';
    bodyHtml += '</div>';
  });
  bodyHtml += '</div>';
  bodyHtml += '<input type="file" id="nota-edit-file" accept="image/*" multiple style="display:none;" onchange="_onNotaEditFile(this)">';
  bodyHtml += '<button class="btn-outline" onclick="document.getElementById(\'nota-edit-file\').click()" style="width:100%;font-size:12px;margin-bottom:0;">📷 Tambah Foto Nota</button>';
  bodyHtml += '<div id="nota-edit-status" style="font-size:11px;color:var(--text3);margin-top:4px;"></div>';
  bodyHtml += '</div>';

  bodyHtml += '<div style="display:flex;gap:10px;margin-top:16px;">';
  bodyHtml += '<button onclick="savePengajuanEdit(\''+id+'\')" class="btn-primary" style="flex:1;margin-top:0;padding:10px;">💾 Simpan</button>';
  bodyHtml += '<button onclick="closeOTSModal()" style="padding:10px 20px;background:var(--surface3);color:var(--text2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">✕ Batal</button>';
  bodyHtml += '</div>';

  document.getElementById('modal-ots-title').textContent = 'Edit Pengajuan — '+(r.tempat||'');
  document.getElementById('modal-ots-body').innerHTML = bodyHtml;
  document.getElementById('ots-modal').classList.add('show');
}

function addPjnEditRow(){
  var tbody = document.getElementById('pjn-edit-tbody');
  if(!tbody) return;
  var i = tbody.querySelectorAll('tr').length;
  var tr = document.createElement('tr');
  tr.id = 'pjn-edit-row-'+i;
  tr.innerHTML = '<td style="padding:4px;"><input class="pjn-input" id="pe-nama-'+i+'" placeholder="Nama Barang"></td>'
    +'<td style="padding:4px;"><input class="pjn-input" id="pe-type-'+i+'" placeholder="Type"></td>'
    +'<td style="padding:4px;"><input class="pjn-input" id="pe-brand-'+i+'" placeholder="Brand"></td>'
    +'<td style="padding:4px;"><input class="pjn-input" id="pe-jumlah-'+i+'" placeholder="Jumlah"></td>'
    +'<td style="padding:4px;text-align:center;"><button onclick="removePjnEditRow('+i+')" class="btn-danger-sm">x</button></td>';
  tbody.appendChild(tr);
}

function removePjnEditRow(i){
  var row = document.getElementById('pjn-edit-row-'+i);
  if(row) row.remove();
}

async function savePengajuanEdit(id){
  var tempat = (document.getElementById('pe-tempat')?.value||'').trim();
  var tgl    = document.getElementById('pe-tgl')?.value||'';
  var ket    = (document.getElementById('pe-ket')?.value||'').trim();
  var tbody  = document.getElementById('pjn-edit-tbody');
  if(!tempat){showToast('Isi Tempat/Lokasi','info');return;}

  var items = [];
  var no = 1;
  tbody.querySelectorAll('tr').forEach(function(row){
    var idx = row.id.replace('pjn-edit-row-','');
    var nama   = (document.getElementById('pe-nama-'+idx)?.value||'').trim();
    var type   = (document.getElementById('pe-type-'+idx)?.value||'').trim();
    var brand  = (document.getElementById('pe-brand-'+idx)?.value||'').trim();
    var jumlah = (document.getElementById('pe-jumlah-'+idx)?.value||'').trim();
    if(nama) items.push({no:no++, nama, type, brand, jumlah});
  });

  var r = (_pengajuanRecords||[]).find(function(x){return x.id===id;})||{};
  // Gabungkan nota existing (sudah dikurangi yg dihapus) + nota baru
  var finalNotas = (window._editNotaBase||r.notas||[]).concat(window._editNotaNew||[]);
  showOverlay('Menyimpan perubahan...');
  try {
    var payload = {action:'updatePengajuanFull', pin:currentPin, id, tempat, tgl, ket, items, notas:finalNotas};
    var fd = new FormData();
    fd.append('data', JSON.stringify(payload));
    var res  = await fetch(getUrl(), {method:'POST', body:fd});
    var json = await res.json();
    hideOverlay();
    if(json.status === 'ok'){
      var ci = (_pengajuanRecords||[]).findIndex(function(x){return x.id===id;});
      if(ci>=0) _pengajuanRecords[ci] = Object.assign({}, _pengajuanRecords[ci], {tempat, tgl, ket, items, notas:finalNotas});
      window._editNotaBase=[]; window._editNotaNew=[];
      showToast('Pengajuan berhasil diupdate!','ok');
      closeOTSModal();
      renderReportPengajuan(_pengajuanRecords,'');
    } else {
      showToast('Gagal: '+(json.message||'error'),'err');
    }
  } catch(e){hideOverlay();showToast('Gagal: '+e.message,'err');}
}

function _removeNotaEdit(idx){
  if(window._editNotaBase && idx < window._editNotaBase.length){
    window._editNotaBase.splice(idx,1);
  }
  var el=document.getElementById('nota-edit-img-'+idx);
  if(el) el.remove();
  var st=document.getElementById('nota-edit-status');
  if(st) st.textContent='Foto '+idx+' dihapus.';
}

function _onNotaEditFile(input){
  var files=Array.from(input.files||[]);
  if(!files.length) return;
  var st=document.getElementById('nota-edit-status');
  if(st) st.textContent='Membaca '+files.length+' foto...';
  Promise.all(files.map(function(f){
    return new Promise(function(res){
      var r=new FileReader();
      r.onload=function(e){res(e.target.result);};
      r.readAsDataURL(f);
    });
  })).then(function(results){
    if(!window._editNotaNew) window._editNotaNew=[];
    window._editNotaNew=window._editNotaNew.concat(results);
    var grid=document.getElementById('nota-edit-grid');
    if(grid){
      results.forEach(function(src,i){
        var div=document.createElement('div');
        div.style.cssText='position:relative;';
        div.innerHTML='<img src="'+src+'" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid var(--border);">';
        grid.appendChild(div);
      });
    }
    if(st) st.textContent=results.length+' foto baru ditambahkan. Klik Simpan untuk menyimpan.';
  });
}