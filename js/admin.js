// ═══════════════════════════════════════════════════════════════
//  admin.js — Manajemen User, Menu Config, Ubah PIN
// ═══════════════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────
var _adminUsers = [];

async function loadAdminUsers(){
  var el=document.getElementById('admin-content');
  if(!el||currentRole!=='manager') return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">⏳ Memuat data user...</div>';
  try {
    var json=await fetchGAS({action:'getUsers',pin:currentPin});
    if(json.status!=='ok'){el.innerHTML='<div class="no-data">Gagal memuat data user.</div>';return;}
    _adminUsers=json.data||[];
    _renderAdminUsers();
  } catch(e){el.innerHTML='<div class="no-data">Gagal koneksi.</div>';}
}

function _renderAdminUsers(){
  var el = document.getElementById('admin-content');
  if(!el) return;
  var users = _adminUsers;
  if(!users.length){ el.innerHTML='<div class="no-data">Belum ada user.</div>'; return; }

  var rows = '';
  users.forEach(function(u, i){
    var isMgr = u.role === 'manager';
    var badgeBg = isMgr ? '#1e3a5f' : '#0891b2';
    var statusColor = u.enabled ? '#059669' : '#dc2626';
    var statusBg    = u.enabled ? '#dcfce7' : '#fee2e2';
    rows += '<tr style="border-bottom:1px solid var(--border);">';
    // Avatar + name
    rows += '<td style="padding:10px 12px;">';
    rows += '<div style="display:flex;align-items:center;gap:10px;">';
    rows += '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1e3a5f,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;">'+u.name.charAt(0).toUpperCase()+'</div>';
    rows += '<span style="font-size:13px;font-weight:600;">'+_hesc(u.name)+'</span></div></td>';
    // Role
    rows += '<td style="padding:10px 8px;"><span style="background:'+badgeBg+';color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;">'+(isMgr?'Manager':'PIC')+'</span></td>';
    // Status toggle
    rows += '<td style="padding:10px 8px;">';
    if(!isMgr){
      rows += '<button onclick="toggleUserStatus('+i+','+u.enabled+')" style="background:'+statusBg+';color:'+statusColor+';border:1px solid '+statusColor+'44;border-radius:99px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;">'+(u.enabled?'✅ Aktif':'⛔ Nonaktif')+'</button>';
    } else {
      rows += '<span style="font-size:11px;color:var(--text3);">—</span>';
    }
    rows += '</td>';
    // Actions
    rows += '<td style="padding:10px 8px;">';
    if(!isMgr){
      rows += '<div style="display:flex;gap:4px;">';
      rows += '<button onclick="openEditUser('+i+')" class="btn-sm-edit" style="font-size:10px;padding:4px 8px;">✏️ Edit</button>';
      rows += '<button onclick="openMenuConfig('+i+')" class="btn-sm-edit" style="font-size:10px;padding:4px 8px;background:#f3e8ff;color:#6d28d9;border-color:#e9d5ff;">⚙️ Menu</button>';
      rows += '<button onclick="deleteUser('+i+')" class="btn-sm-edit" style="font-size:10px;padding:4px 8px;background:#fee2e2;color:#b91c1c;border-color:#fca5a5;">🗑</button>';
      rows += '</div>';
    } else {
      rows += '<span style="font-size:11px;color:var(--text3);">Admin</span>';
    }
    rows += '</td></tr>';
  });

  el.innerHTML = '<div style="overflow-x:auto;">'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
    + '<thead><tr style="background:#1e3a5f;color:#fff;">'
    + '<th style="padding:10px 12px;text-align:left;border-radius:8px 0 0 0;">Nama</th>'
    + '<th style="padding:10px 8px;text-align:left;">Role</th>'
    + '<th style="padding:10px 8px;text-align:left;">Status</th>'
    + '<th style="padding:10px 8px;text-align:left;border-radius:0 8px 0 0;">Aksi</th>'
    + '</tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function openAddUser(){
  document.getElementById('user-modal-title').textContent='➕ Tambah PIC Baru';
  document.getElementById('user-modal-idx').value='-1';
  document.getElementById('user-modal-name').value='';
  document.getElementById('user-modal-pin').value='';
  document.getElementById('user-modal-pin2').value='';
  var um=document.getElementById('user-modal');if(um)um.style.display='flex';
}

function openEditUser(idx){
  var u = _adminUsers[idx];
  if(!u) return;
  var name = u.name;
  document.getElementById('user-modal-title').textContent='✏️ Edit — '+name;
  document.getElementById('user-modal-idx').value=idx;
  document.getElementById('user-modal-name').value=name;
  document.getElementById('user-modal-pin').value='';
  document.getElementById('user-modal-pin2').value='';
  var um=document.getElementById('user-modal');if(um)um.style.display='flex';
}

function closeUserModal(){ var el=document.getElementById('user-modal'); if(el) el.style.display='none'; }

async function saveUserModal(){
  var idx=parseInt(document.getElementById('user-modal-idx').value);
  var name=document.getElementById('user-modal-name').value.trim();
  var pin=document.getElementById('user-modal-pin').value.trim();
  var pin2=document.getElementById('user-modal-pin2').value.trim();
  if(!name){showToast('Isi nama user','info');return;}
  if(!pin){showToast('PIN wajib diisi','info');return;}
  if(pin.length!==4||!/^\d{4}$/.test(pin)){showToast('PIN harus 4 digit angka','info');return;}
  if(pin!==pin2){showToast('Konfirmasi PIN tidak cocok','err');return;}
  var action=idx===-1?'addUser':'editUser';
  var oldName=idx>=0&&_adminUsers[idx]?_adminUsers[idx].name:'';
  showOverlay(idx===-1?'Menambah user...':'Menyimpan perubahan...');
  try {
    var fd=new FormData();
    fd.append('data',JSON.stringify({action,pin:currentPin,name,newPin:pin,oldName,role:'pic'}));
    var res=await fetch(getUrl(),{method:'POST',body:fd});
    var json=await res.json();
    hideOverlay();
    if(json.status==='ok'){showToast(idx===-1?'User ditambahkan':'User diupdate','ok');closeUserModal();await loadAdminUsers();}
    else showToast(json.message||'Gagal','err');
  } catch(e){hideOverlay();showToast('Gagal: '+e.message,'err');}
}

async function toggleUserStatus(idx, currentEnabled){
  var u = _adminUsers[idx];
  if(!u) return;
  showOverlay('Mengubah status...');
  try {
    var fd = new FormData();
    fd.append('data', JSON.stringify({
      action:'setUserEnabled', pin:currentPin,
      name: u.name,
      enabled: !currentEnabled
    }));
    var res  = await fetch(getUrl(),{method:'POST',body:fd});
    var json = await res.json();
    hideOverlay();
    if(json.status==='ok'){
      showToast(!currentEnabled?'User diaktifkan':'User dinonaktifkan','ok');
      loadAdminUsers();
    } else showToast(json.message||'Gagal','err');
  } catch(e){ hideOverlay(); showToast('Gagal: '+e.message,'err'); }
}

async function deleteUser(idx){
  var u = _adminUsers[idx];
  if(!u || u.role === 'manager') return;
  if(!confirm('Hapus user '+u.name+'? Aksi ini tidak bisa dibatalkan.')) return;
  showOverlay('Menghapus...');
  try {
    var fd = new FormData();
    fd.append('data', JSON.stringify({action:'deleteUser', pin:currentPin, name:u.name}));
    var res  = await fetch(getUrl(),{method:'POST',body:fd});
    var json = await res.json();
    hideOverlay();
    if(json.status==='ok'){ showToast('User dihapus','ok'); loadAdminUsers(); }
    else showToast(json.message||'Gagal','err');
  } catch(e){ hideOverlay(); showToast('Gagal: '+e.message,'err'); }
}

function openChangePwd(){
  document.getElementById('pwd-modal-old').value='';
  document.getElementById('pwd-modal-new').value='';
  document.getElementById('pwd-modal-new2').value='';
  document.getElementById('pwd-err').textContent='';
  var n=document.getElementById('pwd-current-name');if(n)n.textContent=(currentUser&&currentUser.name)||currentRole;
  var el=document.getElementById('pwd-modal');if(el)el.style.display='flex';
}

function closePwdModal(){var el=document.getElementById('pwd-modal');if(el)el.style.display='none';}

async function saveChangePwd(){
  var old=document.getElementById('pwd-modal-old').value.trim();
  var np=document.getElementById('pwd-modal-new').value.trim();
  var np2=document.getElementById('pwd-modal-new2').value.trim();
  var errEl=document.getElementById('pwd-err');
  errEl.textContent='';
  if(old!==currentPin){errEl.textContent='PIN lama salah.';return;}
  if(!np||np.length!==4||!/^\d{4}$/.test(np)){errEl.textContent='PIN baru harus 4 digit angka.';return;}
  if(np!==np2){errEl.textContent='Konfirmasi PIN tidak cocok.';return;}
  if(np===old){errEl.textContent='PIN baru tidak boleh sama dengan PIN lama.';return;}
  showOverlay('Menyimpan PIN baru...');
  try {
    const fd=new FormData();
    fd.append('data',JSON.stringify({action:'updatePin',pin:currentPin,oldPin:old,newPin:np}));
    const res=await fetch(getUrl(),{method:'POST',body:fd});
    const json=await res.json();
    hideOverlay();
    if(json.status==='ok'){
      currentPin=np;
      if(currentUser)currentUser.pin=np;
      localStorage.setItem('hn_pin',np);
      localStorage.setItem('hn_user',JSON.stringify(currentUser));
      closePwdModal();
      showToast('PIN berhasil diubah','ok');
    } else {
      errEl.textContent=json.message||'Gagal menyimpan PIN.';
    }
  } catch(e){hideOverlay();errEl.textContent='Gagal koneksi server.';}
}

function openMenuConfig(idx){
  var u = _adminUsers[idx];
  if(!u) return;
  _menuConfigTarget = idx;
  document.getElementById('menu-config-title').textContent = '⚙️ Akses Menu — '+u.name;
  var cfg = u.menuConfig || {};
  var body = document.getElementById('menu-config-body');

  // Group by section
  var sections = {};
  PIC_MENU_ITEMS.forEach(function(item){
    var sec = item.section || 'Lainnya';
    if(!sections[sec]) sections[sec] = [];
    sections[sec].push(item);
  });

  var html = '<div style="padding:14px 16px;">';
  html += '<div style="font-size:12px;color:var(--text2);margin-bottom:14px;background:var(--surface2);padding:10px;border-radius:8px;">✅ <b>Centang</b> = menu <b>aktif/tampil</b> untuk PIC ini. Hilangkan centang untuk menyembunyikan menu.</div>';
  // Select All / None buttons
  html += '<div style="display:flex;gap:6px;margin-bottom:14px;">';
  html += '<button onclick="_mcfgSelectAll(true)" style="font-size:11px;padding:4px 10px;border-radius:99px;background:#dcfce7;color:#065f46;border:1px solid #a7f3d0;cursor:pointer;font-family:inherit;font-weight:600;">✅ Aktifkan Semua</button>';
  html += '<button onclick="_mcfgSelectAll(false)" style="font-size:11px;padding:4px 10px;border-radius:99px;background:#fee2e2;color:#7f1d1d;border:1px solid #fca5a5;cursor:pointer;font-family:inherit;font-weight:600;">⛔ Nonaktifkan Semua</button>';
  html += '</div>';

  Object.keys(sections).forEach(function(sec){
    html += '<div style="font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.05em;padding:8px 0 6px;border-bottom:2px solid var(--border2);margin-bottom:4px;">'+sec+'</div>';
    sections[sec].forEach(function(item){
      // Jika belum ada config: gunakan defaultOn dari PIC_MENU_ITEMS
      var hasCfg = cfg && Object.keys(cfg).length > 0;
      var isOn = hasCfg ? (cfg[item.id] !== false) : (item.defaultOn === true);
      html += '<label style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border);cursor:pointer;">';
      html += '<input type="checkbox" id="mcfg-'+item.id+'" '+(isOn?'checked':'')+' style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;" onchange="this.parentElement.querySelector(\'span\').style.opacity=this.checked?\'1\':\'0.45\'">';
      html += '<span style="font-size:13px;font-weight:600;'+(isOn?'':'opacity:0.45;')+'">'+item.label+'</span>';
      html += '</label>';
    });
    html += '<div style="margin-bottom:10px;"></div>';
  });
  html += '</div>';
  body.innerHTML = html;
  document.getElementById('menu-config-modal').style.display = 'flex';
}

function _mcfgSelectAll(val){
  PIC_MENU_ITEMS.forEach(function(item){
    var cb = document.getElementById('mcfg-'+item.id);
    if(cb){
      cb.checked = val;
      cb.parentElement.style.opacity = val ? '1' : '0.45';
    }
  });
}

function closeMenuConfig(){
  document.getElementById('menu-config-modal').style.display = 'none';
  _menuConfigTarget = null;
}

async function saveMenuConfig(){
  if(_menuConfigTarget === null) return;
  var u = _adminUsers[_menuConfigTarget];
  if(!u) return;
  var cfg = {};
  PIC_MENU_ITEMS.forEach(function(item){
    if(item.isSection) return;
    var cb = document.getElementById('mcfg-'+item.id);
    if(cb) cfg[item.id] = cb.checked;
    // Juga hide/show section labels berdasarkan item di section tsb
  });
  showOverlay('Menyimpan konfigurasi...');
  try {
    var fd = new FormData();
    fd.append('data', JSON.stringify({action:'saveMenuConfig', pin:currentPin, picName:u.name, menuConfig:cfg}));
    var res  = await fetch(getUrl(),{method:'POST',body:fd});
    var json = await res.json();
    hideOverlay();
    if(json.status==='ok'){
      showToast('Konfigurasi menu disimpan','ok');
      _adminUsers[_menuConfigTarget].menuConfig = cfg;
      closeMenuConfig();
      // Apply immediately if this user is currently logged in (shouldn't happen for manager editing pic)
    } else showToast(json.message||'Gagal','err');
  } catch(e){ hideOverlay(); showToast('Gagal: '+e.message,'err'); }
}

function _applyMenuConfig(cfg){
  // cfg = {id: true/false} dari Sheet GAS
  // Jika tidak ada config -> gunakan defaultOn dari PIC_MENU_ITEMS
  var hasCfg = cfg && typeof cfg === 'object' && Object.keys(cfg).length > 0;
  var showSec = {};

  PIC_MENU_ITEMS.forEach(function(item){
    var el = document.getElementById(item.id);
    if(!el) return;
    var visible;
    if(hasCfg){
      // Ada config: false = hidden, true/undefined = tampil
      visible = cfg[item.id] !== false;
    } else {
      // Belum ada config: gunakan defaultOn
      visible = item.defaultOn === true;
    }
    el.style.display = visible ? '' : 'none';
    if(visible && item.section) showSec[item.section] = true;
  });

  // Section labels: tampil hanya jika ada minimal 1 item visible di section
  var secInput = document.getElementById('sb-sec-input');
  if(secInput) secInput.style.display = showSec['Input'] ? '' : 'none';

  var secLog = document.getElementById('sb-sec-laporan');
  if(secLog) secLog.style.display = showSec['Log & Laporan'] ? '' : 'none';

  var secBerkas = document.getElementById('sb-sec-upload-label');
  if(secBerkas) secBerkas.style.display = showSec['Berkas'] ? '' : 'none';
}
function renderAdminPage(){ _renderAdminUsers(); }
