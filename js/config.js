
Copy

// ═══════════════════════════════════════════════════════════════
//  config.js — Konstanta global & URL endpoint Apps Script
// ═══════════════════════════════════════════════════════════════
 
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfswydRdqrfGD07wKoSI31sTboOwNqHCYIKB3ZUHcHMIORIjb0jl5Fg-S1ebzuoB1X/exec';
function getUrl(){ return localStorage.getItem('hn_script_url') || SCRIPT_URL; }
function saveDB(entry){ try{ const db=JSON.parse(localStorage.getItem('hn_db')||'[]'); db.push(entry); localStorage.setItem('hn_db',JSON.stringify(db)); }catch(e){} }
 
// ═══════════════════════════════════════════════════════════════
//  GLOBAL STATE VARIABLES — dipakai oleh semua modul
// ═══════════════════════════════════════════════════════════════
 
var logData       = [];
var editingLogId  = null;
var currentLogTab = 'maintenance';
var pjnItems      = [];
var currentMenu   = 'home';
var editingOtsId  = null;
 
// ── HW Sub-kategori ──────────────────────────────────────────
var HW_SUBS = {
  'PC / Laptop': [
    'Tidak bisa menyala','Layar rusak / blank','Keyboard rusak',
    'Baterai tidak mengisi','Harddisk bermasalah','RAM bermasalah',
    'OS error / blue screen','Virus / malware','Upgrade hardware',
    'Reinstall OS','Lainnya'
  ],
  'Printer': [
    'Tidak bisa print','Paper jam','Hasil print buram',
    'Cartridge / tinta habis','Head printer kotor',
    'Koneksi printer bermasalah','Driver bermasalah','Lainnya'
  ],
  'Monitor': [
    'Layar blank / tidak ada gambar','Layar berkedip',
    'Dead pixel','Warna tidak normal','Koneksi VGA/HDMI bermasalah','Lainnya'
  ],
  'CCTV': [
    'Kamera tidak merekam','Gambar buram / gelap',
    'DVR/NVR bermasalah','Kabel putus','Akses remote tidak bisa','Lainnya'
  ],
  'UPS / Power': [
    'UPS tidak berfungsi','Baterai UPS lemah',
    'Stabilizer bermasalah','Listrik tidak stabil','Lainnya'
  ],
  'Infokus': [
    'Tidak bisa menyala','Gambar buram','Lampu redup',
    'Koneksi HDMI bermasalah','Remote tidak berfungsi','Lainnya'
  ],
  'Mesin Hitung Uang': [
    'Tidak bisa menghitung','Error count','Mesin macet','Lainnya'
  ],
  'Mesin Absen Sidik Jari': [
    'Tidak bisa scan','Data tidak tersimpan','Jam tidak akurat',
    'Koneksi ke sistem bermasalah','Lainnya'
  ],
  'Mesin Antrian': [
    'Tidak bisa mencetak nomor','Display tidak tampil',
    'Tombol tidak berfungsi','Lainnya'
  ]
};
 
// ── NET Sub-kategori ─────────────────────────────────────────
var NET_SUBS = {
  'MikroTik / Router': [
    'Konfigurasi ulang','Upgrade firmware','Ganti perangkat',
    'Setting DHCP','Setting firewall','Setting NAT','Lainnya'
  ],
  'Koneksi Internet / ISP': [
    'Internet mati total','Kecepatan lambat','Intermittent / putus-putus',
    'Koordinasi dengan ISP','Lainnya'
  ],
  'WiFi / Access Point': [
    'AP tidak bisa connect','Sinyal lemah','Ganti AP',
    'Konfigurasi SSID','Lainnya'
  ],
  'VPN': [
    'VPN tidak bisa connect','VPN lambat','Konfigurasi ulang VPN',
    'Sertifikat expired','Lainnya'
  ],
  'Fiber Optik / Kabel LAN': [
    'Kabel putus','Konektor lepas','Terminasi ulang',
    'Ganti kabel','Lainnya'
  ],
  'Starlink': [
    'Dish tidak terhubung','Sinyal lemah','Obstruksi','Ganti perangkat','Lainnya'
  ],
  'POE / Starlink POE': [
    'POE tidak power','Ganti POE','Konfigurasi ulang','Lainnya'
  ],
  'Switch / Hub': [
    'Port tidak berfungsi','Ganti switch','Konfigurasi VLAN','Lainnya'
  ],
  'LAN Card': [
    'LAN card tidak terdeteksi','Driver error','Ganti LAN card','Lainnya'
  ],
  'Modem 4G': [
    'Modem tidak connect','Sinyal lemah','Ganti SIM card','Ganti modem','Lainnya'
  ]
};
 
// ── Logo base64 placeholder (isi dengan base64 logo asli) ────
var LOGO_KOP_B64  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAxMjAgNjAiPgogIDxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIGZpbGw9IiMxZTNhNWYiIHJ4PSI2Ii8+CiAgPHRleHQgeD0iNjAiIHk9IjIyIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTEiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q1UgS0VMSU5HPC90ZXh0PgogIDx0ZXh0IHg9IjYwIiB5PSIzNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjExIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPktVTUFORzwvdGV4dD4KICA8dGV4dCB4PSI2MCIgeT0iNTIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjOTNjNWZkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5LQUxJTUFOVEFOIEJBUkFUPC90ZXh0Pgo8L3N2Zz4='; // Ganti dengan base64 logo asli CUKK
var LOGO_CUKK_B64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAxMjAgNjAiPgogIDxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIGZpbGw9IiMxZTNhNWYiIHJ4PSI2Ii8+CiAgPHRleHQgeD0iNjAiIHk9IjIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOSIgZmlsbD0iIzkzYzVmZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SVQgREVQQVJURU1FTjwvdGV4dD4KICA8dGV4dCB4PSI2MCIgeT0iMzYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IJmFtcDtOPC90ZXh0PgogIDx0ZXh0IHg9IjYwIiB5PSI1MiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM5M2M1ZmQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNVS0s8L3RleHQ+Cjwvc3ZnPg=='; // Ganti dengan base64 logo asli H&N
