// ═══════════════════════════════════════════════════════════════
//  ui.js — Navigasi: sidebar, menu, pane switching, app init
// ═══════════════════════════════════════════════════════════════

function toggleSidebar(){
  var isMobile=window.innerWidth<=600;
  var sb=document.getElementById('main-sidebar'),mw=document.getElementById('main-wrap'),ov=document.getElementById('sb-overlay');
  if(isMobile){var o=sb.classList.toggle('mobile-open');if(ov)ov.classList.toggle('show',o);}
  else{sb.classList.toggle('collapsed');mw.classList.toggle('collapsed');}
}

function closeSidebarMobile(){
  var sb=document.getElementById('main-sidebar'),ov=document.getElementById('sb-overlay');
  if(sb)sb.classList.remove('mobile-open');if(ov)ov.classList.remove('show');
}

function setSbActive(el){
  document.querySelectorAll('.sb-item').forEach(function(b){b.classList.remove('active');var s=b.querySelector('.sb-svg');if(s)s.setAttribute('stroke','rgba(255,255,255,0.6)');});
  el.classList.add('active');var svg=el.querySelector('.sb-svg');if(svg)svg.setAttribute('stroke','rgba(255,255,255,0.95)');
  if(window.innerWidth<=600)closeSidebarMobile();
}

function toggleAdminSection(){ loadAdminUsers(); }

function showApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('main-app').style.display='block';
  document.getElementById('header-role').textContent=currentRole==='manager'?'Manager':(currentUser&&currentUser.name)||'PIC';
  var _av=document.getElementById('sb-avatar');if(_av)_av.textContent=((currentUser&&currentUser.name)||'U')[0].toUpperCase();
  var _nm=document.getElementById('sb-uname');if(_nm)_nm.textContent=(currentUser&&currentUser.name)||(currentRole==='manager'?'Manager':'PIC');
  var _dt=document.getElementById('top-bar-date');if(_dt)_dt.textContent=new Date().toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  var ac=document.getElementById('admin-card');if(ac)ac.style.display=currentRole==='manager'?'block':'none';
  // Manager: semua menu tampil. Non-manager: hanya Maintenance, Form OTS, Log Harian
  var isManager = currentRole === 'manager';
  // Manager: semua tampil. PIC: sembunyikan semua kecuali dasar, lalu _applyMenuConfig kontrol
  // managerOnly: sembunyikan untuk PIC, tampilkan untuk manager
  // PIC sees: Maintenance, OTS, Log Harian, Rekap Absensi
  // Manager sees everything
  // Manager: tampilkan semua. PIC: sembunyikan menu sistem, serahkan menu lain ke _applyMenuConfig
  var alwaysManagerOnly = ['mbtn-setting','sb-sec-sistem'];
  alwaysManagerOnly.forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.style.display=isManager?'':'none';
  });
  if(isManager){
    // Manager: tampilkan SEMUA menu
    ['sb-btn-pengajuan','sb-btn-rep-barang','sb-btn-rep-pengajuan',
     'sb-btn-rep-maintenance','sb-btn-rep-ots','sb-btn-upload',
     'sb-sec-upload-label','sb-sec-laporan','mbtn-log','sb-btn-rep-absensi',
     'sb-btn-maintenance','sb-btn-ots','sb-btn-grafik','sb-sec-analitik'].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.style.display='';
    });
  } else {
    // PIC: sembunyikan semua configurable menu dulu,
    // _applyMenuConfig akan tampilkan sesuai config
    var picMenuIds = typeof PIC_MENU_ITEMS !== 'undefined'
      ? PIC_MENU_ITEMS.map(function(x){return x.id;})
      : ['sb-btn-maintenance','sb-btn-ots','sb-btn-pengajuan','mbtn-log',
         'sb-btn-rep-maintenance','sb-btn-rep-ots','sb-btn-rep-barang',
         'sb-btn-rep-pengajuan','sb-btn-rep-absensi','sb-btn-upload'];
    picMenuIds.forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.style.display='none'; // sembunyikan dulu, _applyMenuConfig yg kontrol
    });
    // Section labels dikontrol oleh _applyMenuConfig - jangan hide di sini
    // agar tidak perlu counter-hide
  }
  // PIC: langsung apply menu config dari cache agar menu sudah tampil sebelum GAS verify selesai
  if(!isManager){
    var _cachedCfgNow = {};
    try{ var _mcNow=localStorage.getItem('hn_menu_cfg'); if(_mcNow) _cachedCfgNow=JSON.parse(_mcNow); }catch(e){}
    _applyMenuConfig(_cachedCfgNow);
  }
  // Lock PIC selects untuk non-manager
  _applyPicLock();
  // Hide absensi PIC filter for non-manager
  var _apwrap=document.getElementById('absen-pic-filter-wrap');
  if(_apwrap) _apwrap.style.display=currentRole==='manager'?'':'none';

  // Role-based visibility
  const mbtnSetting = document.getElementById('mbtn-setting');
  const exportCard  = document.getElementById('export-card');
  const homeBtnSetting = document.getElementById('home-btn-setting');
  if(currentRole === 'pic'){
    if(mbtnSetting) mbtnSetting.style.display = 'none';
    if(exportCard) exportCard.style.display = 'none';
    if(homeBtnSetting) homeBtnSetting.style.display = 'none';
  } else {
    if(mbtnSetting) mbtnSetting.style.display = '';
    if(exportCard) exportCard.style.display = '';
    if(homeBtnSetting) homeBtnSetting.style.display = '';
  }

  // Set URL script
  const su = getUrl();
  const scriptUrlEl = document.getElementById('script-url');
  if(su && scriptUrlEl) scriptUrlEl.value = su;

  // Set tanggal hari ini
  const now = new Date();
  const tglEl = document.getElementById('tgl');
  if(tglEl) tglEl.valueAsDate = now;
  const otsTglEl = document.getElementById('ots-tgl');
  if(otsTglEl) otsTglEl.valueAsDate = now;
  const logTglEl = document.getElementById('log-filter-tgl');
  if(logTglEl) logTglEl.value = now.toISOString().slice(0,10);
  const bulanEl = document.getElementById('ots-filter-bulan');
  if(bulanEl && BULAN_NAMES) bulanEl.value = BULAN_NAMES[now.getMonth()];

  // Tampilkan HOME screen langsung — clear stale data dari user sebelumnya
  if(typeof _picDashData !== 'undefined') _picDashData = null;
  var _staleBody = document.getElementById('pic-dash-body');
  if(_staleBody) _staleBody.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">⏳ Memuat data...</div>';
  var _mgrPicList = document.getElementById('mgr-pic-list');
  if(_mgrPicList) _mgrPicList.innerHTML = '';
  document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.menu-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.sub-bar').forEach(b=>b.style.display='none');
  const homePane = document.getElementById('pane-home');
  if(homePane) homePane.classList.add('active');
  // Update top bar title
  var topTitle2 = document.getElementById('top-bar-title');
  if(topTitle2) topTitle2.textContent = 'Beranda';
  // Set sidebar active → Beranda
  var sbHome = document.querySelector('.sb-item.active');
  if(!sbHome){ var firstSb=document.querySelector('.sb-item');if(firstSb)firstSb.classList.add('active'); }

  // Init dashboard langsung — PIC tampil dashboard, Manager tampil home bersih
  if(typeof _initHomePic === 'function') _initHomePic();
}

window.onload = function(){
  (async function(){
  const savedPin  = localStorage.getItem('hn_pin');
  const savedRole = localStorage.getItem('hn_role');
  const savedUrl  = getUrl();

  var savedUser2=savedPin?{pin:savedPin,role:savedRole||'pic',name:'',enabled:true}:null;
  try{var _su=localStorage.getItem('hn_user');if(_su)savedUser2=JSON.parse(_su);}catch(e){}
  var pinValid=!!savedPin&&!!savedUrl;
  if(pinValid&&savedUrl){
    // Re-verify against GAS on page reload
    try {
      const _vj = await fetchGAS({action:'getUserByPin', pin:savedPin});
      if(_vj.status==='ok'&&_vj.data&&_vj.data.enabled){
        currentUser={pin:savedPin,name:_vj.data.name,role:_vj.data.role,enabled:true,menuConfig:_vj.data.menuConfig||{}};
        currentPin=savedPin;currentRole=_vj.data.role;
        _cacheMyUser(currentUser);
        localStorage.setItem('hn_menu_cfg', JSON.stringify(_vj.data.menuConfig||{}));
        localStorage.setItem('hn_user', JSON.stringify(currentUser));
        showApp();
        if(_vj.data.role !== 'manager'){
          _applyMenuConfig(_vj.data.menuConfig||{});
        }
      } else { localStorage.removeItem('hn_pin'); localStorage.removeItem('hn_role'); }
    } catch(e){
      // Fallback: pakai cache lokal jika GAS tidak bisa diakses
      if(savedUser2){
        currentUser=savedUser2;currentPin=savedPin;currentRole=savedUser2.role;
        showApp();
        if(savedUser2.role !== 'manager'){
          var cachedCfg = {};
          try{ var _mc=localStorage.getItem('hn_menu_cfg'); if(_mc) cachedCfg=JSON.parse(_mc); }catch(e){}
          _applyMenuConfig(cachedCfg);
        }
      }
    }
  }
  else {
    if(savedPin&&!pinValid){localStorage.removeItem('hn_pin');localStorage.removeItem('hn_role');localStorage.removeItem('hn_user');}
    const subInput = document.getElementById('sub-input');
    if(subInput) subInput.style.display='flex';
  }
  const scriptUrlEl = document.getElementById('script-url');
  if(savedUrl && scriptUrlEl) scriptUrlEl.value=savedUrl;

  // Init tanggal OTS
  const otsDateEl = document.getElementById('ots-tgl');
  if(otsDateEl) otsDateEl.valueAsDate = new Date();
  })(); // end async IIFE
};

function switchMenu(menu){
  currentMenu=menu;
  var titles={home:'Beranda',input:'Input Data',log:'Log Harian',report:'Report',setting:'Pengaturan',upload:'ITD Upload'};
  var el=document.getElementById('top-bar-title');if(el&&titles[menu])el.textContent=titles[menu];
  document.querySelectorAll('.pane').forEach(function(x){x.classList.remove('active');});
  if(menu==='home'){var p=document.getElementById('pane-home');if(p)p.classList.add('active');if(typeof _initHomePic==='function')_initHomePic();}
  else if(menu==='log'){
    var p=document.getElementById('pane-log');if(p)p.classList.add('active');
    if(typeof loadLog==='function') loadLog();
    if(typeof loadLogOTS==='function') loadLogOTS();
  }
  else if(menu==='setting'){var p=document.getElementById('pane-setting');if(p)p.classList.add('active');var ac=document.getElementById('admin-card');if(ac)ac.style.display=currentRole==='manager'?'block':'none';if(currentRole==='manager')loadAdminUsers();}
  else if(menu==='upload'){var p=document.getElementById('pane-upload');if(p)p.classList.add('active');loadBerkasList();}
  else if(menu==='grafik'){var p=document.getElementById('pane-grafik');if(p)p.classList.add('active');if(typeof _initGrafik==='function')_initGrafik();}
  else if(menu==='input'){
    var subs=['maintenance','ots','pengajuan'];
    var s=subs.indexOf(currentSub)>=0?currentSub:'maintenance';
    switchSub(s,'input');
  }
  else if(menu==='report'){
    var subs=['rep-maintenance','rep-ots','rep-barang','rep-pengajuan','rep-absensi'];
    var s=subs.indexOf(currentSub)>=0?currentSub:'rep-maintenance';
    switchSub(s,'report');
  }
}

function switchSub(sub,menu){
  currentSub=sub;
  // Sembunyikan semua pane dan sub-bar dulu
  document.querySelectorAll('.pane').forEach(function(x){x.classList.remove('active');});
  document.querySelectorAll('.sub-bar').forEach(function(b){b.style.display='none';});
  // Tampilkan pane yang sesuai
  var pane=document.getElementById('pane-'+sub);if(pane)pane.classList.add('active');
  // Tampilkan sub-bar yang sesuai berdasarkan menu parent
  var subBarId = menu==='input'?'sub-input':menu==='report'?'sub-report':null;
  if(subBarId){var sb=document.getElementById(subBarId);if(sb)sb.style.display='flex';}
  // Update active button di sub-bar
  if(subBarId){
    var sbEl=document.getElementById(subBarId);
    if(sbEl){
      sbEl.querySelectorAll('.sub-btn').forEach(function(b){b.classList.remove('active');});
      var activBtn=document.getElementById('sbtn-'+sub);
      if(activBtn)activBtn.classList.add('active');
    }
  }
  var subT={'maintenance':'Maintenance','ots':'Form OTS','pengajuan':'Form Pengajuan','rep-maintenance':'Report Maintenance','rep-ots':'Report OTS','rep-barang':'Penggunaan Barang','rep-pengajuan':'Pengajuan Barang','rep-absensi':'Absensi'};
  var el=document.getElementById('top-bar-title');if(el&&subT[sub])el.textContent=subT[sub];
  if(sub==='rep-maintenance'){
    // Set bulan ke bulan sekarang jika belum diset
    var rmBulan=document.getElementById('rekap-bulan');
    if(rmBulan&&!rmBulan.value&&typeof BULAN_NAMES!=='undefined')
      rmBulan.value=BULAN_NAMES[new Date().getMonth()];
    loadReportMaintenance();
  }
  if(sub==='rep-ots')loadReportOTS(false);
  if(sub==='rep-pengajuan')loadReportPengajuan();
  if(sub==='rep-barang'){var e=document.getElementById('report-barang-content');if(e)e.innerHTML='<div class="no-data"><div class="no-data-icon">📦</div>Pilih filter lalu tekan Tampilkan.</div>';}
  if(sub==='pengajuan'){var t=document.getElementById('pjn-tgl');if(t&&!t.value)t.valueAsDate=new Date();if(typeof renderPjnItems==='function')renderPjnItems();}
  if(sub==='rep-absensi'){const b=document.getElementById('absen-filter-bulan');const BN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];if(b)b.value=BN[new Date().getMonth()];}
  if(sub==='maintenance'){
    // Pastikan semua panel tersembunyi saat pertama masuk — user harus pilih jenis aktivitas dulu
    ['hw','net','daily'].forEach(function(x){
      var panel=document.getElementById('act-panel-'+x);if(panel)panel.style.display='none';
      var tab=document.getElementById('act-tab-'+x);
      if(tab){tab.style.borderColor='var(--border2)';tab.style.color='var(--text2)';tab.style.background='var(--surface2)';}
    });
    var idCard=document.getElementById('act-identitas-card');if(idCard)idCard.style.display='none';
  }
}

function activateSub(sub, menu){
  currentSub = sub;
  // Update sub buttons
  const subBar = document.getElementById('sub-'+menu);
  if(subBar) subBar.querySelectorAll('.sub-btn').forEach(b=>b.classList.remove('active'));
  const sbtn = document.getElementById('sbtn-'+sub);
  if(sbtn) sbtn.classList.add('active');
  // Tampilkan pane yang sesuai
  document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));
  const pane = document.getElementById('pane-'+sub);
  if(pane) pane.classList.add('active');
}

function showPane(name){
  document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));
  const pane = document.getElementById('pane-'+name);
  if(pane) pane.classList.add('active');
}

function switchTab(t,el){ switchMenu(t); }

function saveUrl(){
  const v=document.getElementById('script-url-input')?.value?.trim()||document.getElementById('script-url')?.value?.trim();
  if(!v){showToast('URL tidak boleh kosong','err');return;}
  localStorage.setItem('hn_script_url',v);
  showToast('URL disimpan','ok');
}

function testUrl(){
  const url = document.getElementById('script-url')?.value.trim() || getUrl();
  if(!url){ showToast('Masukkan URL dulu','info'); return; }
  showToast('Menguji koneksi...','info');
  fetch(url + '?action=ping')
    .then(r=>r.text())
    .then(t=>{
      const match = t.match(/\{[\s\S]*\}/);
      if(match){
        const json = JSON.parse(match[0]);
        if(json.status==='ok') showToast('✅ Koneksi berhasil: '+json.message,'ok');
        else showToast('❌ Response error: '+json.message,'err');
      } else {
        showToast('❌ Response tidak valid','err');
      }
    })
    .catch(e=>showToast('❌ Gagal koneksi: '+e.message,'err'));
}
