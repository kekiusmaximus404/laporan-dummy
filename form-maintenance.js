// ═══════════════════════════════════════════════════════════════
//  form-maintenance.js — Form input aktivitas harian + submit
// ═══════════════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────
var hwItems    = [];
var netItems   = [];
var dailyItems = [];

function selectActType(t){
  ['hw','net','daily'].forEach(x=>{
    const tab=document.getElementById('act-tab-'+x);
    const panel=document.getElementById('act-panel-'+x);
    if(x===t){
      tab.style.borderColor='var(--accent)';tab.style.color='var(--accent)';tab.style.background='rgba(59,130,246,0.06)';
      if(panel)panel.style.display='block';
    } else {
      tab.style.borderColor='var(--border2)';tab.style.color='var(--text2)';tab.style.background='var(--surface2)';
      if(panel)panel.style.display='none';
    }
  });
  const idCard = document.getElementById('act-identitas-card');
  if(idCard) idCard.style.display = (t==='daily') ? 'none' : 'block';

  // Re-apply PIC lock setiap kali panel dibuka
  _applyPicLock();
  // Hide absensi PIC filter for non-manager
  var absenPicWrap=document.getElementById('absen-pic-filter-wrap');
  if(absenPicWrap) absenPicWrap.style.display=currentRole==='manager'?'':'none';

  // Batasan tanggal: non-manager max hari ini, min 3 hari kebelakang
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const minDate = currentRole==='manager' ? '' : (()=>{
    const d=new Date(today); d.setDate(d.getDate()-3); return d.toISOString().slice(0,10);
  })();

  if(t==='daily'){
    const dt=document.getElementById('daily-tgl');
    if(dt){
      dt.max=todayStr;
      if(minDate) dt.min=minDate;
      if(!dt.value) dt.value=todayStr;
    }
  } else {
    const tg=document.getElementById('tgl');
    if(tg){
      tg.max=todayStr;
      if(minDate) tg.min=minDate;
      if(!tg.value) tg.value=todayStr;
    }
  }
}

function addDaily(){
  const ket=document.getElementById('daily-ket').value.trim();
  if(!ket){showToast('Isi kegiatan terlebih dahulu','info');return;}
  const picEl = document.getElementById('daily-pic');
  const tglEl = document.getElementById('daily-tgl');
  dailyItems.push({
    ket,
    lokasi:document.getElementById('daily-lokasi').value,
    durasi:'',
    pic: picEl?.value || '',
    tgl: tglEl?.value || new Date().toISOString().slice(0,10),
    id:Date.now()
  });
  renderDailyList();
  document.getElementById('daily-ket').value='';
  document.getElementById('daily-lokasi').value='';
}

function renderDailyList(){
  const el=document.getElementById('daily-list');
  if(!el)return;
  el.innerHTML=dailyItems.map((d,i)=>`
    <div class="ticket daily" style="border-left-color:var(--warn)">
      <div class="ticket-header">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text)">${d.ket.substring(0,70)}${d.ket.length>70?'…':''}</div>
          <div class="ticket-meta">${d.lokasi||'—'}${d.durasi?' · '+d.durasi:''}</div>
        </div>
        <div class="ticket-actions">
          <button class="btn-sm-del" onclick="removeDailyItem(${i})">✕</button>
        </div>
      </div>
    </div>`).join('');
}

function removeDailyItem(i){dailyItems.splice(i,1);renderDailyList();}

function updateHwSub(){
  const kat=document.getElementById('hw-kat').value;
  document.getElementById('hw-sub').innerHTML=(HW_SUBS[kat]||[]).map(s=>`<option>${s}</option>`).join('')||'<option>—</option>';
}

function updateNetSub(){
  const kat=document.getElementById('net-kat').value;
  document.getElementById('net-sub').innerHTML=(NET_SUBS[kat]||[]).map(s=>`<option>${s}</option>`).join('')||'<option>—</option>';
}

function addHW(){
  const kat=document.getElementById('hw-kat').value;
  if(!kat){showToast('Pilih kategori hardware dulu','info');return;}
  hwItems.push({kat,sub:document.getElementById('hw-sub').value,lokasi:document.getElementById('hw-lokasi').value,status:document.getElementById('hw-status').value,ket:document.getElementById('hw-ket').value});
  renderTemp('hw-list',hwItems,'hw');
  document.getElementById('hw-kat').value=''; document.getElementById('hw-sub').innerHTML='<option>— pilih kategori dulu —</option>';
  document.getElementById('hw-lokasi').value=''; document.getElementById('hw-ket').value='';
}

function addNet(){
  const kat=document.getElementById('net-kat').value;
  if(!kat){showToast('Pilih kategori jaringan dulu','info');return;}
  netItems.push({kat,sub:document.getElementById('net-sub').value,lokasi:document.getElementById('net-lokasi').value,status:document.getElementById('net-status').value,ket:document.getElementById('net-ket').value});
  renderTemp('net-list',netItems,'net');
  document.getElementById('net-kat').value=''; document.getElementById('net-sub').innerHTML='<option>— pilih kategori dulu —</option>';
  document.getElementById('net-lokasi').value=''; document.getElementById('net-ket').value='';
}

function renderTemp(id,arr,type){
  const el=document.getElementById(id);
  if(!arr.length){el.innerHTML='';return;}
  el.innerHTML=arr.map((it,i)=>`<div class="ticket ${type}">
    <div class="ticket-header">
      <div><span class="badge badge-${type==='hw'?'hw':'net'}">${it.kat}</span> <span style="font-size:12px;color:var(--text2);margin-left:4px;">${it.sub}</span></div>
      <button class="btn-danger-sm" onclick="delTemp('${type}',${i})">hapus</button>
    </div>
    <div class="ticket-desc">${it.ket||'—'}</div>
    <div class="ticket-meta">${it.lokasi||'Lokasi tidak diisi'} · <span class="badge badge-${it.status.toLowerCase()}">${it.status}</span></div>
  </div>`).join('');
}

function delTemp(type,i){
  if(type==='hw'){hwItems.splice(i,1);renderTemp('hw-list',hwItems,'hw');}
  else{netItems.splice(i,1);renderTemp('net-list',netItems,'net');}
}

function renderHwList(){ renderTemp('hw-list', hwItems, 'hw'); }

function renderNetList(){ renderTemp('net-list', netItems, 'net'); }

function resetForm(){
  // Reset identitas
  const picEl = document.getElementById('pic');
  if(picEl) picEl.value = '';
  const tglEl = document.getElementById('tgl');
  if(tglEl) tglEl.valueAsDate = new Date();
  const branchEl = document.getElementById('branch');
  if(branchEl) branchEl.value = '';
  const kodeEl = document.getElementById('branch-kode');
  if(kodeEl) kodeEl.value = '';
  // Reset daily identitas
  const dpicEl = document.getElementById('daily-pic');
  if(dpicEl) dpicEl.value = '';
  const dtglEl = document.getElementById('daily-tgl');
  if(dtglEl) dtglEl.value = '';
  // Reset tiket
  hwItems = []; netItems = []; dailyItems=[];
  renderTemp('hw-list', hwItems, 'hw');
  renderTemp('net-list', netItems, 'net');
  renderDailyList();
  // Reset field input hw & net & daily
  ['hw-kat','hw-sub','hw-lokasi','hw-ket','net-kat','net-sub','net-lokasi','net-ket','daily-ket','daily-lokasi','daily-durasi'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  const hwStatus = document.getElementById('hw-status');
  if(hwStatus) hwStatus.value = 'Selesai';
  const netStatus = document.getElementById('net-status');
  if(netStatus) netStatus.value = 'Selesai';
  // Reset panel aktivitas — semua tersembunyi, identitas tersembunyi
  ['hw','net','daily'].forEach(function(x){
    const tab = document.getElementById('act-tab-'+x);
    const panel = document.getElementById('act-panel-'+x);
    if(tab){tab.style.borderColor='var(--border2)';tab.style.color='var(--text2)';tab.style.background='var(--surface2)';}
    if(panel) panel.style.display='none';
  });
  const idCard = document.getElementById('act-identitas-card');
  if(idCard) idCard.style.display = 'none';
  // Reset mode edit
  editingLogId = null;
  window._editingTicket = null;
  clearEditMode();
  const btnBatal = document.getElementById('btn-batal-edit');
  if(btnBatal) btnBatal.style.display = 'none';
  const info = document.getElementById('simpan-info');
  if(info){ info.textContent = ''; info.style.cssText = 'font-size:12px;color:var(--text2);text-align:center;margin-top:8px;'; }
}

  function _validateTgl(tglStr){
    if(currentRole==='manager') return true;
    const d = new Date(tglStr);
    const today = new Date(); today.setHours(23,59,59,0);
    const minD  = new Date(); minD.setDate(minD.getDate()-3); minD.setHours(0,0,0,0);
    if(d > today){ showToast('Tanggal tidak boleh lebih dari hari ini','info'); return false; }
    if(d < minD){  showToast('Hanya bisa input maksimal 3 hari ke belakang. Hubungi Manager untuk perubahan lebih lama.','info'); return false; }
    return true;
  }

async function simpanDanKirim(){
  // Validasi tanggal: non-manager hanya boleh 3 hari ke belakang
  // Jika hanya daily activity, validasi lebih ringan
  const onlyDaily = !hwItems.length && !netItems.length && dailyItems.length > 0;

  let pic, tgl, branch, branchKode;
  if(onlyDaily){
    // Untuk daily, ambil dari item pertama atau dari field daily
    pic    = document.getElementById('daily-pic')?.value || dailyItems[0]?.pic || '';
    tgl    = document.getElementById('daily-tgl')?.value || dailyItems[0]?.tgl || '';
    branch = 'KP';
    branchKode = '';
    if(!pic){ showToast('Pilih nama PIC dulu','info'); return; }
    if(!tgl){ showToast('Pilih tanggal dulu','info'); return; }
    if(!_validateTgl(tgl)) return;
  } else {
    pic    = document.getElementById('pic').value;
    tgl    = document.getElementById('tgl').value;
    branch = document.getElementById('branch').value.trim();
    branchKode = document.getElementById('branch-kode').value;
    if(!pic){ showToast('Pilih nama PIC dulu','info'); return; }
    if(!tgl){ showToast('Pilih tanggal dulu','info'); return; }
    if(!_validateTgl(tgl)) return;
    if(!branch){ showToast('Isi Branch Office dulu','info'); return; }
  }

  if(!hwItems.length && !netItems.length && !dailyItems.length){ showToast('Tambah minimal 1 tiket atau aktivitas dulu','info'); return; }

  showOverlay('Menyimpan laporan...');

  const isEdit = !!editingLogId;
  const id = isEdit ? editingLogId : Date.now();

  // Kalau mode edit TIKET TERTENTU, preserve tiket lain dari cache
  let finalHw = [...hwItems];
  let finalNet = [...netItems];

  if(isEdit && window._editingTicket){
    const { entryId, type, idx } = window._editingTicket;
    const cachedEntry = logData.find(e=>String(e.id)===String(entryId));
    if(cachedEntry){
      if(type==='hw'){
        // Edit HW: ganti tiket hw[idx] dengan hwItems, preserve NET dari cache
        const oldHw = [...(cachedEntry.hw||[])];
        // Ganti tiket yang diedit (idx) dengan tiket baru dari form
        oldHw.splice(idx, 1, ...hwItems);
        finalHw = oldHw;
        finalNet = [...(cachedEntry.net||[])]; // preserve NET utuh dari cache
      } else {
        // Edit NET: ganti tiket net[idx] dengan netItems, preserve HW dari cache
        const oldNet = [...(cachedEntry.net||[])];
        oldNet.splice(idx, 1, ...netItems);
        finalNet = oldNet;
        finalHw = [...(cachedEntry.hw||[])]; // preserve HW utuh dari cache
      }
    }
  }

  const payload = {
    action: isEdit ? 'updateLog' : 'saveLog',
    id, tgl, pic, branch,
    branchKode,
    hw: finalHw,
    net: finalNet,
    daily: dailyItems,
    pin: currentPin
  };

  try {
    const fd = new FormData();
    fd.append('data', JSON.stringify(payload));
    const res = await fetch(getUrl(), { method:'POST', body:fd });
    const json = await res.json();
    hideOverlay();
    if(json.status === 'ok'){
      showToast(isEdit ? 'Laporan berhasil diupdate!' : 'Laporan berhasil dikirim!', 'ok');
      editingLogId = null;
      window._editingTicket = null;
      clearEditMode();
      const btnBatal = document.getElementById('btn-batal-edit');
      if(btnBatal) btnBatal.style.display = 'none';
      const infoEl2 = document.getElementById('simpan-info');
      if(infoEl2){ infoEl2.textContent=''; infoEl2.style.cssText='font-size:12px;color:var(--text2);text-align:center;margin-top:8px;'; }
      resetForm();
      if(isEdit){
        // Mode edit - kembali ke log harian
        setTimeout(()=>{ switchMenu('log'); setTimeout(()=>switchLogTab('maintenance'),100); }, 800);
      } else {
        // Input baru - tetap di form, clear saja
        resetForm();
      }
      // Jika mode edit, kembali ke log setelah simpan
      if(isEdit){
        setTimeout(()=>{ switchMenu('log'); setTimeout(()=>switchLogTab('maintenance'),100); }, 800);
      }
    } else {
      showToast('Gagal: ' + (json.message||'error'), 'err');
    }
  } catch(e){
    hideOverlay();
    showToast('Gagal koneksi: ' + e.message, 'err');
  }
}

function _applyPicLock(){
  var isManager = currentRole === 'manager';
  var myName = (currentUser && currentUser.name) || '';
  var picSelects = ['pic','daily-pic'];
  picSelects.forEach(function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    if(isManager){
      sel.disabled = false;
      sel.style.backgroundColor = '';
      sel.style.cursor = '';
    } else {
      // Set value ke nama sendiri dan lock
      sel.value = myName;
      // Kalau nama tidak ada di option, tambahkan
      var found = false;
      for(var i=0;i<sel.options.length;i++){
        if(sel.options[i].value === myName || sel.options[i].text === myName){ found=true; break; }
      }
      if(!found){
        var opt = document.createElement('option');
        opt.value = myName; opt.text = myName;
        sel.appendChild(opt);
        sel.value = myName;
      }
      sel.disabled = true;
      sel.style.backgroundColor = 'var(--surface3)';
      sel.style.cursor = 'not-allowed';
    }
  });
}