// ═══════════════════════════════════════════════════════════════
//  config.js — Konstanta global & URL endpoint Apps Script
// ═══════════════════════════════════════════════════════════════

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzpQ4zX6pxfpYcxuPFjxhMdGS_QgH7fPRR3UT_CA1h6ogWfLHWXKLoKbuZRrSTfnzlJ/exec';
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
var LOGO_KOP_B64  = '';
var LOGO_CUKK_B64 = '';
