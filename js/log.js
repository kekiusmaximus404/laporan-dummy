// ═══════════════════════════════════════════════════════════════
//  log.js — Log Harian: load, render, edit, detail, delete
// ═══════════════════════════════════════════════════════════════

async function loadLog(){
  document.getElementById('log-content').innerHTML='<div class="loading-text">Memuat data dari Sheets...</div>';
  const tglPicker = document.getElementById('log-filter-tgl');
  const tgl = tglPicker?.value || new Date().toISOString().slice(0,10);
  if(tglPicker && !tglPicker.value) tglPicker.value = new Date().toISOString().slice(0,10);
  try{
    const json = await fetchGAS({action:'getLog', tgl, pin:currentPin});
    if(json.status!=='ok'){document.getElementById('log-content').innerHTML='<div class="no-data">Gagal load data.</div>';return;}
    logData = json.data||[];
    renderLog(logData);
  }catch(e){
    document.getElementById('log-content').innerHTML='<div class="no-data">Gagal koneksi ke Sheets.</div>';
  }
}

function renderLog(entries){
  const el=document.getElementById('log-content');
  if(!entries||!entries.length){
    el.innerHTML='<div class="no-data"><div class="no-data-icon">📋</div>Belum ada entri pada tanggal ini.</div>';
    return;
  }
  el.innerHTML=entries.map(e=>{
    const totalTiket = (e.hw||[]).length + (e.net||[]).length + (e.daily||[]).length;
    const hwBadges = (e.hw||[]).map(h=>`<span class="badge badge-hw">🔧 ${h.kat}</span>`).join('');
    const netBadges = (e.net||[]).map(n=>`<span class="badge badge-net">🌐 ${n.kat}</span>`).join('');
    const dailyBadge = (e.daily||[]).length ? `<span class="badge" style="background:#fef3c7;color:#92400e;">📓 Daily ×${e.daily.length}</span>` : '';
    return `<div class="log-entry" id="entry-${e.id}">
      <div class="log-header">
        <div>
          <div class="log-name">${e.pic}</div>
          <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge badge-branch">${e.branch}${e.branchKode?' · '+e.branchKode:''}</span>
            <span class="badge badge-sent">✓ Terkirim</span>
          </div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <div style="font-size:11px;color:var(--text3);">${e.tgl}</div>
          <button class="btn-sm-edit" onclick="showLogDetail('${e.id}')">👁 Detail</button>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
        ${hwBadges}${netBadges}${dailyBadge}
      </div>
      <div style="margin-top:6px;font-size:11px;color:var(--text3);font-style:italic;">
        ${totalTiket} tiket — tekan Detail untuk lihat selengkapnya
      </div>
    </div>`;
  }).join('');
}

function switchLogTab(tab){
  currentLogTab = tab;
  const btnM = document.getElementById('log-tab-maintenance');
  const btnO = document.getElementById('log-tab-ots');
  const paneM = document.getElementById('log-pane-maintenance');
  const paneO = document.getElementById('log-pane-ots');
  const btnExportOTS = document.getElementById('btn-export-ots');
  if(btnM) btnM.classList.toggle('active', tab==='maintenance');
  if(btnO) btnO.classList.toggle('active', tab==='ots');
  if(paneM) paneM.style.display = tab==='maintenance' ? 'block' : 'none';
  if(paneO) paneO.style.display = tab==='ots' ? 'block' : 'none';
  if(btnExportOTS) btnExportOTS.style.display = tab==='ots' ? '' : 'none';
  if(tab==='maintenance') setTimeout(()=>loadLog(), 0);
  if(tab==='ots') setTimeout(()=>loadLogOTS(), 0);
}

function refreshLogTab(){
  if(currentLogTab==='maintenance') setTimeout(()=>loadLog(), 0);
  else setTimeout(()=>loadLogOTS(), 0);
}

function showLogDetail(id){
  const entry = logData.find(e=>String(e.id)===String(id));
  if(!entry){ showToast('Data tidak ditemukan','info'); return; }

  document.getElementById('log-detail-title').textContent = '📋 Detail — ' + entry.pic + ' | ' + entry.branch;
  document.getElementById('log-detail-modal').classList.add('show');

  const hwRows = (entry.hw||[]).map((h,i)=>`
    <div class="ticket hw" style="margin-bottom:8px;">
      <div class="ticket-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="badge badge-hw">🔧 ${h.kat}</span>
          <span style="font-size:12px;color:var(--text2);">${h.sub}</span>
        </div>
        <span class="badge badge-${h.status==='Selesai'?'selesai':h.status==='Proses'?'proses':'eskalasi'}">${h.status}</span>
      </div>
      <div class="ticket-desc">${h.ket||'—'}</div>
      <div class="ticket-meta">📍 ${h.lokasi||'—'}</div>
    </div>`).join('');

  const netRows = (entry.net||[]).map((n,i)=>`
    <div class="ticket net" style="margin-bottom:8px;">
      <div class="ticket-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="badge badge-net">🌐 ${n.kat}</span>
          <span style="font-size:12px;color:var(--text2);">${n.sub}</span>
        </div>
        <span class="badge badge-${n.status==='Selesai'?'selesai':n.status==='Proses'?'proses':'eskalasi'}">${n.status}</span>
      </div>
      <div class="ticket-desc">${n.ket||'—'}</div>
      <div class="ticket-meta">📍 ${n.lokasi||'—'}</div>
    </div>`).join('');

  const hwRows2 = (entry.hw||[]).map((h,i)=>`
    <div class="ticket hw" style="margin-bottom:8px;">
      <div class="ticket-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="badge badge-hw">🔧 ${h.kat}</span>
          <span style="font-size:12px;color:var(--text2);">${h.sub}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="badge badge-${h.status==='Selesai'?'selesai':h.status==='Proses'?'proses':'eskalasi'}">${h.status}</span>
          <button class="btn-sm-edit" onclick="editTicket('${entry.id}','hw',${i})">✏️</button>
          <button class="btn-sm-del" onclick="deleteTicket('${entry.id}','hw',${i})">🗑️</button>
        </div>
      </div>
      <div class="ticket-desc">${h.ket||'—'}</div>
      <div class="ticket-meta">📍 ${h.lokasi||'—'}</div>
    </div>`).join('');

  const netRows2 = (entry.net||[]).map((n,i)=>`
    <div class="ticket net" style="margin-bottom:8px;">
      <div class="ticket-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="badge badge-net">🌐 ${n.kat}</span>
          <span style="font-size:12px;color:var(--text2);">${n.sub}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="badge badge-${n.status==='Selesai'?'selesai':n.status==='Proses'?'proses':'eskalasi'}">${n.status}</span>
          <button class="btn-sm-edit" onclick="editTicket('${entry.id}','net',${i})">✏️</button>
          <button class="btn-sm-del" onclick="deleteTicket('${entry.id}','net',${i})">🗑️</button>
        </div>
      </div>
      <div class="ticket-desc">${n.ket||'—'}</div>
      <div class="ticket-meta">📍 ${n.lokasi||'—'}</div>
    </div>`).join('');

  document.getElementById('log-detail-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:var(--surface3);border-radius:var(--radius-sm);margin-bottom:14px;">
      <div><div class="detail-label">PIC</div><div class="detail-val"><strong>${entry.pic}</strong></div></div>
      <div><div class="detail-label">Tanggal</div><div class="detail-val">${entry.tgl}</div></div>
      <div><div class="detail-label">Branch Office</div><div class="detail-val">${entry.branch}</div></div>
      <div><div class="detail-label">Area</div><div class="detail-val">${entry.branchKode||'-'}</div></div>
    </div>
    ${hwRows2}
    ${netRows2}
    ${ (entry.daily||[]).length ? `
    <div style="margin-top:12px;">
      <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">📓 Daily Activity</div>
      ${(entry.daily||[]).map((d,i)=>`
        <div class="ticket" style="background:#fffbeb;border-left:3px solid #f59e0b;padding:10px 12px;border-radius:var(--radius-xs);margin-bottom:6px;">
          <div style="font-size:12px;font-weight:600;color:#92400e;">${d.ket||'—'}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px;">📍 ${d.lokasi||'—'}</div>
        </div>`).join('')}
    </div>` : '' }
    ${!(entry.hw||[]).length && !(entry.net||[]).length && !(entry.daily||[]).length ? '<div class="no-data">Tidak ada tiket</div>' : ''}
    <div style="display:flex;justify-content:flex-end;margin-top:20px;padding-top:14px;border-top:1px solid var(--border);">
      <button onclick="closeLogDetailModal()" style="padding:10px 24px;background:var(--surface3);color:var(--text2);border:1.5px solid var(--border2);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">✕ Tutup</button>
    </div>`;
}

function editTicket(entryId, type, idx){
  const entry = logData.find(e=>String(e.id)===String(entryId));
  if(!entry){ showToast('Data tidak ditemukan','info'); return; }
  const ticket = type==='hw' ? entry.hw[idx] : entry.net[idx];
  if(!ticket){ showToast('Tiket tidak ditemukan','info'); return; }

  closeLogDetailModal();
  switchMenu('input');
  switchSub('maintenance','input');

  setTimeout(()=>{
    // Reset form
    resetForm();
    // Isi identitas
    document.getElementById('tgl').value = entry.tgl||'';
    document.getElementById('pic').value = entry.pic||'';
    document.getElementById('branch').value = entry.branch||'';
    document.getElementById('branch-kode').value = entry.branchKode||'';

    if(type==='hw'){
      // Isi form hardware
      const katEl = document.getElementById('hw-kat');
      if(katEl){ katEl.value = ticket.kat||''; updateHwSub(); }
      setTimeout(()=>{
        const subEl = document.getElementById('hw-sub');
        if(subEl) subEl.value = ticket.sub||'';
        const lokEl = document.getElementById('hw-lokasi');
        if(lokEl) lokEl.value = ticket.lokasi||'';
        const statusEl = document.getElementById('hw-status');
        if(statusEl) statusEl.value = ticket.status||'Selesai';
        const ketEl = document.getElementById('hw-ket');
        if(ketEl) ketEl.value = ticket.ket||'';
      }, 50);
    } else {
      // Isi form jaringan
      const katEl = document.getElementById('net-kat');
      if(katEl){ katEl.value = ticket.kat||''; updateNetSub(); }
      setTimeout(()=>{
        const subEl = document.getElementById('net-sub');
        if(subEl) subEl.value = ticket.sub||'';
        const lokEl = document.getElementById('net-lokasi');
        if(lokEl) lokEl.value = ticket.lokasi||'';
        const statusEl = document.getElementById('net-status');
        if(statusEl) statusEl.value = ticket.status||'Selesai';
        const ketEl = document.getElementById('net-ket');
        if(ketEl) ketEl.value = ticket.ket||'';
      }, 50);
    }

    // Set mode edit tiket - simpan info tiket yang sedang diedit
    editingLogId = String(entryId);
    window._editingTicket = { entryId, type, idx };

    // Tampilkan tombol Batal
    const btnBatal = document.getElementById('btn-batal-edit');
    if(btnBatal) btnBatal.style.display = 'block';

    // Disable section yang tidak diedit
    setEditMode(type);

    // Update label simpan
    const infoEl = document.getElementById('simpan-info');
    if(infoEl){
      infoEl.style.cssText = 'background:#fff3cd;color:#856404;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:500;margin-top:8px;';
      infoEl.textContent = '✏️ Mode Edit ' + (type==='hw'?'Hardware':'Jaringan') + ' — form lainnya dinonaktifkan';
    }

    showToast('Tiket dimuat untuk diedit','info');
    window.scrollTo(0,0);
  }, 150);
}

function deleteTicket(entryId, type, idx){
  if(!confirm('Hapus tiket ini?')) return;
  const entry = logData.find(e=>String(e.id)===String(entryId));
  if(!entry) return;

  const tickets = type==='hw' ? [...(entry.hw||[])] : [...(entry.net||[])];
  tickets.splice(idx, 1);

  // Kalau tiket terakhir → hapus seluruh entri
  const newHw = type==='hw' ? tickets : (entry.hw||[]);
  const newNet = type==='net' ? tickets : (entry.net||[]);
  if(!newHw.length && !newNet.length){
    closeLogDetailModal();
    deleteLogEntry(entryId);
    return;
  }

  // Update entri — hapus tiket ini, simpan ulang
  showOverlay('Menghapus tiket...');
  const payload = {
    action: 'updateLog',
    id: entryId,
    tgl: entry.tgl, pic: entry.pic, branch: entry.branch,
    branchKode: entry.branchKode||'',
    hw: newHw, net: newNet,
    pin: currentPin
  };
  const fd = new FormData();
  fd.append('data', JSON.stringify(payload));
  fetch(getUrl(), {method:'POST', body:fd})
    .then(r=>r.json())
    .then(json=>{
      hideOverlay();
      if(json.status==='ok'){
        showToast('Tiket berhasil dihapus','ok');
        // Update cache lokal
        if(type==='hw') entry.hw = newHw;
        else entry.net = newNet;
        // Refresh modal
        showLogDetail(entryId);
      } else {
        showToast('Gagal: '+(json.message||'error'),'err');
      }
    })
    .catch(()=>{ hideOverlay(); showToast('Gagal koneksi','err'); });
}

function setEditMode(type){
  // Disable section yang tidak relevan saat edit per tiket
  const hwSection = document.getElementById('hw-section') || document.querySelector('[id*="hw-list"]')?.closest('.card');
  const netSection = document.getElementById('net-section') || document.querySelector('[id*="net-list"]')?.closest('.card');

  // Pendekatan: disable semua input di section yang tidak diedit
  const hwInputs = document.querySelectorAll('#hw-kat, #hw-sub, #hw-lokasi, #hw-status, #hw-ket');
  const netInputs = document.querySelectorAll('#net-kat, #net-sub, #net-lokasi, #net-status, #net-ket');
  const addHwBtn = document.querySelector('[onclick="addHW()"]');
  const addNetBtn = document.querySelector('[onclick="addNet()"]');

  if(type==='hw'){
    // Edit hardware - disable form jaringan
    netInputs.forEach(el=>{ el.disabled=true; el.style.opacity='0.4'; });
    if(addNetBtn){ addNetBtn.disabled=true; addNetBtn.style.opacity='0.4'; }
    hwInputs.forEach(el=>{ el.disabled=false; el.style.opacity='1'; });
    if(addHwBtn){ addHwBtn.disabled=false; addHwBtn.style.opacity='1'; }
  } else {
    // Edit jaringan - disable form hardware
    hwInputs.forEach(el=>{ el.disabled=true; el.style.opacity='0.4'; });
    if(addHwBtn){ addHwBtn.disabled=true; addHwBtn.style.opacity='0.4'; }
    netInputs.forEach(el=>{ el.disabled=false; el.style.opacity='1'; });
    if(addNetBtn){ addNetBtn.disabled=false; addNetBtn.style.opacity='1'; }
  }
}

function clearEditMode(){
  // Enable semua input kembali
  const allInputs = document.querySelectorAll('#hw-kat, #hw-sub, #hw-lokasi, #hw-status, #hw-ket, #net-kat, #net-sub, #net-lokasi, #net-status, #net-ket');
  allInputs.forEach(el=>{ el.disabled=false; el.style.opacity='1'; });
  const allBtns = document.querySelectorAll('[onclick="addHW()"], [onclick="addNet()"]');
  allBtns.forEach(btn=>{ btn.disabled=false; btn.style.opacity='1'; });
}

function batalEdit(){
  editingLogId = null;
  window._editingTicket = null;
  resetForm();
  clearEditMode();
  const btnBatal = document.getElementById('btn-batal-edit');
  if(btnBatal) btnBatal.style.display = 'none';
  const infoEl = document.getElementById('simpan-info');
  if(infoEl){ infoEl.textContent=''; infoEl.style.cssText='font-size:12px;color:var(--text2);text-align:center;margin-top:8px;'; }
  showToast('Edit dibatalkan','info');
  // Kembali ke Log Harian
  switchMenu('log');
  switchLogTab('maintenance');
}

function closeLogDetailModal(){
  document.getElementById('log-detail-modal').classList.remove('show');
}

function editLogEntry(id){
  const entry=logData.find(e=>String(e.id)===String(id));
  if(!entry){showToast('Data tidak ditemukan','info');return;}
  switchMenu('input');switchSub('maintenance','input');
  setTimeout(()=>{
    resetForm();
    document.getElementById('tgl').value=entry.tgl||'';
    document.getElementById('pic').value=entry.pic||'';
    document.getElementById('branch').value=entry.branch||'';
    document.getElementById('branch-kode').value=entry.branchKode||'';
    hwItems=[];(entry.hw||[]).forEach(h=>hwItems.push({kat:h.kat,sub:h.sub,lokasi:h.lokasi,status:h.status,ket:h.ket}));renderHwList();
    netItems=[];(entry.net||[]).forEach(n=>netItems.push({kat:n.kat,sub:n.sub,lokasi:n.lokasi,status:n.status,ket:n.ket}));renderNetList();
    editingLogId=String(id);
    showToast('Data dimuat untuk diedit','info');
    window.scrollTo(0,0);
  },150);
}

function deleteLogEntry(id){
  if(!confirm('Hapus laporan ini? Tidak bisa dibatalkan.'))return;
  showOverlay('Menghapus...');
  const fd=new FormData();fd.append('data',JSON.stringify({action:'deleteLog',id,pin:currentPin}));
  fetch(getUrl(),{method:'POST',body:fd}).then(r=>r.json()).then(json=>{
    hideOverlay();
    if(json.status==='ok'){showToast('Berhasil dihapus','ok');loadLog();}
    else showToast('Gagal: '+(json.message||'error'),'err');
  }).catch(()=>{hideOverlay();showToast('Gagal koneksi','err');});
}