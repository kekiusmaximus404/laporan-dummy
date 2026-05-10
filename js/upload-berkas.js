// ═══════════════════════════════════════════════════════════════
//  upload-berkas.js — ITD Upload: upload, list, hapus berkas
// ═══════════════════════════════════════════════════════════════

// ── Constants & State ────────────────────────────────────
var _uploadFile   = null;
var _berkasAll    = [];
var _folderList   = [];  // cached folder names from existing berkas

var _FILE_ICONS = {
  pdf:'📕', docx:'📘', doc:'📘', xlsx:'📗', xls:'📗',
  pptx:'📙', ppt:'📙', txt:'📄', csv:'📊'
};
var _FILE_MIME = {
  pdf:'application/pdf',
  docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:'application/msword',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:'application/vnd.ms-excel',
  pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt:'application/vnd.ms-powerpoint',
  txt:'text/plain', csv:'text/csv'
};

function _handleUploadDrop(e){
  e.preventDefault();
  var dz = document.getElementById('upload-dropzone');
  if(dz){ dz.style.borderColor='var(--border2)'; dz.style.background='var(--bg)'; }
  var files = e.dataTransfer.files;
  if(files&&files.length>0) _setUploadFile(files[0]);
}

function _onUploadFileSelected(input){
  if(input.files&&input.files.length>0) _setUploadFile(input.files[0]);
}

function _setUploadFile(file){
  _uploadFile = file;
  var ext = _getFileExt(file.name);
  var preview = document.getElementById('upload-file-preview');
  document.getElementById('upload-file-icon').textContent = _getFileIcon(file.name);
  document.getElementById('upload-file-name').textContent = file.name;
  document.getElementById('upload-file-size').textContent = _formatSize(file.size)+' · '+ext.toUpperCase();
  if(preview) preview.style.display='flex';
  // Update dropzone
  var dz = document.getElementById('upload-dropzone');
  if(dz){ dz.style.borderColor='var(--accent)'; dz.style.background='rgba(59,130,246,0.03)'; }
}

function _clearUploadFile(){
  _uploadFile = null;
  var preview = document.getElementById('upload-file-preview');
  if(preview) preview.style.display='none';
  var input = document.getElementById('upload-file-input');
  if(input) input.value='';
  var dz = document.getElementById('upload-dropzone');
  if(dz){ dz.style.borderColor='var(--border2)'; dz.style.background='var(--bg)'; }
}

function _setProgress(pct, msg){
  var bar  = document.getElementById('upload-progress-bar');
  var txt  = document.getElementById('upload-progress-text');
  var wrap = document.getElementById('upload-progress');
  if(wrap) wrap.style.display = pct>=0 ? 'block' : 'none';
  if(bar)  bar.style.width = pct+'%';
  if(txt)  txt.textContent = msg||'';
}


function _initFolderSelector(){
  // Build folder list from existing berkas data
  var seen = {};
  (_berkasAll||[]).forEach(function(b){ if(b.title) seen[b.title]=true; });
  _folderList = Object.keys(seen).sort();
  _renderFolderSelector();
}

function _renderFolderSelector(){
  var sel  = document.getElementById('upload-folder-select');
  var newWrap = document.getElementById('upload-newfolder-wrap');
  if(!sel) return;
  // Keep current selection
  var curVal = sel.value;
  sel.innerHTML = '<option value="">— Pilih folder —</option>';
  _folderList.forEach(function(f){
    var opt = document.createElement('option');
    opt.value = f; opt.textContent = f;
    sel.appendChild(opt);
  });
  var newOpt = document.createElement('option');
  newOpt.value = '__new__'; newOpt.textContent = '➕ Buat folder baru...';
  sel.appendChild(newOpt);
  // Restore selection
  if(curVal) sel.value = curVal;
}

function _onFolderSelectChange(){
  var sel  = document.getElementById('upload-folder-select');
  var newWrap = document.getElementById('upload-newfolder-wrap');
  var newInput = document.getElementById('upload-newfolder-input');
  if(!sel||!newWrap) return;
  if(sel.value === '__new__'){
    newWrap.style.display = 'flex';
    if(newInput) newInput.focus();
  } else {
    newWrap.style.display = 'none';
  }
}

function _getSelectedFolder(){
  var sel  = document.getElementById('upload-folder-select');
  var newInput = document.getElementById('upload-newfolder-input');
  if(!sel) return '';
  if(sel.value === '__new__'){
    var newName = (newInput ? newInput.value.trim() : '');
    if(!newName){ showToast('Isi nama folder baru dulu','info'); return null; }
    return newName;
  }
  return sel.value;
}

async function doUploadBerkas(){
  var title = _getSelectedFolder();
  if(title === null) return; // error shown by _getSelectedFolder
  if(!title){ showToast('Pilih atau buat folder dokumen dulu','info'); document.getElementById('upload-folder-select')?.focus(); return; }
  if(!_uploadFile){ showToast('Pilih file terlebih dahulu','info'); return; }

  var maxSize = 15*1024*1024; // 15MB
  if(_uploadFile.size > maxSize){ showToast('Ukuran file max 15MB','info'); return; }

  var ext  = _getFileExt(_uploadFile.name);
  // Validasi format yang didukung
  var supportedExts = ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv'];
  // Semua format didukung - tidak perlu konfirmasi
  // GAS akan handle konversi PDF jika memungkinkan
  var mime = _FILE_MIME[ext] || _uploadFile.type || 'application/octet-stream';

  _setProgress(10,'Membaca file...');

  try {
    // Read as base64
    var base64 = await new Promise(function(res,rej){
      var reader = new FileReader();
      reader.onload  = function(e){ res(e.target.result.split(',')[1]); };
      reader.onerror = function(){ rej(new Error('Gagal baca file')); };
      reader.readAsDataURL(_uploadFile);
    });

    _setProgress(35,'Mengirim ke Google Drive...');

    var fd = new FormData();
    fd.append('data', JSON.stringify({
      action:    'uploadBerkas',
      pin:       currentPin,
      title:     title,
      namaFile:  _uploadFile.name,
      mimeType:  mime,
      uploader:  (currentUser&&currentUser.name)||'Manager',
      data:      base64
    }));

    _setProgress(60,'Menyimpan dan convert PDF...');

    var res  = await fetch(getUrl(), {method:'POST', body:fd});
    var json = await res.json();

    _setProgress(100,'Selesai!');
    setTimeout(function(){ _setProgress(-1,''); }, 1500);

    if(json.status==='ok'){
      var pdfOk = json.data && json.data.pdfUrl && json.data.pdfUrl.length > 5;
      if(pdfOk){
        showToast('✅ Upload berhasil + PDF tersimpan!','ok');
      } else {
        showToast('✅ Upload berhasil! (File Word/Excel dapat diconvert ke PDF via tombol PDF)','ok');
      }
      _clearUploadFile();
      var _sel = document.getElementById('upload-folder-select');
      if(_sel) _sel.value = '';
      var _nw = document.getElementById('upload-newfolder-input');
      if(_nw) _nw.value = '';
      var _nwWrap = document.getElementById('upload-newfolder-wrap');
      if(_nwWrap) _nwWrap.style.display = 'none';
      loadBerkasList();
    } else {
      showToast('Gagal: '+(json.message||'error'),'err');
      _setProgress(-1,'');
    }
  } catch(e){
    _setProgress(-1,'');
    showToast('Gagal: '+e.message,'err');
  }
}

async function loadBerkasList(){
  var el = document.getElementById('berkas-list-content');
  if(!el) return;
  el.innerHTML='<div class="loading-text">⏳ Memuat daftar berkas...</div>';
  try {
    var json = await fetchGAS({action:'getBerkas', pin:currentPin});
    if(json.status!=='ok'){ el.innerHTML='<div class="no-data">Gagal memuat data.</div>'; return; }
    _berkasAll = json.data||[];
    _renderBerkasList(_berkasAll);
    _initFolderSelector();
  } catch(e){
    el.innerHTML='<div class="no-data">Gagal koneksi.</div>';
  }
}

function _filterBerkas(){
  var q = (document.getElementById('berkas-search')?.value||'').toLowerCase();
  var filtered = !q ? _berkasAll : _berkasAll.filter(function(b){
    return (b.title+b.namaFile).toLowerCase().indexOf(q)>=0;
  });
  _renderBerkasList(filtered);
}

function _renderBerkasList(list){
  var el = document.getElementById('berkas-list-content');
  if(!el) return;
  if(!list||!list.length){
    el.innerHTML='<div class="no-data"><div class="no-data-icon">📁</div>Tidak ada berkas ditemukan.</div>';
    return;
  }

  // Group by title/folder
  var groups = {};
  list.forEach(function(b){
    var g = b.title||'Lainnya';
    if(!groups[g]) groups[g]=[];
    groups[g].push(b);
  });

  var html = '';
  Object.keys(groups).sort().forEach(function(grp){
    html += '<div style="margin-bottom:18px;">';
    html += '<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.05em;padding:6px 0 8px;border-bottom:1px solid var(--border);margin-bottom:8px;display:flex;align-items:center;gap:6px;">';
    html += '<span style="font-size:14px;">📁</span> '+_esc(grp)+' <span style="font-weight:400;color:var(--text3);">('+groups[grp].length+' berkas)</span></div>';

    groups[grp].forEach(function(b){
      var icon = _getFileIcon(b.namaFile);
      var hasPdf = b.pdfUrl && b.pdfUrl.length > 5;
      html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:var(--radius-xs);background:var(--surface2);margin-bottom:6px;border:1px solid var(--border);">';
      html += '<div style="font-size:24px;flex-shrink:0;line-height:1;">'+icon+'</div>';
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:13px;font-weight:600;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(b.namaFile)+'</div>';
      html += '<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+_esc(b.waktu)+' · '+b.sizeKB+' KB · '+_esc(b.uploader)+'</div>';
      html += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">';
      if(b.fileUrl&&b.fileUrl.length>5)
        html += '<a href="'+b.fileUrl+'" target="_blank" style="font-size:11px;padding:4px 10px;border-radius:99px;background:#e0f2fe;color:#0369a1;text-decoration:none;font-weight:600;">⬇ File Asli</a>';
      if(hasPdf)
        html += '<a href="'+b.pdfUrl+'" target="_blank" style="font-size:11px;padding:4px 10px;border-radius:99px;background:#fce7f3;color:#9d174d;text-decoration:none;font-weight:600;">📕 Lihat PDF</a>';
      html += '<button onclick="exportBerkasPDF(\''+b.id+'\')" style="font-size:11px;padding:4px 10px;border-radius:99px;background:#f3e8ff;color:#6d28d9;border:none;cursor:pointer;font-weight:600;font-family:inherit;">🖨️ Export PDF</button>';
      html += '<button onclick="_deleteBerkas(\''+b.id+'\')" style="font-size:11px;padding:4px 10px;border-radius:99px;background:#fee2e2;color:#b91c1c;border:none;cursor:pointer;font-weight:600;font-family:inherit;">🗑 Hapus</button>';
      html += '</div></div></div>';
    });
    html += '</div>';
  });

  el.innerHTML = html;
}

async function _deleteBerkas(id){
  if(!confirm('Hapus berkas ini dari daftar? (File di Drive tidak ikut terhapus)')) return;
  showOverlay('Menghapus...');
  try {
    var fd = new FormData();
    fd.append('data', JSON.stringify({action:'deleteBerkas', pin:currentPin, id:id}));
    var res  = await fetch(getUrl(),{method:'POST',body:fd});
    var json = await res.json();
    hideOverlay();
    if(json.status==='ok'){ showToast('Berkas dihapus dari daftar','ok'); loadBerkasList(); }
    else showToast('Gagal: '+(json.message||'error'),'err');
  } catch(e){ hideOverlay(); showToast('Gagal: '+e.message,'err'); }
}

async function _generateBerkasPDF(berkas) {
  // Extract fileId dari Google Drive URL
  var fileUrl = berkas.fileUrl || '';
  var match   = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  if (!match) {
    // Try alternate format
    match = fileUrl.match(/id=([a-zA-Z0-9_-]+)/);
  }
  if (!match) {
    showToast('Tidak bisa mengambil ID file dari URL Drive.','err');
    return;
  }
  var fileId = match[1];

  showOverlay('Mengonversi ' + berkas.namaFile + ' ke PDF...');
  try {
    var json = await fetchGAS({
      action:  'convertBerkasToPdf',
      pin:     currentPin,
      fileId:  fileId
    });

    hideOverlay();

    if (json.status !== 'ok' || !json.base64) {
      showToast('Gagal konversi: ' + (json.message||'error'), 'err');
      return;
    }

    // Decode base64 → Blob → download
    var byteChars = atob(json.base64);
    var byteArr   = new Uint8Array(byteChars.length);
    for (var i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    var blob = new Blob([byteArr], {type: 'application/pdf'});
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = json.filename || berkas.namaFile.replace(/\.[^.]+$/, '') + '.pdf';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    showToast('PDF "' + a.download + '" berhasil diunduh!', 'ok');

  } catch(e) {
    hideOverlay();
    showToast('Gagal: ' + e.message, 'err');
  }
}
