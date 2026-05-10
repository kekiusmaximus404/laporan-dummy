// ═══════════════════════════════════════════════════════════════
//  dashboard.js — Dashboard PIC personal: load & render
// ═══════════════════════════════════════════════════════════════

function _initHomePic(){
  // Tampilkan panel sesuai role
  var mgrPane = document.getElementById('home-manager');
  var picPane = document.getElementById('home-pic');
  if(currentRole === 'manager'){
    if(mgrPane) mgrPane.style.display = 'block';
    if(picPane) picPane.style.display = 'none';
    // Init greeting & tanggal manager
    var mgrGreet = document.getElementById('mgr-greeting');
    var mgrDate  = document.getElementById('mgr-date');
    var now = new Date();
    var h = now.getHours();
    var greetStr = h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
    var uname = (currentUser && currentUser.name) || 'Manager';
    if(mgrGreet) mgrGreet.textContent = greetStr + ', ' + uname + '!';
    var days4=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var months4=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    if(mgrDate) mgrDate.textContent = days4[now.getDay()] + ', ' + now.getDate() + ' ' + months4[now.getMonth()] + ' ' + now.getFullYear();
    // Load PIC list untuk manager - auto load dashboard PIC pertama
    _loadManagerPicList();
    return;
  }
  if(mgrPane) mgrPane.style.display = 'none';
  if(picPane) picPane.style.display = 'block';

  // Isi header avatar
  var name = (currentUser && currentUser.name) || '';
  var av = document.getElementById('pic-dash-avatar');
  var nm = document.getElementById('pic-dash-name');
  var dt = document.getElementById('pic-dash-date');
  if(av) av.textContent = name.charAt(0).toUpperCase();
  if(nm) nm.textContent = name;
  var now = new Date();
  var days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  if(dt) dt.textContent = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();

  // Load data
  _loadPicDashboard(name);
}

async function _loadPicDashboard(picName){
  var body = document.getElementById('pic-dash-body');
  if(!body) return;
  body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">⏳ Memuat data...</div>';
  try {
    var json = await fetchGAS({action:'getMyDashboard', pin:currentPin, picName:picName});
    if(json.status !== 'ok' || !json.data){
      body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Gagal memuat dashboard.</div>';
      return;
    }
    _picDashData = json.data;
    _renderPicDashboard(json.data);
  } catch(e){
    body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Tidak dapat terhubung ke server.</div>';
  }
}

function _renderPicDashboard(d){
  var body = document.getElementById('pic-dash-body');
  if(!body) return;

  var now = new Date();
  var isWeekend = now.getDay() === 0 || now.getDay() === 6;

  // ── Today Status Banner ──────────────────────────────────
  var todayBg, todayIcon, todayTxt, todaySubtxt;
  if(isWeekend){
    todayBg='linear-gradient(135deg,#64748b,#475569)';
    todayIcon='😴'; todayTxt='Hari Libur';
    todaySubtxt='Selamat beristirahat!';
  } else if(d.todayLogged){
    todayBg='linear-gradient(135deg,#059669,#0d9488)';
    todayIcon='✅'; todayTxt='Laporan Hari Ini Sudah Masuk';
    todaySubtxt='Terima kasih telah melaporkan aktivitas hari ini.';
  } else {
    todayBg='linear-gradient(135deg,#dc2626,#b91c1c)';
    todayIcon='⚠️'; todayTxt='Laporan Belum Diinput Hari Ini';
    todaySubtxt='Segera input laporan harian sebelum akhir jam kerja.';
  }

  var html = '';

  // Today banner
  html += '<div style="background:'+todayBg+';border-radius:14px;padding:18px 20px;margin-bottom:14px;color:#fff;">';
  html += '<div style="display:flex;align-items:center;gap:14px;">';
  html += '<div style="font-size:36px;">'+todayIcon+'</div>';
  html += '<div><div style="font-size:15px;font-weight:700;">'+todayTxt+'</div>';
  html += '<div style="font-size:12px;opacity:0.85;margin-top:3px;">'+todaySubtxt+'</div></div></div></div>';

  // ── Streak ──────────────────────────────────────────────
  if(d.streak > 0 && !isWeekend){
    var streakColor = d.streak >= 5 ? '#f59e0b' : d.streak >= 3 ? '#3b82f6' : '#6b7280';
    var streakEmoji = d.streak >= 7 ? '🔥🔥🔥' : d.streak >= 5 ? '🔥🔥' : d.streak >= 3 ? '🔥' : '✨';
    html += '<div style="background:var(--surface2);border:1.5px solid '+streakColor+'44;border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;">';
    html += '<div style="font-size:28px;">'+streakEmoji+'</div>';
    html += '<div><div style="font-size:13px;font-weight:700;color:var(--text1);">Streak '+d.streak+' Hari Kerja Berturut-turut</div>';
    html += '<div style="font-size:11px;color:var(--text3);margin-top:2px;">Pertahankan konsistensi laporan harianmu!</div></div></div>';
  }

  // ── Statistik Bulan ─────────────────────────────────────
  var pct = d.stats.totalWorkdays > 0 ? Math.round(d.stats.totalDaysLogged / d.stats.totalWorkdays * 100) : 0;
  html += '<div style="background:var(--surface2);border-radius:12px;padding:16px;margin-bottom:14px;">';
  html += '<div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">📊 Statistik '+_hesc(d.bulan)+'</div>';

  // Progress bar kehadiran
  html += '<div style="margin-bottom:14px;">';
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:6px;">';
  html += '<span>Kehadiran Input Laporan</span>';
  html += '<span style="font-weight:700;color:var(--text1);">'+d.stats.totalDaysLogged+' / '+d.stats.totalWorkdays+' hari kerja</span></div>';
  html += '<div style="background:var(--border);border-radius:99px;height:8px;overflow:hidden;">';
  html += '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#1e3a5f,#3b82f6);border-radius:99px;transition:width 0.6s;"></div></div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-top:4px;text-align:right;">'+pct+'% hari kerja</div></div>';

  // Stats grid
  // ── Kunjungan Lapangan (OTS) - card besar ───────────────────
  html += '<div style="background:linear-gradient(135deg,#4c1d95,#7c3aed);border-radius:12px;padding:14px 18px;margin-bottom:8px;color:#fff;display:flex;align-items:center;gap:16px;">';
  html += '<div style="font-size:36px;flex-shrink:0;">🚗</div>';
  html += '<div style="flex:1;">';
  html += '<div style="font-size:11px;font-weight:600;opacity:0.8;text-transform:uppercase;letter-spacing:0.05em;">Kunjungan Lapangan (OTS) Bulan Ini</div>';
  html += '<div style="font-size:32px;font-weight:900;line-height:1.1;margin-top:2px;">' + d.stats.ots + ' <span style="font-size:14px;font-weight:500;opacity:0.85;">kunjungan</span></div>';
  html += '<div style="font-size:11px;opacity:0.75;margin-top:2px;">' + _hesc(d.bulan) + '</div>';
  html += '</div></div>';

  var stats = [
    {label:'Tiket Hardware',  val:d.stats.hw,      icon:'🖥️', color:'#3b82f6'},
    {label:'Tiket Jaringan',  val:d.stats.net,     icon:'🌐', color:'#0891b2'},
    {label:'Daily Activity',  val:d.stats.daily,   icon:'📓', color:'#f59e0b'},
    {label:'Hari Hadir Input',val:d.stats.totalDaysLogged, icon:'📅', color:'#059669'},
    {label:'Tiket Selesai',   val:d.stats.selesai, icon:'✅', color:'#059669'},
    {label:'Eskalasi',        val:d.stats.eskalasi,icon:'🚨', color:'#dc2626'},
  ];
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
  stats.forEach(function(s){
    html += '<div style="background:var(--bg);border-radius:10px;padding:10px;text-align:center;border:1px solid var(--border);">';
    html += '<div style="font-size:18px;">'+s.icon+'</div>';
    html += '<div style="font-size:20px;font-weight:800;color:'+s.color+';line-height:1.2;margin-top:2px;">'+s.val+'</div>';
    html += '<div style="font-size:10px;color:var(--text3);margin-top:2px;">'+s.label+'</div>';
    html += '</div>';
  });
  html += '</div></div>';

  // ── Reminder: Hari Kosong ────────────────────────────────
  if(d.missing && d.missing.length > 0){
    html += '<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:14px 16px;margin-bottom:14px;">';
    html += '<div style="font-size:12px;font-weight:700;color:#b91c1c;margin-bottom:8px;">⚠️ Hari Kerja Belum Diinput</div>';
    d.missing.forEach(function(ds){
      var dd = new Date(ds+'T00:00:00');
      var days2 = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      var months2 = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      var label = days2[dd.getDay()]+', '+dd.getDate()+' '+months2[dd.getMonth()];
      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #fca5a544;">';
      html += '<div style="width:6px;height:6px;border-radius:50%;background:#ef4444;flex-shrink:0;"></div>';
      html += '<div style="font-size:12px;color:#7f1d1d;">'+label+' — Belum ada laporan</div>';
      html += '</div>';
    });
    html += '<div style="font-size:11px;color:#b91c1c;margin-top:8px;opacity:0.8;">Segera input laporan sebelum melewati batas 3 hari.</div>';
    html += '</div>';
  }

  // ── OTS Bulan Ini ────────────────────────────────────────
  if(d.otsRecent && d.otsRecent.length > 0){
    html += '<div style="background:var(--surface2);border-radius:12px;padding:14px 16px;margin-bottom:14px;">';
    html += '<div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">🚗 OTS Bulan Ini</div>';
    d.otsRecent.forEach(function(o){
      var dd = new Date(o.tgl+'T00:00:00');
      var months3 = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      var days3 = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">';
      html += '<div style="width:36px;height:36px;border-radius:8px;background:#7c3aed22;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🚗</div>';
      html += '<div><div style="font-size:12px;font-weight:600;color:var(--text1);">'+_hesc(o.bo)+'</div>';
      html += '<div style="font-size:11px;color:var(--text3);">'+days3[dd.getDay()]+', '+dd.getDate()+' '+months3[dd.getMonth()]+'</div></div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // ── Aktivitas Terbaru ────────────────────────────────────
  if(d.recent && d.recent.length > 0){
    html += '<div style="background:var(--surface2);border-radius:12px;padding:14px 16px;margin-bottom:14px;">';
    html += '<div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">🕐 Aktivitas Terbaru</div>';
    d.recent.forEach(function(r){
      var tipeIcon = r.tipe==='Hardware'?'🖥️':r.tipe==='Jaringan'?'🌐':'📓';
      var statusColor = r.status==='Selesai'?'#059669':r.status==='Proses'?'#d97706':r.status==='Eskalasi'?'#dc2626':'#6b7280';
      var dd2 = new Date(r.tgl+'T00:00:00');
      var months4 = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">';
      html += '<div style="width:32px;height:32px;border-radius:8px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;border:1px solid var(--border);">'+tipeIcon+'</div>';
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:12px;font-weight:600;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_hesc(r.kat)+(r.sub&&r.sub!=='-'?' — '+_hesc(r.sub):'')+'</div>';
      html += '<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+dd2.getDate()+' '+months4[dd2.getMonth()]+' · '+_hesc(r.lokasi||'')+'</div>';
      html += '</div>';
      if(r.status){
        html += '<div style="font-size:10px;font-weight:600;color:'+statusColor+';background:'+statusColor+'18;padding:2px 8px;border-radius:99px;flex-shrink:0;align-self:center;">'+_hesc(r.status)+'</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Footer refresh info
  html += '<div style="text-align:center;font-size:11px;color:var(--text3);padding-top:8px;">Data diperbarui saat login · Hanya dapat dilihat</div>';

  body.innerHTML = html;
}

function _slugName(name){ return name.replace(/[^a-zA-Z0-9]/g,'_'); }

// ── Manager: load daftar PIC dan tampilkan tab ───────────────────
var _mgrActivePic = null;

async function _loadManagerPicList(){
  var tabsEl = document.getElementById('mgr-pic-tabs');
  if(!tabsEl) return;
  tabsEl.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:4px;">⏳ Memuat daftar PIC...</div>';

  try {
    var json = await fetchGAS({action:'getUsers', pin:currentPin});
    var users = (json.status==='ok' && json.data) ? json.data : [];
    var pics = users.filter(function(u){ return u.role !== 'manager' && u.enabled; });

    if(!pics.length){
      tabsEl.innerHTML = '<div style="font-size:12px;color:var(--text3);">Tidak ada PIC aktif.</div>';
      return;
    }

    // Render tab buttons
    tabsEl.innerHTML = '';
    pics.forEach(function(pic, i){
      var btn = document.createElement('button');
      btn.textContent = pic.name;
      btn.dataset.picName = pic.name;
      btn.style.cssText = 'padding:8px 18px;border-radius:99px;border:1.5px solid var(--border2);'
        + 'background:var(--surface2);color:var(--text2);font-size:13px;font-weight:600;'
        + 'cursor:pointer;font-family:inherit;transition:all 0.15s;';
      btn.onclick = function(){
        // Update active style
        tabsEl.querySelectorAll('button').forEach(function(b){
          b.style.background='var(--surface2)'; b.style.color='var(--text2)';
          b.style.borderColor='var(--border2)';
        });
        btn.style.background='#1e3a5f'; btn.style.color='#fff'; btn.style.borderColor='#1e3a5f';
        _loadManagerPicDash(pic.name);
      };
      tabsEl.appendChild(btn);
      // Auto-click first PIC
      if(i === 0){ btn.click(); }
    });
  } catch(e){
    tabsEl.innerHTML = '<div style="font-size:12px;color:var(--text3);">Gagal memuat daftar PIC.</div>';
  }
}

async function _loadManagerPicDash(picName){
  _mgrActivePic = picName;
  var wrap  = document.getElementById('mgr-pic-dash-wrap');
  var body  = document.getElementById('mgr-pic-dash-body');
  var avEl  = document.getElementById('mgr-pic-avatar');
  var nmEl  = document.getElementById('mgr-pic-name');
  var dtEl  = document.getElementById('mgr-pic-date');
  if(!wrap || !body) return;

  wrap.style.display = 'block';
  if(avEl) avEl.textContent = picName.charAt(0).toUpperCase();
  if(nmEl) nmEl.textContent = picName;
  var now2 = new Date();
  var days5=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var months5=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  if(dtEl) dtEl.textContent = days5[now2.getDay()] + ', ' + now2.getDate() + ' ' + months5[now2.getMonth()] + ' ' + now2.getFullYear();

  body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">⏳ Memuat data ' + _hesc(picName) + '...</div>';

  try {
    var json = await fetchGAS({action:'getMyDashboard', pin:currentPin, picName:picName});
    if(json.status !== 'ok' || !json.data){
      body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Gagal memuat dashboard ' + _hesc(picName) + '.</div>';
      return;
    }
    // Render menggunakan fungsi yang sama dengan PIC view — tapi inject ke mgr-pic-dash-body
    _renderPicDashboardTo(body, json.data);
  } catch(e){
    body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Tidak dapat terhubung ke server.</div>';
  }
}

// Versi _renderPicDashboard yang bisa diinject ke elemen mana saja
function _renderPicDashboardTo(targetEl, d){
  // Simpan body PIC asli sementara, ganti target, render, restore
  var origEl = document.getElementById('pic-dash-body');
  var origContent = origEl ? origEl.innerHTML : '';
  // Gunakan targetEl sebagai target render
  var fakeId = 'pic-dash-body';
  if(origEl) origEl.id = '__pic_dash_body_hidden';
  targetEl.id = fakeId;
  _renderPicDashboard(d);
  targetEl.id = 'mgr-pic-dash-body';
  if(origEl){ origEl.id = fakeId; }
}
