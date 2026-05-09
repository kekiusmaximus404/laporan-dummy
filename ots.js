// ═══════════════════════════════════════════════════════════════
//  ots.js — OTS: form input, log, detail, edit, kirim, rekap
// ═══════════════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────
var otsFotos = [];

function toggleSerahTerima(){
  const show=document.getElementById('ots-serah-toggle').checked;
  document.getElementById('ots-serah-section').style.display=show?'block':'none';
}

function addTimIT(){
  const list=document.getElementById('tim-it-list');
  const n=list.children.length+1;
  const div=document.createElement('div');
  div.className='tim-it-row';
  div.style.cssText='display:flex;gap:8px;margin-bottom:6px;align-items:center;';
  div.innerHTML=`<input type="text" placeholder="Nama tim IT ke-${n}" style="flex:1;"><button class="btn-del-row" onclick="this.parentElement.remove()">×</button>`;
  list.appendChild(div);
}

function getTimIT(){
  const rows=document.getElementById('tim-it-list')?.querySelectorAll('.tim-it-row input')||[];
  return Array.from(rows).map(i=>i.value.trim()).filter(v=>v);
}

function addKegiatanRow(){
  const tbody=document.getElementById('ots-kegiatan-body');
  const n=tbody.rows.length+1;
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${n}</td><td><input type="text" placeholder="Isi kegiatan..."></td><td><textarea placeholder="Hasil kegiatan..."></textarea></td><td style="text-align:center;color:var(--text2);font-size:12px;font-weight:500;">All Team</td><td><button class="btn-del-row" onclick="this.closest('tr').remove();renumberRows('ots-kegiatan-body')">×</button></td>`;
  tbody.appendChild(tr);
}

function addSerahRow(tbodyId){
  const tbody=document.getElementById(tbodyId);
  const n=tbody.rows.length+1;
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${n}</td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><button class="btn-del-row" onclick="this.closest('tr').remove();renumberRows('${tbodyId}')">×</button></td>`;
  tbody.appendChild(tr);
}

function renumberRows(tbodyId){
  const tbody=document.getElementById(tbodyId);
  Array.from(tbody.rows).forEach((tr,i)=>{tr.cells[0].textContent=i+1;});
}

function handleFotoUpload(event){
  const files=Array.from(event.target.files);
  files.forEach(file=>{
    if(otsFotos.length>=6){showToast('Maks 6 foto','info');return;}
    const reader=new FileReader();
    reader.onload=e=>{otsFotos.push(e.target.result);renderFotoGrid();};
    reader.readAsDataURL(file);
  });
  event.target.value='';
}

function renderFotoGrid(){
  const grid=document.getElementById('foto-grid');
  if(!grid)return;
  grid.innerHTML='';
  otsFotos.forEach((src,i)=>{
    const div=document.createElement('div');
    div.className='foto-item';
    div.innerHTML=`<img src="${src}"><button class="foto-del" onclick="deleteFoto(${i})">×</button>`;
    grid.appendChild(div);
  });
  if(otsFotos.length<6){
    const add=document.createElement('div');
    add.className='foto-item foto-add';
    add.innerHTML='<div class="foto-placeholder">📷<br>Tambah foto</div>';
    add.onclick=()=>document.getElementById('foto-input').click();
    grid.appendChild(add);
  }
}

function deleteFoto(i){otsFotos.splice(i,1);renderFotoGrid();}

function getKegiatanData(){
  const rows=document.getElementById('ots-kegiatan-body')?.rows||[];
  return Array.from(rows).map((tr,i)=>{
    return {no:i+1,kegiatan:tr.cells[1]?.querySelector('input')?.value||'',hasil:tr.cells[2]?.querySelector('textarea')?.value||'',petugas:'All Team'};
  }).filter(r=>r.kegiatan);
}

function getSerahData(tbodyId){
  const rows=document.getElementById(tbodyId)?.rows||[];
  return Array.from(rows).map((tr,i)=>{
    return {no:i+1,nama:tr.cells[1]?.querySelector('input')?.value||'',merk:tr.cells[2]?.querySelector('input')?.value||'',code:tr.cells[3]?.querySelector('input')?.value||'',ket:tr.cells[4]?.querySelector('input')?.value||''};
  }).filter(r=>r.nama);
}

function clearOTSForm(){
  document.getElementById('ots-bo').value='';
  document.getElementById('ots-tgl').valueAsDate=new Date();
  document.getElementById('ots-bm').value='';
  if(document.getElementById('ots-jabatan-bo')) document.getElementById('ots-jabatan-bo').value='Branch Manager';
  if(document.getElementById('ots-petugas')) document.getElementById('ots-petugas').value='';
  const timList=document.getElementById('tim-it-list');
  if(timList) timList.innerHTML='<div class="tim-it-row" style="display:flex;gap:8px;margin-bottom:6px;align-items:center;"><input type="text" placeholder="Nama tim IT ke-1" style="flex:1;"><button class="btn-del-row" onclick="this.parentElement.remove()">×</button></div>';
  const tbody=document.getElementById('ots-kegiatan-body');
  if(tbody){tbody.innerHTML='';for(let i=1;i<=3;i++){const tr=document.createElement('tr');tr.innerHTML=`<td>${i}</td><td><input type="text" placeholder="Isi kegiatan..."></td><td><textarea placeholder="Hasil kegiatan..."></textarea></td><td style="text-align:center;color:var(--text2);font-size:12px;">All Team</td><td></td>`;tbody.appendChild(tr);}}
  otsFotos=[];renderFotoGrid();
  document.getElementById('ots-serah-toggle').checked=false;
  document.getElementById('ots-serah-section').style.display='none';
  editingOtsId=null;
  const statusEl=document.getElementById('ots-status');
  if(statusEl){statusEl.style.display='none';}
}

function kirimOTS(){
  const bo=document.getElementById('ots-bo').value.trim();
  const tgl=document.getElementById('ots-tgl').value;
  const namaBo=document.getElementById('ots-bm').value.trim();
  const jabatanBo=document.getElementById('ots-jabatan-bo')?.value||'Branch Manager';
  const petugasSerah=document.getElementById('ots-petugas')?.value||'';
  const timIT=getTimIT();
  if(!bo||!tgl){showToast('Lengkapi Nama BO dan Tanggal','info');return;}
  if(!namaBo){showToast('Isi nama Petugas BO','info');return;}
  if(timIT.length===0){showToast('Isi minimal 1 nama Tim IT','info');return;}
  const kegiatan=getKegiatanData();
  if(kegiatan.length===0){showToast('Isi minimal 1 kegiatan','info');return;}
  const adaSerah=document.getElementById('ots-serah-toggle').checked;
  const serahKe=adaSerah?getSerahData('serah-ke-body'):[];
  const bawaPulang=adaSerah?getSerahData('bawa-body'):[];
  const isEdit=!!editingOtsId;
  if(!confirm((isEdit?'Update':'Kirim')+' Form OTS?\nBranch: '+bo+'\nTim IT: '+timIT.join(', ')))return;
  const statusEl=document.getElementById('ots-status');
  if(statusEl){statusEl.style.display='block';statusEl.style.background='#e3f2fd';statusEl.style.color='#1565c0';statusEl.textContent='⏳ Mengirim...';}
  const payload={action:isEdit?'updateOTS':'saveOTS',pin:currentPin,id:editingOtsId||null,bo,tgl,namaBo,jabatanBo,petugasSerah,timIT,kegiatan,adaSerah,serahKe,bawaPulang,fotos:otsFotos};
  const fd=new FormData();fd.append('data',JSON.stringify(payload));
  fetch(getUrl(),{method:'POST',body:fd}).then(r=>r.json()).then(json=>{
    if(json.status==='ok'){
      if(statusEl){statusEl.style.background='#e8f5e9';statusEl.style.color='#2e7d32';statusEl.textContent='✅ Berhasil! ID: '+(json.id||'-');}
      showToast(isEdit?'OTS diupdate!':'OTS terkirim!','ok');
      editingOtsId=null;otsReportLoaded=false;
      setTimeout(()=>{
        exportOtsPDF();
        clearOTSForm();
        // Kembali ke form OTS bersih
        switchSub('ots','input');
      },500);
    }else{
      if(statusEl){statusEl.style.background='#ffebee';statusEl.style.color='#c62828';statusEl.textContent='❌ Gagal: '+(json.message||'error');}
    }
  }).catch(e=>{if(statusEl){statusEl.style.background='#ffebee';statusEl.style.color='#c62828';statusEl.textContent='❌ Error: '+e.message;}});
}

async function loadLogOTS(){
  const el = document.getElementById('log-ots-content');
  el.innerHTML = '<div class="loading-text">⏳ Memuat data OTS...</div>';
  try{
    const json = await fetchGAS({action:'getOTS', pin:currentPin, bulan:''});
    if(json.status !== 'ok'){ el.innerHTML='<div class="no-data">Gagal load data OTS.</div>'; return; }
    const data = json.data || [];
    // Gunakan date picker, default hari ini
    const tglPicker = document.getElementById('log-filter-tgl');
    const filterTgl = tglPicker?.value || new Date().toISOString().slice(0,10);
    if(tglPicker && !tglPicker.value) tglPicker.value = new Date().toISOString().slice(0,10);

    const filteredData = data.filter(r => String(r.tgl).slice(0,10) === filterTgl);

    // Update cache
    otsRecords = data;
    otsReportLoaded = true;

    if(!filteredData.length){
      const tglStr = new Date(filterTgl).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      el.innerHTML = `<div class="no-data"><div class="no-data-icon">📋</div>Belum ada OTS pada ${tglStr}.</div>`;
      return;
    }

    // Render dulu dengan data ringkasan
    renderLogOTS(filteredData);

    // Card hanya ringkasan — detail dimuat saat klik tombol Detail

  } catch(e){
    el.innerHTML = '<div class="no-data">Gagal koneksi ke Sheets.</div>';
  }
}

function renderLogOTS(records){
  const el = document.getElementById('log-ots-content');
  el.innerHTML = records.map(r => buildOTSLogCard(r)).join('');
}

function buildOTSLogCard(r){
  const tglStr = r.tgl ? new Date(r.tgl).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '-';
  const timIT = Array.isArray(r.timIT) ? r.timIT.join(', ') : (r.timIT||'-');
  const lastEdit = formatWIB(r.lastEdit||r.waktuSubmit||'');
  const serahBadge = r.adaSerah==='Ya'||r.adaSerah===true ? '<span class="badge badge-blue">📦 Serah Terima</span>' : '';
  const jmlKegiatan = r.jumlahKegiatan || (r.kegiatan||[]).length || 0;

  return `<div class="log-entry" id="ots-log-${r.id}">
    <div class="log-header">
      <div>
        <div class="log-name">${(r.bo||'').toUpperCase()}</div>
        <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;">
          <span class="badge badge-purple">📋 OTS</span>
          <span class="badge badge-sent">✓ Terkirim</span>
          ${serahBadge}
        </div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <div style="font-size:11px;color:var(--text3);">${tglStr}</div>
        <div class="log-actions">
          <button class="btn-sm-edit" onclick="showOTSDetailFull('${r.id}')">👁 Detail</button>
          <button class="btn-sm-edit" style="background:#faf5ff;color:#7c3aed;border-color:#e9d5ff;" onclick="reexportOTSPDF('${r.id}')">🖨️ PDF</button>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm);font-size:12px;">
      <div><span style="color:var(--text3);font-weight:600;">Tim IT:</span><br>${timIT}</div>
      <div><span style="color:var(--text3);font-weight:600;">Petugas BO:</span><br>${r.namaBo||'-'} <span style="color:var(--text3);">(${r.jabatanBo||'-'})</span></div>
      <div><span style="color:var(--text3);font-weight:600;">Petugas TTD:</span><br>${r.petugasSerah||'-'}</div>
      <div><span style="color:var(--text3);font-weight:600;">Diedit:</span><br>${lastEdit}</div>
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text3);font-style:italic;">
      ${jmlKegiatan} kegiatan — tekan Detail untuk melihat selengkapnya
    </div>
  </div>`;
}

function showOTSDetail(id){showOTSDetailFull(id);}

function showOTSDetailFull(id){
  document.getElementById('modal-ots-title').textContent='📋 Detail OTS';
  document.getElementById('modal-ots-body').innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);">⏳ Memuat data dari Drive...</div>';
  document.getElementById('ots-modal').classList.add('show');
  fetchGAS({action:'getOTSDetail',id,pin:currentPin})
    .then(json=>{
      const data=(json.status==='ok'&&json.data)?json.data:(otsRecords.find(x=>x.id===id)||{});
      const idx=otsRecords.findIndex(x=>x.id===id);
      if(idx>=0)otsRecords[idx]={...otsRecords[idx],...data};
      renderOTSDetail(data);
    })
    .catch(()=>{
      const r=otsRecords.find(x=>x.id===id);
      if(r)renderOTSDetail(r);
      else document.getElementById('modal-ots-body').innerHTML='<div class="no-data">Gagal memuat data.</div>';
    });
}

function renderOTSDetail(r){
  const tglStr=r.tgl?new Date(r.tgl).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'-';
  const timITStr=Array.isArray(r.timIT)?r.timIT.join(', '):(r.timIT||'-');
  const kegiatan=r.kegiatan||[];
  const kegiatanRows=kegiatan.length>0
    ?kegiatan.map((k,i)=>`<tr style="background:${i%2===0?'#fff':'var(--surface2)'}">
      <td style="padding:7px;text-align:center;">${k.no||i+1}</td>
      <td style="padding:7px;">${k.kegiatan||'-'}</td>
      <td style="padding:7px;">${k.hasil||'-'}</td>
      <td style="padding:7px;text-align:center;color:var(--text2);">All Team</td>
    </tr>`).join('')
    :'<tr><td colspan="4" style="padding:14px;text-align:center;color:var(--text3);font-style:italic;">Tidak ada data kegiatan</td></tr>';
  const fotos=r.fotos||[];
  const fotoHtml=fotos.length>0
    ?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">
        ${fotos.map(src=>`<img src="${src}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid var(--border);">`).join('')}
      </div>`
    :'<div style="font-size:12px;color:var(--text3);font-style:italic;">Tidak ada foto</div>';
  const adaSerah=r.adaSerah===true||r.adaSerah==='Ya';
  const mkRows=arr=>arr.length?arr.map((s,i)=>`<tr style="background:${i%2===0?'#fff':'var(--surface2)'}">
    <td style="padding:6px;text-align:center;">${s.no}</td><td style="padding:6px;">${s.nama}</td>
    <td style="padding:6px;">${s.merk}</td><td style="padding:6px;">${s.code}</td><td style="padding:6px;">${s.ket}</td>
  </tr>`).join(''):'<tr><td colspan="5" style="padding:10px;text-align:center;color:var(--text3);">—</td></tr>';
  const serahHtml=adaSerah?`
    <div style="margin-top:16px;">
      <div class="detail-label" style="margin-bottom:6px;">📦 Berita Acara Serah Terima</div>
      <div style="font-size:12px;font-weight:600;margin-bottom:4px;">Yang diserahkan ke BO:</div>
      <table class="detail-table"><thead><tr><th>No</th><th>Nama Barang</th><th>Merk</th><th>CODE</th><th>Keterangan</th></tr></thead>
      <tbody>${mkRows(r.serahKe||[])}</tbody></table>
      <div style="font-size:12px;font-weight:600;margin:10px 0 4px;">Yang dibawa pulang Tim IT:</div>
      <table class="detail-table"><thead><tr><th>No</th><th>Nama Barang</th><th>Merk</th><th>CODE</th><th>Keterangan</th></tr></thead>
      <tbody>${mkRows(r.bawaPulang||[])}</tbody></table>
    </div>`:'';
  document.getElementById('modal-ots-body').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-bottom:16px;background:var(--surface3);padding:14px;border-radius:var(--radius-sm);">
      <div><div class="detail-label">Branch Office</div><div class="detail-val"><strong>${(r.bo||'').toUpperCase()}</strong></div></div>
      <div><div class="detail-label">Tanggal</div><div class="detail-val">${tglStr}</div></div>
      <div><div class="detail-label">Petugas BO</div><div class="detail-val">${r.namaBo||'-'} <span style="color:var(--text3);font-size:12px;">${r.jabatanBo?'('+r.jabatanBo+')':''}</span></div></div>
      <div><div class="detail-label">Tim IT</div><div class="detail-val">${timITStr}</div></div>
      <div><div class="detail-label">Petugas IT (TTD)</div><div class="detail-val">${r.petugasSerah||'-'}</div></div>
      <div><div class="detail-label">Terakhir Diedit</div><div class="detail-val" style="font-size:12px;">${formatWIB(r.lastEdit||r.waktuSubmit||'')}</div></div>
    </div>
    <div class="detail-label" style="margin-bottom:6px;">📝 Tabel Kegiatan <span style="color:var(--text3);font-weight:400;">${kegiatan.length} item</span></div>
    <table class="detail-table" style="margin-bottom:16px;">
      <thead><tr><th>No</th><th>Kegiatan</th><th>Hasil</th><th>Petugas</th></tr></thead>
      <tbody>${kegiatanRows}</tbody>
    </table>
    <div class="detail-label" style="margin-bottom:6px;">📷 Foto Kegiatan</div>
    ${fotoHtml}
    ${serahHtml}
    <div style="margin-top:20px;display:flex;justify-content:flex-end;gap:10px;">
      <button onclick="closeOTSModal();editOTSFromLog('${r.id}')" style="padding:10px 20px;background:#eff6ff;color:#2563eb;border:1.5px solid #bfdbfe;border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">✏️ Edit</button>
      <button onclick="closeOTSModal()" style="padding:10px 24px;background:var(--surface3);color:var(--text2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">✕ Tutup</button>
    </div>`;
  document.getElementById('modal-ots-title').textContent='📋 Detail OTS — '+(r.bo||'').toUpperCase();
}

function closeOTSModal(){document.getElementById('ots-modal').classList.remove('show');}

function editOTS(id){
  const r=otsRecords.find(x=>x.id===id);
  if(!r){showToast('Data tidak ditemukan','info');return;}
  editingOtsId=id;
  // Inisialisasi foto dari cache dulu (akan diupdate setelah Drive response)
  window._editFotos = [...(r.fotos||[])];
  document.getElementById('modal-edit-ots-title').textContent='✏️ Edit OTS — '+(r.bo||'').toUpperCase();
  document.getElementById('modal-edit-ots-body').innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);">⏳ Memuat data dari Drive...</div>';
  document.getElementById('ots-edit-modal').classList.add('show');
  fetchGAS({action:'getOTSDetail',id,pin:currentPin})
    .then(json=>{
      const data=(json.status==='ok'&&json.data)?json.data:r;
      // Merge data Drive ke cache
      const idx=otsRecords.findIndex(x=>x.id===id);
      if(idx>=0)otsRecords[idx]={...otsRecords[idx],...data};
      renderEditOTSModal(data);
    })
    .catch(()=>renderEditOTSModal(r));
}

function editOTSFromLog(id){
  // Sama dengan editOTS tapi setelah simpan/batal → kembali ke log OTS
  const r = otsRecords.find(x=>x.id===id);
  if(!r){ showToast('Data tidak ditemukan','info'); return; }
  editingOtsId = id;
  window._editFromLog = true; // flag: edit dari log, bukan dari report
  window._editFotos = [...(r.fotos||[])];
  document.getElementById('modal-edit-ots-title').textContent = '✏️ Edit OTS — '+(r.bo||'').toUpperCase();
  document.getElementById('modal-edit-ots-body').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">⏳ Memuat data dari Drive...</div>';
  document.getElementById('ots-edit-modal').classList.add('show');
  fetchGAS({action:'getOTSDetail', id, pin:currentPin})
    .then(json=>{
      const data = (json.status==='ok'&&json.data) ? json.data : r;
      const idx = otsRecords.findIndex(x=>x.id===id);
      if(idx>=0) otsRecords[idx] = {...otsRecords[idx], ...data};
      window._editFotos = [...(data.fotos||[])];
      renderEditOTSModal(data);
    })
    .catch(()=>{ window._editFotos=[...(r.fotos||[])]; renderEditOTSModal(r); });
}

function closeEditOTSModal(){
  document.getElementById('ots-edit-modal').classList.remove('show');
  editingOtsId = null;
  // Jika edit dari log OTS → kembali ke log OTS
  if(window._editFromLog){
    window._editFromLog = false;
    switchMenu('log');
    setTimeout(()=>switchLogTab('ots'), 100);
  }
}

function renderEditOTSModal(r){
  const timArr=Array.isArray(r.timIT)?r.timIT:String(r.timIT||'').split(',').map(x=>x.trim()).filter(x=>x);
  const kegiatan=r.kegiatan||[];
  const serahKe=r.serahKe||[];
  const bawaPulang=r.bawaPulang||[];
  const adaSerah=r.adaSerah===true||r.adaSerah==='Ya';
  const fotos=r.fotos||[];
  window._editFotos=[...fotos];
  const timRows=timArr.length>0
    ?timArr.map((n,i)=>`<div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;"><input type="text" value="${n}" style="flex:1;padding:8px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;"><button class="btn-del-row" onclick="this.parentElement.remove()">×</button></div>`).join('')
    :`<div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;"><input type="text" placeholder="Nama tim IT ke-1" style="flex:1;padding:8px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;"><button class="btn-del-row" onclick="this.parentElement.remove()">×</button></div>`;
  const kegRows=kegiatan.length>0
    ?kegiatan.map((k,i)=>`<tr><td style="padding:6px;text-align:center;">${i+1}</td><td style="padding:4px;"><input type="text" value="${(k.kegiatan||'').replace(/"/g,'&quot;')}" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 7px;font-family:inherit;font-size:12px;"></td><td style="padding:4px;"><textarea style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 7px;font-family:inherit;font-size:12px;min-height:38px;resize:vertical;">${k.hasil||''}</textarea></td><td style="padding:6px;text-align:center;font-size:11px;color:var(--text2);">All Team</td><td><button class="btn-del-row" onclick="this.closest('tr').remove();renumberEditRows()">×</button></td></tr>`).join('')
    :`<tr><td style="padding:6px;text-align:center;">1</td><td style="padding:4px;"><input type="text" placeholder="Isi kegiatan..." style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 7px;font-family:inherit;font-size:12px;"></td><td style="padding:4px;"><textarea placeholder="Hasil kegiatan..." style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 7px;font-family:inherit;font-size:12px;min-height:38px;resize:vertical;"></textarea></td><td style="padding:6px;text-align:center;font-size:11px;color:var(--text2);">All Team</td><td></td></tr>`;
  const mkSerahRows=(arr)=>arr.length>0?arr.map((s,i)=>`<tr><td style="padding:4px;text-align:center;">${i+1}</td><td style="padding:4px;"><input type="text" value="${s.nama||''}" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" value="${s.merk||''}" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" value="${s.code||''}" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" value="${s.ket||''}" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td><button class="btn-del-row" onclick="this.closest('tr').remove()">×</button></td></tr>`).join('')
    :`<tr><td style="padding:4px;text-align:center;">1</td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td></td></tr>`;
  const fotoHtml=fotos.length>0
    ?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">${fotos.map((src,i)=>`<div style="position:relative;aspect-ratio:4/3;"><img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;border:1px solid var(--border);"><button onclick="removeEditFoto(${i})" style="position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;">×</button></div>`).join('')}</div>`
    :'<div style="font-size:12px;color:var(--text3);font-style:italic;padding:8px 0;">Tidak ada foto tersimpan</div>';
  document.getElementById('modal-edit-ots-body').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <div><label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:4px;">Nama BO</label><input id="edit-ots-bo" type="text" value="${r.bo||''}" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;"></div>
      <div><label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:4px;">Tanggal</label><input id="edit-ots-tgl" type="date" value="${String(r.tgl||'').slice(0,10)}" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;"></div>
      <div><label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:4px;">Nama Petugas BO</label><input id="edit-ots-bm" type="text" value="${r.namaBo||''}" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;"></div>
      <div><label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:4px;">Jabatan BO</label>
        <select id="edit-ots-jabatan" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;">
          <option ${r.jabatanBo==='Branch Manager'?'selected':''}>Branch Manager</option>
          <option ${r.jabatanBo==='Accounting'?'selected':''}>Accounting</option>
          <option ${r.jabatanBo==='Kasir'?'selected':''}>Kasir</option>
          <option ${r.jabatanBo==='FO'?'selected':''}>FO</option>
          <option ${r.jabatanBo==='Staf BO'?'selected':''}>Staf BO</option>
        </select></div>
      <div><label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:4px;">Petugas IT (TTD)</label>
        <select id="edit-ots-petugas" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;">
          <option value="">— pilih —</option>
          <option ${r.petugasSerah==='Abet Nego'?'selected':''}>Abet Nego</option>
          <option ${r.petugasSerah==='Goprid Tendo Padagi'?'selected':''}>Goprid Tendo Padagi</option>
          <option ${r.petugasSerah==='Evan Budiargo'?'selected':''}>Evan Budiargo</option>
          <option ${r.petugasSerah==='Herniumus Chandra'?'selected':''}>Herniumus Chandra</option>
        </select></div>
    </div>
    <div style="margin-bottom:14px;">
      <label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:6px;">Tim IT yang Hadir</label>
      <div id="edit-tim-it-list">${timRows}</div>
      <button class="btn-add-row" onclick="addEditTimIT()">+ Tambah anggota</button>
    </div>
    <div style="margin-bottom:14px;">
      <label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:6px;">Tabel Kegiatan</label>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:var(--surface3);"><th style="padding:6px;width:28px;">No</th><th style="padding:6px;">Kegiatan</th><th style="padding:6px;">Hasil</th><th style="padding:6px;width:70px;text-align:center;">Petugas</th><th style="width:28px;"></th></tr></thead>
        <tbody id="edit-kegiatan-body">${kegRows}</tbody>
      </table>
      <button class="btn-add-row" onclick="addEditKegiatanRow()">+ Tambah baris</button>
    </div>
    <div style="margin-bottom:14px;">
      <label style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;display:block;margin-bottom:6px;">Foto Kegiatan</label>
      <div id="edit-foto-preview">${fotoHtml}</div>
      <input type="file" id="edit-foto-input" accept="image/*" multiple style="display:none;" onchange="addEditFotos(event)">
      <button class="btn-add-row" style="margin-top:8px;" onclick="document.getElementById('edit-foto-input').click()">📷 Tambah Foto</button>
    </div>
    <div style="margin-bottom:14px;">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;padding:8px;background:var(--surface3);border-radius:6px;">
        <input type="checkbox" id="edit-serah-toggle" ${adaSerah?'checked':''} onchange="document.getElementById('edit-serah-section').style.display=this.checked?'block':'none'" style="width:15px;height:15px;accent-color:var(--accent);">
        Ada Serah Terima Barang
      </label>
      <div id="edit-serah-section" style="display:${adaSerah?'block':'none'};margin-top:10px;">
        <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;">Yang diserahkan ke BO:</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:var(--surface3);"><th style="padding:6px;width:28px;">No</th><th style="padding:6px;">Nama Barang</th><th style="padding:6px;width:90px;">Merk</th><th style="padding:6px;width:70px;">CODE</th><th style="padding:6px;">Keterangan</th><th style="width:28px;"></th></tr></thead>
        <tbody id="edit-serah-ke-body">${mkSerahRows(serahKe)}</tbody></table>
        <button class="btn-add-row" onclick="addEditSerahRow('edit-serah-ke-body')">+ Tambah</button>
        <div style="font-size:12px;font-weight:600;color:var(--text2);margin:10px 0 6px;">Yang dibawa pulang Tim IT:</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:var(--surface3);"><th style="padding:6px;width:28px;">No</th><th style="padding:6px;">Nama Barang</th><th style="padding:6px;width:90px;">Merk</th><th style="padding:6px;width:70px;">CODE</th><th style="padding:6px;">Keterangan</th><th style="width:28px;"></th></tr></thead>
        <tbody id="edit-bawa-body">${mkSerahRows(bawaPulang)}</tbody></table>
        <button class="btn-add-row" onclick="addEditSerahRow('edit-bawa-body')">+ Tambah</button>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
      <button onclick="simpanEditOTS('${r.id}')" style="flex:1;padding:12px;background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">📤 Simpan & Kirim</button>
      <button onclick="closeEditOTSModal()" style="padding:12px 20px;background:var(--surface3);color:var(--text2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">✕ Batal</button>
    </div>
    <div id="edit-ots-status" style="display:none;margin-top:10px;padding:10px;border-radius:6px;font-size:12px;text-align:center;font-weight:500;"></div>`;
}

function addEditTimIT(){
  const list=document.getElementById('edit-tim-it-list');
  const n=list.children.length+1;
  const div=document.createElement('div');
  div.style.cssText='display:flex;gap:8px;margin-bottom:6px;align-items:center;';
  div.innerHTML=`<input type="text" placeholder="Nama tim IT ke-${n}" style="flex:1;padding:8px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;"><button class="btn-del-row" onclick="this.parentElement.remove()">×</button>`;
  list.appendChild(div);
}

function addEditKegiatanRow(){
  const tbody=document.getElementById('edit-kegiatan-body');
  const n=tbody.rows.length+1;
  const tr=document.createElement('tr');
  tr.innerHTML=`<td style="padding:6px;text-align:center;">${n}</td><td style="padding:4px;"><input type="text" placeholder="Isi kegiatan..." style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 7px;font-family:inherit;font-size:12px;"></td><td style="padding:4px;"><textarea placeholder="Hasil kegiatan..." style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 7px;font-family:inherit;font-size:12px;min-height:38px;resize:vertical;"></textarea></td><td style="padding:6px;text-align:center;font-size:11px;color:var(--text2);">All Team</td><td><button class="btn-del-row" onclick="this.closest('tr').remove();renumberEditRows()">×</button></td>`;
  tbody.appendChild(tr);
}

function renumberEditRows(){
  const rows=document.getElementById('edit-kegiatan-body')?.rows||[];
  Array.from(rows).forEach((tr,i)=>{tr.cells[0].textContent=i+1;});
}

function addEditSerahRow(tbodyId){
  const tbody=document.getElementById(tbodyId);
  const n=tbody.rows.length+1;
  const tr=document.createElement('tr');
  tr.innerHTML=`<td style="padding:4px;text-align:center;">${n}</td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td style="padding:4px;"><input type="text" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:4px;font-size:12px;font-family:inherit;"></td><td><button class="btn-del-row" onclick="this.closest('tr').remove()">×</button></td>`;
  tbody.appendChild(tr);
}

function removeEditFoto(i){window._editFotos.splice(i,1);renderEditFotoPreview();}

function addEditFotos(event){
  const files=Array.from(event.target.files);
  files.forEach(file=>{
    if(window._editFotos.length>=6){showToast('Maks 6 foto','info');return;}
    const reader=new FileReader();
    reader.onload=e=>{window._editFotos.push(e.target.result);renderEditFotoPreview();};
    reader.readAsDataURL(file);
  });
  event.target.value='';
}

function renderEditFotoPreview(){
  const el=document.getElementById('edit-foto-preview');
  if(!el)return;
  el.innerHTML=window._editFotos.length>0
    ?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">${window._editFotos.map((src,i)=>`<div style="position:relative;aspect-ratio:4/3;"><img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;border:1px solid var(--border);"><button onclick="removeEditFoto(${i})" style="position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;">×</button></div>`).join('')}</div>`
    :'<div style="font-size:12px;color:var(--text3);font-style:italic;padding:8px 0;">Tidak ada foto</div>';
}

function getEditSerahData(tbodyId){
  const rows=document.getElementById(tbodyId)?.rows||[];
  return Array.from(rows).map((tr,i)=>{
    return {no:i+1,nama:tr.cells[1]?.querySelector('input')?.value||'',merk:tr.cells[2]?.querySelector('input')?.value||'',code:tr.cells[3]?.querySelector('input')?.value||'',ket:tr.cells[4]?.querySelector('input')?.value||''};
  }).filter(r=>r.nama);
}

function simpanEditOTS(id){
  const bo=document.getElementById('edit-ots-bo')?.value.trim();
  const tgl=document.getElementById('edit-ots-tgl')?.value;
  const namaBo=document.getElementById('edit-ots-bm')?.value.trim();
  const jabatanBo=document.getElementById('edit-ots-jabatan')?.value;
  const petugasSerah=document.getElementById('edit-ots-petugas')?.value;
  if(!bo||!tgl||!namaBo){showToast('Lengkapi identitas dulu','info');return;}
  const timIT=Array.from(document.getElementById('edit-tim-it-list')?.querySelectorAll('input')||[]).map(i=>i.value.trim()).filter(v=>v);
  const kegRows=document.getElementById('edit-kegiatan-body')?.rows||[];
  const kegiatan=Array.from(kegRows).map((tr,i)=>{return {no:i+1,kegiatan:tr.cells[1]?.querySelector('input')?.value||'',hasil:tr.cells[2]?.querySelector('textarea')?.value||'',petugas:'All Team'};}).filter(k=>k.kegiatan);
  const adaSerah=document.getElementById('edit-serah-toggle')?.checked||false;
  const serahKe=adaSerah?getEditSerahData('edit-serah-ke-body'):[];
  const bawaPulang=adaSerah?getEditSerahData('edit-bawa-body'):[];
  const fotos=window._editFotos||[];
  const statusEl=document.getElementById('edit-ots-status');
  if(statusEl){statusEl.style.display='block';statusEl.style.background='#e3f2fd';statusEl.style.color='#1565c0';statusEl.textContent='⏳ Menyimpan...';}
  const payload={action:'updateOTS',pin:currentPin,id,bo,tgl,namaBo,jabatanBo,petugasSerah,timIT,kegiatan,adaSerah,serahKe,bawaPulang,fotos};
  const fd=new FormData();fd.append('data',JSON.stringify(payload));
  fetch(getUrl(),{method:'POST',body:fd}).then(r=>r.json()).then(json=>{
    if(json.status==='ok'){
      if(statusEl){statusEl.style.background='#e8f5e9';statusEl.style.color='#2e7d32';statusEl.textContent='✅ Berhasil disimpan!';}
      otsReportLoaded = false;
      const updIdx = otsRecords.findIndex(x=>x.id===id);
      if(updIdx>=0){
        otsRecords[updIdx] = {
          ...otsRecords[updIdx],
          bo, tgl, namaBo, jabatanBo, petugasSerah,
          timIT, kegiatan, adaSerah, serahKe, bawaPulang,
          fotos,
          jumlahKegiatan: kegiatan.length,
          lastEdit: new Date().toLocaleString('id-ID')
        };
      }
      setTimeout(()=>{
        // Tutup modal tanpa trigger closeEditOTSModal redirect
        document.getElementById('ots-edit-modal').classList.remove('show');
        editingOtsId = null;
        window._editFromLog = false;
        // Selalu kembali ke log OTS setelah simpan dari log
        switchMenu('log');
        setTimeout(()=>switchLogTab('ots'), 100);
      }, 1000);
    }else{
      if(statusEl){statusEl.style.background='#ffebee';statusEl.style.color='#c62828';statusEl.textContent='❌ Gagal: '+(json.message||'error');}
    }
  }).catch(e=>{if(statusEl){statusEl.style.background='#ffebee';statusEl.style.color='#c62828';statusEl.textContent='❌ Error: '+e.message;}});
}