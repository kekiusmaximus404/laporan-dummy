// ═══════════════════════════════════════════════════════════════
//  auth.js — Login, logout, user session & PIN management
// ═══════════════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────
var currentPin  = '';
var currentRole = '';
var currentUser = null;

async function _fetchUsers(){
  if(!_usersCache){
    try {
      const url = getUrl();
      if(!url) return [];
      const res = await fetch(url+'?action=getUsers&pin='+encodeURIComponent(document.getElementById('pin-input').value.trim())+'&callback=');
      // pakai fetchGAS setelah URL tersedia
    } catch(e){}
  }
  return _usersCache||[];
}

function _cacheMyUser(user){ localStorage.setItem('hn_user',JSON.stringify(user)); }

async function getUsers(){
  if(_usersCache) return _usersCache;
  if(!getUrl()) return [];
  try {
    const json = await fetchGAS({action:'getUsers', pin:currentPin});
    if(json.status==='ok') _usersCache = json.data||[];
  } catch(e){}
  return _usersCache||[];
}

function saveUsers(u){ /* deprecated - edit lewat admin panel GAS */ }

function findUser(pin){ return null; /* login langsung ke GAS */ }

async function doLogin(){
  const pin = document.getElementById('pin-input').value.trim();
  const err = document.getElementById('login-err');
  if(!pin){ err.textContent='Masukkan PIN dulu.'; return; }
  if(pin.length !== 4){ err.textContent='PIN harus 4 digit.'; return; }
  if(!/^\d{4}$/.test(pin)){ err.textContent='PIN hanya angka.'; return; }

  const url = getUrl();
  if(!url){
    err.textContent='URL Script belum diset. Buka Pengaturan dulu.';
    return;
  }
  err.textContent='⏳ Memeriksa...';
  try {
    const json = await fetchGAS({action:'getUserByPin', pin});
    if(json.status!=='ok'||!json.data){
      err.textContent='PIN salah atau akun tidak aktif.';
      document.getElementById('pin-input').value='';
      return;
    }
    const user = json.data;
    if(!user.enabled){ err.textContent='Akun dinonaktifkan.'; document.getElementById('pin-input').value=''; return; }
    currentUser={pin, name:user.name, role:user.role, enabled:true, menuConfig:user.menuConfig||{}};
    currentRole=user.role; currentPin=pin;
    localStorage.setItem('hn_pin',pin);
    localStorage.setItem('hn_role',user.role);
    localStorage.setItem('hn_menu_cfg', JSON.stringify(user.menuConfig||{}));
    localStorage.setItem('hn_user', JSON.stringify(currentUser)); // update cache
    _cacheMyUser(currentUser);
    err.textContent='';
    showApp();
    // Apply menu config for PIC - setTimeout ensures DOM is updated after showApp
    if(user.role !== 'manager'){
      _applyMenuConfig(user.menuConfig||{});
    }
  } catch(e){
    err.textContent='Gagal koneksi ke server.';
  }
}

function doLogout(){
  // Confirm dialog
  var modal = document.createElement('div');
  modal.id = 'logout-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = '<div style="background:var(--surface);border-radius:16px;padding:28px 32px;max-width:320px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.3);">'
    + '<div style="font-size:32px;margin-bottom:10px;">⏻</div>'
    + '<div style="font-size:16px;font-weight:800;color:var(--text1);margin-bottom:8px;">Keluar Dari Aplikasi</div>'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:24px;">Semua form akan direset. Yakin ingin keluar?</div>'
    + '<div style="display:flex;gap:12px;justify-content:center;">'
    + '<button id="logout-no" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid var(--border2);background:var(--surface2);color:var(--text1);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Tidak</button>'
    + '<button id="logout-yes" style="flex:1;padding:10px;border-radius:10px;border:none;background:#ef4444;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Ya, Keluar</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  document.getElementById('logout-no').onclick = function(){ document.body.removeChild(modal); };
  document.getElementById('logout-yes').onclick = function(){
    document.body.removeChild(modal);
    _doLogoutNow();
  };
}

function _doLogoutNow(){
  // Clear all state
  currentRole = ''; currentPin = ''; currentUser = null;
  _usersCache = null; _picDashData = null;
  localStorage.removeItem('hn_pin');
  localStorage.removeItem('hn_role');
  localStorage.removeItem('hn_user');
  localStorage.removeItem('hn_menu_cfg');

  // Reset ALL forms to default
  _resetAllForms();

  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('pin-input').value = '';
  document.getElementById('login-err').textContent = '';
}

function _resetAllForms(){
  // Reset form maintenance
  try{ if(typeof resetForm==='function') resetForm(); }catch(e){}
  // Reset form OTS
  try{ var f=document.getElementById('ots-form'); if(f) f.reset(); }catch(e){}
  // Reset sub-state variables
  try{ currentSub=''; currentMenu='home'; currentLogTab='maintenance'; }catch(e){}
  // Clear dynamic content areas
  var clearIds = ['pic-dash-body','mgr-pic-list','log-body','ots-log-body',
                  'barang-list-body','pengajuan-list-body','berkas-list-body'];
  clearIds.forEach(function(id){
    var el=document.getElementById(id); if(el) el.innerHTML='';
  });
  // Reset all panes to hidden, deactivate sidebar
  document.querySelectorAll('.pane').forEach(function(x){ x.classList.remove('active'); });
  document.querySelectorAll('.menu-btn,.sb-item').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.sub-bar').forEach(function(b){ b.style.display='none'; });
}
