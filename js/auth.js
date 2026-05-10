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
      setTimeout(function(){ _applyMenuConfig(user.menuConfig||{}); }, 50);
    }
  } catch(e){
    err.textContent='Gagal koneksi ke server.';
  }
}

function doLogout(){
  currentRole=null; currentPin=null;
  localStorage.removeItem('hn_pin');
  localStorage.removeItem('hn_role');
  document.getElementById('main-app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('pin-input').value='';
  document.getElementById('login-err').textContent='';
}
