// ═══════════════════════════════════════════════════════════════
//  export-pdf.js — Generate PDF: OTS, Berkas, KOP, halaman
// ═══════════════════════════════════════════════════════════════

function buildKOP(){
  return `<table width="100%" style="border-collapse:collapse;margin-bottom:0;"><tr>
    <td width="80" style="border:none;padding:0;vertical-align:middle;">
      <img src="${LOGO_KOP_B64}" style="height:68px;width:auto;display:block;">
    </td>
    <td style="border:none;padding:0 10px;vertical-align:middle;text-align:center;">
      <div style="font-weight:700;font-size:13pt;font-family:Arial;">CU KELING KUMANG</div>
      <div style="font-size:7pt;font-family:Arial;margin-top:3px;">Jln. Sekadau - Sintang Km 27, Dusun Tapang Sambas - Tapang Kemayau, Desa Tapang Semadak</div>
      <div style="font-size:7pt;font-family:Arial;">Kecamatan Sekadau Hilir, Kabupaten Sekadau, Kalimantan Barat 79513</div>
      <div style="font-size:7pt;font-family:Arial;">E-mail: invictus93@cukelingkumang.com | Website: www.cukelingkumang.com | Telp./WA: (+628)115711132</div>
    </td>
    <td width="145" style="border:none;padding:0;vertical-align:middle;text-align:right;">
      <img src="${LOGO_CUKK_B64}" style="height:42px;width:auto;display:block;margin-left:auto;">
    </td>
  </tr></table>
  <div style="border-top:3px double #000;margin:6px 0 10px;"></div>`;
}

function buildFOOTER(){
  return `<div style="margin-top:16px;padding-top:6px;border-top:1px solid #ccc;text-align:left;font-size:9pt;font-style:italic;color:#777;">
    Shared Values: Integrity, Network, Value Creation, Innovation, Credibility, Togetherness, Unity, Speed &nbsp;|&nbsp;
    Visi: Menjadi Credit Union Pilihan Utama Masyarakat di Kalimantan
  </div>`;
}


// ── Global KOP maker ─────────────────────────────────────────────
function makeGlobalKOP(){
  return '<table width="100%" style="border-collapse:collapse;margin-bottom:0;"><tr>'
    // Logo Koperasi - kiri, height 68px
    + '<td width="80" style="border:none;padding:0;vertical-align:middle;">'
    + '<img src="'+LOGO_KOP_B64+'" style="height:68px;width:auto;display:block;">'
    + '</td>'
    // Teks tengah - 4 baris, center
    + '<td style="border:none;padding:0 10px;vertical-align:middle;text-align:center;">'
    + '<div style="font-weight:700;font-size:13pt;font-family:Arial;letter-spacing:0.5px;">CU KELING KUMANG</div>'
    + '<div style="font-size:7pt;font-family:Arial;margin-top:3px;color:#222;">Jln. Sekadau - Sintang Km 27, Dusun Tapang Sambas - Tapang Kemayau, Desa Tapang Semadak</div>'
    + '<div style="font-size:7pt;font-family:Arial;color:#222;">Kecamatan Sekadau Hilir, Kabupaten Sekadau, Kalimantan Barat 79513</div>'
    + '<div style="font-size:7pt;font-family:Arial;color:#222;">E-mail: invictus93@cukelingkumang.com | Website: www.cukelingkumang.com | Telp./WA: (+628)115711132</div>'
    + '</td>'
    // Logo CUKK - kanan, height 42px agar sejajar dengan 4 baris teks
    + '<td width="145" style="border:none;padding:0;vertical-align:middle;text-align:right;">'
    + '<img src="'+LOGO_CUKK_B64+'" style="height:42px;width:auto;display:block;margin-left:auto;">'
    + '</td>'
    + '</tr></table>'
    + '<div style="border-top:3px double #000;margin:6px 0 10px;"></div>';
}

function makeGlobalFooter(){
  return '<div style="border-top:1px solid #bbb;margin-top:auto;padding-top:5px;font-size:8pt;font-style:italic;color:#555;font-family:Arial;">'
    + 'Shared Values: Integrity, Network, Value Creation, Innovation, Credibility, Togetherness, Unity, Speed &nbsp;|&nbsp;'
    + 'Visi: Menjadi Credit Union Pilihan Utama Masyarakat di Kalimantan'
    + '</div>';
}

function makeGlobalPage(content, isLast){
  return '<div style="width:210mm;min-height:297mm;padding:13mm 14mm 10mm 14mm;box-sizing:border-box;display:flex;flex-direction:column;font-family:Arial;font-size:11pt;color:#000;'+(isLast?'':'page-break-after:always;')+'">'
    + makeGlobalKOP()
    + '<div style="flex:1;">'+content+'</div>'
    + makeGlobalFooter()
    + '</div>';
}


function buildPage(KOP,titleHtml,bodyHtml,ttdHtml,withFooter=false){
  const FOOTER=withFooter?buildFOOTER():'';
  return `<div style="width:210mm;min-height:297mm;padding:12mm 14mm 10mm 14mm;display:flex;flex-direction:column;page-break-after:always;box-sizing:border-box;">
    ${KOP}${titleHtml}${bodyHtml}<div style="flex:1;"></div>${ttdHtml}${FOOTER}
  </div>`;
}

function reexportOTSPDF(id){
  showToast('Memuat data untuk PDF...','info');
  fetchGAS({action:'getOTSDetail',id,pin:currentPin})
    .then(json=>{
      const r=(json.status==='ok'&&json.data)?json.data:(otsRecords.find(x=>x.id===id)||{});
      const idx=otsRecords.findIndex(x=>x.id===id);
      if(idx>=0)otsRecords[idx]={...otsRecords[idx],...r};
      _exportFromRecord(r);
    })
    .catch(()=>{
      const r=otsRecords.find(x=>x.id===id);
      if(r)_exportFromRecord(r);
      else showToast('Data tidak ditemukan','info');
    });
}

function _exportFromRecord(r){
  const bo           = r.bo||'';
  const tgl          = r.tgl||'';
  const namaBo       = r.namaBo||'';
  const jabatanBo    = r.jabatanBo||'';
  const petugasSerah = r.petugasSerah||'';
  const kegiatan     = r.kegiatan||[];
  const adaSerah     = r.adaSerah===true||r.adaSerah==='Ya';
  const serahKe      = r.serahKe||[];
  const bawaPulang   = r.bawaPulang||[];
  const fotos        = r.fotos||[];
  const timIT        = Array.isArray(r.timIT)?r.timIT:String(r.timIT||'').split(',').map(x=>x.trim()).filter(x=>x);
  const tglStr       = tgl ? new Date(tgl).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '-';

  // KOP — pakai variable JS yang sudah ada
  function makeKOP(){
    return `<table width="100%" style="border-collapse:collapse;margin-bottom:0;"><tr>
      <td width="80" style="border:none;padding:0;vertical-align:middle;">
        <img src="${LOGO_KOP_B64}" style="height:68px;width:auto;display:block;">
      </td>
      <td style="border:none;padding:0 10px;vertical-align:middle;text-align:center;">
        <div style="font-weight:700;font-size:13pt;font-family:Arial;">CU KELING KUMANG</div>
        <div style="font-size:7pt;font-family:Arial;margin-top:3px;">Jln. Sekadau - Sintang Km 27, Dusun Tapang Sambas - Tapang Kemayau, Desa Tapang Semadak</div>
        <div style="font-size:7pt;font-family:Arial;">Kecamatan Sekadau Hilir, Kabupaten Sekadau, Kalimantan Barat 79513</div>
        <div style="font-size:7pt;font-family:Arial;">E-mail: invictus93@cukelingkumang.com | Website: www.cukelingkumang.com | Telp./WA: (+628)115711132</div>
      </td>
      <td width="145" style="border:none;padding:0;vertical-align:middle;text-align:right;">
        <img src="${LOGO_CUKK_B64}" style="height:42px;width:auto;display:block;margin-left:auto;">
      </td>
    </tr></table>
    <div style="border-top:3px double #000;margin:6px 0 10px;"></div>`;
  }

  // FOOTER — Shared Values di setiap halaman
  const FOOTER = `<div style="border-top:1px solid #bbb;margin-top:auto;padding-top:5px;font-size:8pt;font-style:italic;color:#555;font-family:Arial;">
    Shared Values: Integrity, Network, Value Creation, Innovation, Credibility, Togetherness, Unity, Speed &nbsp;|&nbsp;
    Visi: Menjadi Credit Union Pilihan Utama Masyarakat di Kalimantan
  </div>`;

  // WRAPPER per halaman — flex column agar footer selalu di bawah
  function makePage(content, isLast){
    return `<div style="width:210mm;min-height:297mm;padding:13mm 14mm 10mm 14mm;box-sizing:border-box;display:flex;flex-direction:column;font-family:Arial;font-size:11pt;color:#000;${isLast?'':'page-break-after:always;'}">
      ${makeKOP()}
      <div style="flex:1;">${content}</div>
      ${FOOTER}
    </div>`;
  }

  // ── HAL 1: JURNAL KEGIATAN ────────────────────────────────
  // Auto-fit: sesuaikan padding & font-size berdasarkan jumlah kegiatan
  var kegCount = kegiatan.length || 0;
  var kegPad   = kegCount > 15 ? '3px 6px' : kegCount > 10 ? '4px 7px' : '6px 8px';
  var kegFont  = kegCount > 15 ? '9pt' : kegCount > 10 ? '10pt' : '11pt';
  var tdS = 'border:1px solid #999;padding:'+kegPad+';font-size:'+kegFont+';';
  var kegRows = kegiatan.length > 0
    ? kegiatan.map((k,i)=>`<tr>
        <td style="${tdS}text-align:center;vertical-align:top;width:28px;">${k.no||i+1}</td>
        <td style="${tdS}vertical-align:top;width:35%;">${k.kegiatan||'-'}</td>
        <td style="${tdS}vertical-align:top;">${k.hasil||'-'}</td>
        <td style="${tdS}text-align:center;vertical-align:top;width:70px;">ALL Team</td>
      </tr>`).join('')
    : `<tr><td colspan="4" style="border:1px solid #999;padding:14px;text-align:center;color:#999;">—</td></tr>`;

  const ttdIT = timIT.map((n,i)=>`<tr>
    <td style="border:none;padding:3px 0;width:22px;font-size:11pt;vertical-align:bottom;"><b>${i+1}.</b></td>
    <td style="border:none;padding:3px 0;font-size:11pt;white-space:nowrap;vertical-align:bottom;">${n}</td>
    <td style="border:none;padding:3px 5px;font-size:11pt;vertical-align:bottom;">:</td>
    <td style="border:none;padding:0;vertical-align:bottom;min-width:110px;">
      <div style="border-bottom:1px solid #000;min-width:110px;margin-bottom:2px;">&nbsp;</div>
    </td>
  </tr>`).join('') || `<tr><td colspan="4" style="border:none;height:60px;"></td></tr>`;

  const hal1Content = `
    <div style="font-weight:700;font-size:14pt;text-align:center;margin-bottom:12px;border-bottom:1.5px solid #000;padding-bottom:5px;">JURNAL KEGIATAN OTS IT DEPARTEMEN</div>
    <table style="border:none;margin-bottom:12px;">
      <tr><td style="border:none;padding:2px 0;width:110px;">Nama BO</td><td style="border:none;padding:2px 0;">: <b>${bo.toUpperCase()}</b></td></tr>
      <tr><td style="border:none;padding:2px 0;">Tanggal</td><td style="border:none;padding:2px 0;">: <b>${tglStr}</b></td></tr>
      <tr><td style="border:none;padding:2px 0;">Petugas BO</td><td style="border:none;padding:2px 0;">: <b>${namaBo}</b></td></tr>
    </table>
    <table width="100%" style="border-collapse:collapse;margin-bottom:12px;">
      <thead><tr style="background:#dce6f7;">
        <th style="border:1px solid #999;padding:7px 8px;width:34px;">No</th>
        <th style="border:1px solid #999;padding:7px 8px;width:120px;">Kegiatan</th>
        <th style="border:1px solid #999;padding:7px 8px;">Hasil Kegiatan</th>
        <th style="border:1px solid #999;padding:7px 8px;width:75px;">Petugas</th>
      </tr></thead>
      <tbody>${kegRows}</tbody>
    </table>
    <div style="border:1px solid #999;padding:${kegCount>12?'5px 10px':'9px 12px'};background:#fffde7;margin-bottom:${kegCount>12?'8px':'16px'};">
      <b>Catatan :</b>
      <ol style="margin:4px 0 3px 0;padding-left:18px;line-height:1.5;font-size:${kegCount>12?'8.5pt':'10pt'};">
        <li>Setelah menggunakan perangkat, matikan dan tinggalkan dalam kondisi bersih dan rapi.</li>
        <li>Pastikan Listrik dalam kondisi stabil saat menyalakan perangkat. Lapor ke ITD <i>Call Center</i> 082255186993.</li>
        <li>Operasikan program sesuai prosedur. Lakukan <i>refresh menu</i> setelah banyak transaksi di SIP.</li>
        <li>Kendala program / jaringan / perangkat: hubungi PIC Area, Admin IT atau Staf ITD.</li>
      </ol>
      <b>*** Harap dibaca !!!</b>
    </div>
    <div style="text-align:right;font-weight:700;margin-bottom:10px;">${tglStr}</div>
    <table width="100%" style="border-collapse:collapse;border:none;">
      <tr>
        <td width="48%" style="border:none;vertical-align:top;">
          <div>Petugas</div><div style="font-weight:700;">Departement IT,</div>
          <table style="border:none;margin-top:8px;">${ttdIT}</table>
        </td>
        <td width="4%" style="border:none;"></td>
        <td width="48%" style="border:none;vertical-align:top;text-align:center;">
          <div>Petugas BO</div>
          <div style="font-style:italic;font-weight:700;">${jabatanBo}</div>
          <div style="height:55px;"></div>
          <div style="border-top:1px solid #000;padding-top:3px;font-weight:700;">${namaBo}</div>
        </td>
      </tr>
    </table>`;

  // ── HAL 2: FOTO KEGIATAN ──────────────────────────────────
  let hal2Content = '';
  if(fotos.length > 0){
    const cols = fotos.length<=2?fotos.length:fotos.length<=4?2:3;
    const imgH = fotos.length<=2?'230px':fotos.length<=4?'195px':'165px';
    hal2Content = `<div style="font-weight:700;font-size:14pt;text-align:center;margin-bottom:16px;">Foto Kegiatan</div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;">
        ${fotos.map(src=>`<img src="${src}" style="width:100%;height:${imgH};object-fit:cover;border:1px solid #ccc;">`).join('')}
      </div>`;
  }

  // ── HAL 3: BERITA ACARA ───────────────────────────────────
  let hal3Content = '';
  if(adaSerah){
    const th = `style="border:1px solid #999;padding:6px 8px;background:#dce6f7;font-weight:700;text-align:center;"`;
    const mkRow = arr => arr.length>0
      ? arr.map((s,i)=>`<tr>
          <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${s.no||i+1}</td>
          <td style="border:1px solid #999;padding:6px 8px;">${s.nama||'—'}</td>
          <td style="border:1px solid #999;padding:6px 8px;">${s.merk||'—'}</td>
          <td style="border:1px solid #999;padding:6px 8px;">${s.code||'—'}</td>
          <td style="border:1px solid #999;padding:6px 8px;">${s.ket||'—'}</td>
        </tr>`).join('')
      : `<tr><td colspan="5" style="border:1px solid #999;padding:12px;text-align:center;">—</td></tr>`;

    hal3Content = `
      <div style="font-weight:700;font-size:14pt;text-align:center;border-bottom:2px solid #1a1a2e;padding-bottom:5px;margin-bottom:12px;">BERITA ACARA SERAH TERIMA BARANG</div>
      <p style="margin-bottom:12px;">Pada hari ini <b>${tglStr}</b>, telah dilakukan serah terima barang antara Team IT dan Branch Office <b>${bo.toUpperCase()}</b>:</p>
      <div style="font-weight:700;margin-bottom:6px;">Yang diserahkan ke TP/TPK:</div>
      <table width="100%" style="border-collapse:collapse;margin-bottom:14px;font-size:10.5pt;">
        <thead><tr>
          <th ${th} width="35">No.</th><th ${th}>Nama Barang</th>
          <th ${th} width="110">Merk</th><th ${th} width="75">CODE</th><th ${th}>Keterangan</th>
        </tr></thead>
        <tbody>${mkRow(serahKe)}</tbody>
      </table>
      <div style="font-weight:700;margin-bottom:6px;">Yang dibawa pulang oleh Tim IT:</div>
      <table width="100%" style="border-collapse:collapse;margin-bottom:16px;font-size:10.5pt;">
        <thead><tr>
          <th ${th} width="35">No.</th><th ${th}>Nama Barang</th>
          <th ${th} width="110">Merk</th><th ${th} width="75">CODE</th><th ${th}>Keterangan</th>
        </tr></thead>
        <tbody>${mkRow(bawaPulang)}</tbody>
      </table>
      <p style="margin-bottom:20px;">Demikianlah berita acara ini dibuat untuk dapat digunakan sebagaimana mestinya<b>.</b></p>
      <div style="height:30px;"></div>
      <div style="text-align:right;font-weight:700;margin-bottom:12px;">${tglStr}</div>
      <table width="100%" style="border-collapse:collapse;border:none;">
        <tr>
          <td width="45%" style="border:none;vertical-align:top;">
            <div>Petugas</div><div style="font-weight:700;">Departement IT</div>
          </td>
          <td width="10%" style="border:none;"></td>
          <td width="45%" style="border:none;vertical-align:top;text-align:center;">
            <div>Petugas BO</div><div style="font-style:italic;font-weight:700;">${jabatanBo}</div>
          </td>
        </tr>
        <tr>
          <td style="border:none;padding-top:50px;vertical-align:bottom;">
            <div style="border-top:1px solid #000;padding-top:4px;font-weight:700;">${petugasSerah}</div>
          </td>
          <td style="border:none;"></td>
          <td style="border:none;padding-top:50px;vertical-align:bottom;text-align:center;">
            <div style="border-top:1px solid #000;padding-top:4px;font-weight:700;">${namaBo}</div>
          </td>
        </tr>
      </table>`;
  }

  // Tentukan halaman terakhir
  const pages = [hal1Content];
  if(hal2Content) pages.push(hal2Content);
  if(hal3Content) pages.push(hal3Content);

  const pagesHTML = pages.map((p,i)=>makePage(p, i===pages.length-1)).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OTS-${bo}-${tgl}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#fff;}
    @page{size:A4 portrait;margin:0;}
    @media print{
      body{margin:0;}
      button{display:none!important;}
    }
    ol li{margin-bottom:4px;}
  </style>
</head>
<body>
${pagesHTML}
</body>
</html>`;

  const w = window.open('','_blank','width=850,height=1100');
  if(!w||w.closed||typeof w.closed==='undefined'){
    const blob=new Blob([html],{type:'text/html'});
    window.open(URL.createObjectURL(blob),'_blank');
    return;
  }
  w.document.write(html);
  w.document.close();
  // Langsung print
  setTimeout(()=>w.print(),800);
}

function exportOtsPDF(){
  const bo=document.getElementById('ots-bo').value.trim();
  const tgl=document.getElementById('ots-tgl').value;
  const namaBo=document.getElementById('ots-bm').value.trim();
  const jabatanBo=document.getElementById('ots-jabatan-bo')?.value||'Branch Manager';
  const petugasSerah=document.getElementById('ots-petugas')?.value||'';
  const timIT=getTimIT();
  if(!bo||!tgl){showToast('Lengkapi Nama BO dan Tanggal dulu','info');return;}
  const kegiatan=getKegiatanData();
  const adaSerah=document.getElementById('ots-serah-toggle').checked;
  const serahKe=adaSerah?getSerahData('serah-ke-body'):[];
  const bawaPulang=adaSerah?getSerahData('bawa-body'):[];
  _exportFromRecord({bo,tgl,namaBo,jabatanBo,petugasSerah,timIT,kegiatan,adaSerah,serahKe,bawaPulang,fotos:otsFotos});
}

async function exportBerkasPDF(id) {
  var b = (_berkasAll||[]).find(function(x){ return x.id === id; });
  if (!b) { showToast('Data tidak ditemukan','info'); return; }

  var fileId = '';
  var url    = b.fileUrl || '';
  var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) m = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (m) fileId = m[1];

  // Jika ada fileId → convert via GAS → download PDF asli (WYSIWYG)
  if (fileId) {
    showOverlay('Mengonversi ' + (b.namaFile||'file') + ' ke PDF...');
    try {
      var json = await fetchGAS({action:'convertBerkasToPdf', pin:currentPin, fileId:fileId});
      hideOverlay();
      if (json.status === 'ok' && json.base64) {
        var byteChars = atob(json.base64);
        var byteArr   = new Uint8Array(byteChars.length);
        for (var i=0;i<byteChars.length;i++) byteArr[i]=byteChars.charCodeAt(i);
        var blob = new Blob([byteArr],{type:'application/pdf'});
        var burl = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href   = burl;
        a.download = (b.namaFile||'file').replace(/\.[^.]+$/,'') + '.pdf';
        document.body.appendChild(a); a.click();
        setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(burl); }, 1000);
        showToast('PDF berhasil diunduh!','ok');
        return;
      }
    } catch(e){ hideOverlay(); }
    // Jika GAS gagal → fallback ke halaman info
  }

  // Fallback: 2-halaman info dokumen dengan watermark
  var tglStr   = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var icon     = typeof _getFileIcon === 'function' ? _getFileIcon(b.namaFile||'') : '📄';
  var tglUpload= b.waktu ? new Date(b.waktu).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : (b.waktu||'-');

  // Watermark
  var wm = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);'
    + 'font-size:22pt;font-weight:900;color:rgba(30,58,95,0.055);white-space:nowrap;'
    + 'text-align:center;pointer-events:none;z-index:0;line-height:2.2;font-family:Arial;">'
    + 'Arsip Resmi<br>IT Departemen<br>CU Keling Kumang'
    + '</div>';

  // ── Halaman 1: Sertifikat Arsip ──────────────────────────
  var body1 = '';
  body1 += '<div style="text-align:center;margin-bottom:20px;">'
    + '<div style="display:inline-block;background:#1e3a5f;color:#fff;padding:6px 24px;border-radius:99px;font-size:9pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Sertifikat Arsip Digital</div>'
    + '</div>';
  body1 += '<h2 style="text-align:center;font-size:14pt;font-weight:700;margin-bottom:4px;color:#1e3a5f;">'
    + _esc(b.title||'Dokumen') + '</h2>';
  body1 += '<div style="text-align:center;font-size:10pt;color:#666;margin-bottom:20px;">'
    + 'IT Departemen &mdash; CU Keling Kumang</div>';

  // Info table
  body1 += '<table width="100%" style="border-collapse:collapse;margin-bottom:20px;font-size:10pt;">';
  [
    ['No. Dokumen',    b.id||'-'],
    ['Judul / Kategori', _esc(b.title||'-')],
    ['Nama File',      icon + ' ' + _esc(b.namaFile||'-')],
    ['Tipe File',      _esc((b.tipe||'-').toUpperCase().replace(/VND\.OPENXMLFORMATS-OFFICEDOCUMENT\.|APPLICATION\//g,'').replace('WORDPROCESSINGML.DOCUMENT','WORD / DOCX').replace('SPREADSHEETML.SHEET','EXCEL / XLSX').replace('PRESENTATIONML.PRESENTATION','POWERPOINT / PPTX'))],
    ['Ukuran File',    (b.sizeKB||0) + ' KB'],
    ['Folder',         _esc(b.folder||'-')],
    ['Diupload Oleh',  _esc(b.uploader||'-')],
    ['Waktu Upload',   tglUpload],
    ['Dicetak Pada',   tglStr],
  ].forEach(function(r){
    body1 += '<tr>'
      + '<td style="border:1px solid #ddd;padding:8px 12px;width:38%;font-weight:700;background:#f8fafc;font-size:10pt;">' + r[0] + '</td>'
      + '<td style="border:1px solid #ddd;padding:8px 12px;font-size:10pt;">' + r[1] + '</td>'
      + '</tr>';
  });
  body1 += '</table>';

  // Akses file
  if(b.fileUrl && b.fileUrl.length > 5){
    body1 += '<div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:20px;">'
      + '<div style="font-weight:700;font-size:10pt;color:#1e3a5f;margin-bottom:5px;">🔗 Akses File Asli di Google Drive</div>'
      + '<div style="font-size:8.5pt;color:#1d4ed8;word-break:break-all;">' + _esc(b.fileUrl) + '</div>'
      + '</div>';
  }
  if(b.pdfUrl && b.pdfUrl.length > 5){
    body1 += '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:20px;">'
      + '<div style="font-weight:700;font-size:10pt;color:#065f46;margin-bottom:5px;">📄 Versi PDF di Google Drive</div>'
      + '<div style="font-size:8.5pt;color:#16a34a;word-break:break-all;">' + _esc(b.pdfUrl) + '</div>'
      + '</div>';
  }

  // TTD
  body1 += '<div style="margin-top:auto;">'
    + '<table width="100%" style="border-collapse:collapse;border:none;margin-top:24px;">'
    + '<tr>'
    + '<td width="50%" style="border:none;text-align:center;vertical-align:top;">'
    + '<div style="font-size:10pt;">Mengetahui,</div>'
    + '<div style="font-weight:700;font-size:10pt;">Manager IT Departemen</div>'
    + '<div style="height:50px;"></div>'
    + '<div style="border-top:1px solid #000;padding-top:3px;font-weight:700;font-size:10pt;">_______________</div>'
    + '</td>'
    + '<td width="50%" style="border:none;text-align:center;vertical-align:top;">'
    + '<div style="font-size:10pt;">Diarsipkan oleh,</div>'
    + '<div style="font-weight:700;font-size:10pt;">' + _esc(b.uploader||'IT Departemen') + '</div>'
    + '<div style="height:50px;"></div>'
    + '<div style="border-top:1px solid #000;padding-top:3px;font-weight:700;font-size:10pt;">' + _esc(b.uploader||'-') + '</div>'
    + '</td>'
    + '</tr></table></div>';

  // ── Halaman 2: Riwayat & Keterangan Tambahan ─────────────
  var body2 = '';
  body2 += '<h3 style="font-size:13pt;font-weight:700;margin-bottom:16px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;">Keterangan Pengarsipan</h3>';
  body2 += '<table width="100%" style="border-collapse:collapse;margin-bottom:20px;font-size:10pt;">';
  body2 += '<tr><td style="border:1px solid #ddd;padding:10px 12px;width:38%;font-weight:700;background:#f8fafc;">Sistem Arsip</td>'
    + '<td style="border:1px solid #ddd;padding:10px 12px;">IT Departemen Digital Archive — CU Keling Kumang</td></tr>';
  body2 += '<tr><td style="border:1px solid #ddd;padding:10px 12px;font-weight:700;background:#f8fafc;">Kategori Dokumen</td>'
    + '<td style="border:1px solid #ddd;padding:10px 12px;">' + _esc(b.title||'-') + '</td></tr>';
  body2 += '<tr><td style="border:1px solid #ddd;padding:10px 12px;font-weight:700;background:#f8fafc;">Diarsipkan Tanggal</td>'
    + '<td style="border:1px solid #ddd;padding:10px 12px;">' + tglUpload + '</td></tr>';
  body2 += '<tr><td style="border:1px solid #ddd;padding:10px 12px;font-weight:700;background:#f8fafc;">Nama File Asli</td>'
    + '<td style="border:1px solid #ddd;padding:10px 12px;">' + icon + ' ' + _esc(b.namaFile||'-') + '</td></tr>';
  body2 += '<tr><td style="border:1px solid #ddd;padding:10px 12px;font-weight:700;background:#f8fafc;">Ukuran File</td>'
    + '<td style="border:1px solid #ddd;padding:10px 12px;">' + (b.sizeKB||0) + ' KB</td></tr>';
  body2 += '</table>';

  body2 += '<div style="background:#fef9c3;border:1.5px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:10pt;">'
    + '<div style="font-weight:700;color:#92400e;margin-bottom:8px;">📌 Catatan Penting</div>'
    + '<ul style="margin:0;padding-left:18px;line-height:2;color:#78350f;">'
    + '<li>Dokumen ini merupakan sertifikat pengarsipan digital.</li>'
    + '<li>File asli tersimpan di Google Drive IT Departemen CUKK.</li>'
    + '<li>Untuk melihat isi dokumen, gunakan link pada halaman 1.</li>'
    + '<li>Jika link tidak dapat diakses, hubungi IT Departemen.</li>'
    + '</ul></div>';

  body2 += '<div style="text-align:center;margin-top:20px;padding:16px;background:#1e3a5f;border-radius:10px;color:#fff;">'
    + '<div style="font-size:9pt;opacity:0.8;letter-spacing:1px;text-transform:uppercase;">Dokumen Resmi</div>'
    + '<div style="font-size:13pt;font-weight:800;margin:4px 0;">IT Departemen CUKK</div>'
    + '<div style="font-size:8pt;opacity:0.7;">CU Keling Kumang &mdash; Kalimantan Barat</div>'
    + '</div>';

  var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<title>Arsip — ' + _esc(b.namaFile||'Dokumen') + '</title>'
    + '<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;font-family:Arial,sans-serif;}'
    + '@page{size:A4 portrait;margin:0;}'
    + '@media print{.noprint{display:none!important}}'
    + '</style></head><body>'
    + wm
    + makeGlobalPage(body1, false)
    + makeGlobalPage(body2, true)
    + '<div class="noprint" style="text-align:center;padding:16px;">'
    + '<button onclick="window.print()" style="padding:10px 28px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">🖨 Print / Simpan PDF (2 Halaman)</button>'
    + '</div>'
    + '</body></html>';

  var win = window.open('','_blank');
  if(!win){ showToast('Popup diblokir browser. Izinkan popup.','info'); return; }
  win.document.write(fullHtml);
  win.document.close();
  setTimeout(function(){ win.print(); }, 600);
}
