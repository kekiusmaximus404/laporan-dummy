// ═══════════════════════════════════════════════════════════════
//  utils.js — Helper: compress image, format, toast, overlay
// ═══════════════════════════════════════════════════════════════

async function compressImage(file){
  return new Promise(function(res){
    var reader=new FileReader();
    reader.onload=function(e){
      var img=new Image();
      img.onload=function(){
        var MAX=800,w=img.width,h=img.height;
        if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
        var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        res(canvas.toDataURL('image/jpeg',0.7));
      };img.src=e.target.result;
    };reader.readAsDataURL(file);
  });
}

function formatWIB(str){
  if(!str) return '-';
  // Kalau format ISO UTC (mengandung T dan Z)
  if(String(str).includes('T')){
    const d = new Date(str);
    return d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'});
  }
  return String(str);
}

function showOverlay(msg){document.getElementById('overlay-msg').textContent=msg||'Memproses...';document.getElementById('overlay').classList.add('show');}

function hideOverlay(){document.getElementById('overlay').classList.remove('show');}

function showToast(msg,type='info'){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+type;setTimeout(()=>t.classList.remove('show'),3200);}

function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _hesc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function _getFileExt(name){ return (name.split('.').pop()||'').toLowerCase(); }
function _getFileIcon(name){ return _FILE_ICONS[_getFileExt(name)]||'📄'; }
function _formatSize(bytes){
  if(bytes<1024)return bytes+'B';
  if(bytes<1048576)return (bytes/1024).toFixed(1)+'KB';
  return (bytes/1048576).toFixed(1)+'MB';
}