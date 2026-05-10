// ═══════════════════════════════════════════════════════════════
//  export-pdf.js — Generate PDF: OTS, Berkas, KOP, halaman
// ═══════════════════════════════════════════════════════════════

function buildKOP(){
  return `<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:12px;">
    <img src="${LOGO_KOP_B64}" style="height:65px;width:auto;object-fit:contain;">
    <div style="text-align:center;flex:1;padding:0 12px;">
      <div style="font-weight:700;font-size:14px;">CU KELING KUMANG</div>
      <div style="font-size:10px;">Jln. Sekadau - Sintang Km 27, Dusun Tapang Sambas-Tapang Kemayau</div>
      <div style="font-size:10px;">Desa Tapang Semadak, Kecamatan Sekadau Hilir, 79513, Kabupaten Sekadau, Kalimantan Barat</div>
      <div style="font-size:10px;">E-mail: invictus93@cukelingkumang.com | Website: www.cukelingkumang.com | Telp./WA: (+628)115711132</div>
    </div>
    <img src="${LOGO_CUKK_B64}" style="height:65px;width:auto;object-fit:contain;">
  </div>`;
}

function buildFOOTER(){
  return `<div style="margin-top:16px;padding-top:6px;border-top:1px solid #ccc;text-align:left;font-size:9pt;font-style:italic;color:#777;">
    Shared Values: Integrity, Network, Value Creation, Innovation, Credibility, Togetherness, Unity, Speed &nbsp;|&nbsp;
    Visi: Menjadi Credit Union Pilihan Utama Masyarakat di Kalimantan
  </div>`;
}


// ── Global KOP maker (dipakai exportBerkasPDF & exportPengajuanPDF) ───────────
function makeGlobalKOP(){
  return '<table width="100%" style="border-collapse:collapse;margin-bottom:0;"><tr>'
    + '<td width="85" style="border:none;padding:0;vertical-align:middle;">'
    + '<img src="'+LOGO_KOP_B64+'" style="height:68px;width:auto;display:block;">'
    + '</td>'
    + '<td style="border:none;padding:0 8px;vertical-align:middle;text-align:center;">'
    + '<div style="font-weight:700;font-size:12.5pt;font-family:Arial;">CU KELING KUMANG</div>'
    + '<div style="font-size:7.5pt;font-family:Arial;margin-top:2px;">Jln. Sekadau - Sintang Km 27, Dusun Tapang Sambas-Tapang Kemayau</div>'
    + '<div style="font-size:7.5pt;font-family:Arial;">Desa Tapang Semadak, Kecamatan Sekadau Hilir, 79513, Kabupaten Sekadau, Kalimantan Barat</div>'
    + '<div style="font-size:7.5pt;font-family:Arial;">E-mail: invictus93@cukelingkumang.com | Website: www.cukelingkumang.com | Telp./WA: (+628)115711132</div>'
    + '</td>'
    + '<td width="85" style="border:none;padding:0;vertical-align:middle;text-align:right;">'
    + '<img src="'+LOGO_CUKK_B64+'" style="height:68px;width:auto;display:block;margin-left:auto;">'
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
      <td width="85" style="border:none;padding:0;vertical-align:middle;">
        <img src="${LOGO_KOP_B64}" style="height:68px;width:auto;display:block;">
      </td>
      <td style="border:none;padding:0 8px;vertical-align:middle;text-align:center;">
        <div style="font-weight:700;font-size:12.5pt;font-family:Arial;">CU KELING KUMANG</div>
        <div style="font-size:7.5pt;font-family:Arial;margin-top:2px;">Jln. Sekadau - Sintang Km 27, Dusun Tapang Sambas-Tapang Kemayau</div>
        <div style="font-size:7.5pt;font-family:Arial;">Desa Tapang Semadak, Kecamatan Sekadau Hilir, 79513, Kabupaten Sekadau, Kalimantan Barat</div>
        <div style="font-size:7.5pt;font-family:Arial;">E-mail: invictus93@cukelingkumang.com | Website: www.cukelingkumang.com | Telp./WA: (+628)115711132</div>
      </td>
      <td width="85" style="border:none;padding:0;vertical-align:middle;text-align:right;">
        <img src="${LOGO_CUKK_B64}" style="height:68px;width:auto;display:block;margin-left:auto;">
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
  const kegRows = kegiatan.length > 0
    ? kegiatan.map((k,i)=>`<tr>
        <td style="border:1px solid #999;padding:6px 8px;text-align:center;vertical-align:top;">${k.no||i+1}</td>
        <td style="border:1px solid #999;padding:6px 8px;vertical-align:top;">${k.kegiatan||'-'}</td>
        <td style="border:1px solid #999;padding:6px 8px;vertical-align:top;">${k.hasil||'-'}</td>
        <td style="border:1px solid #999;padding:6px 8px;text-align:center;vertical-align:top;">ALL Team</td>
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
    <div style="border:1px solid #999;padding:9px 12px;background:#fffde7;margin-bottom:16px;">
      <b>Catatan :</b>
      <ol style="margin:7px 0 5px 0;padding-left:18px;line-height:1.65;font-size:10.5pt;">
        <li>Setelah menggunakan perangkat, matikan dan tinggalkan dalam kondisi bersih dan rapi untuk mengurangi terjadi resiko kerusakan.</li>
        <li>Pastikan Listrik dalam kondisi stabil saat menyalakan perangkat. Alat yang rusak segera lapor ke ITD <i>Call Center</i> 082255186993.</li>
        <li>Operasikan program sesuai prosedur (Cara <i>login</i> dan <i>log off/exit</i>, penggunaan menu). Lakukan <i>refresh menu</i> setelah banyak melakukan transaksi di SIP dan exit program jika tidak digunakan / tidak bekerja.</li>
        <li>Untuk kendala program / jaringan / perangkat komputer bisa langsung telepon ke PIC Area, Admin IT atau Staf ITD.</li>
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

function exportBerkasPDF(id) {
  var b = (_berkasAll||[]).find(function(x){ return x.id === id; });
  if (!b) { showToast('Data tidak ditemukan','info'); return; }

  // Jika sudah ada pdfUrl → buka langsung di tab baru
  if(b.pdfUrl && b.pdfUrl.length > 5) {
    window.open(b.pdfUrl, '_blank');
    return;
  }

  // Generate halaman info berkas dengan watermark
  var tglStr = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var icon   = typeof _getFileIcon === 'function' ? _getFileIcon(b.namaFile||'') : '📄';

  // Watermark "Arsip resmi IT Departement CU Keling Kumang"
  var wm = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);'
    + 'font-size:28pt;font-weight:900;color:rgba(30,58,95,0.06);white-space:nowrap;'
    + 'text-align:center;pointer-events:none;z-index:0;line-height:2.2;font-family:Arial;">'
    + 'Arsip Resmi<br>IT Departemen<br>CU Keling Kumang'
    + '</div>';

  var body = '';
  body += '<h2 style="text-align:center;font-size:13pt;font-weight:700;text-decoration:underline;margin-bottom:16px;">Dokumen Arsip Digital — IT Departemen</h2>';
  body += '<table width="100%" style="border-collapse:collapse;margin-bottom:16px;">';
  [
    ['Judul / Kategori', _esc(b.title||'-')],
    ['Nama File',        icon+' '+_esc(b.namaFile||'-')],
    ['Tipe File',        _esc((b.tipe||'-').toUpperCase())],
    ['Ukuran File',      (b.sizeKB||0)+' KB'],
    ['Folder',           _esc(b.folder||'-')],
    ['Diupload Oleh',    _esc(b.uploader||'-')],
    ['Waktu Upload',     _esc(b.waktu||'-')],
    ['Dicetak Pada',     tglStr],
  ].forEach(function(r){
    body += '<tr>'
      + '<td style="border:1px solid #999;padding:7px 10px;width:35%;font-weight:700;background:#f9fafb;font-size:10pt;">'+r[0]+'</td>'
      + '<td style="border:1px solid #999;padding:7px 10px;font-size:10pt;">'+r[1]+'</td>'
      + '</tr>';
  });
  body += '</table>';

  if(b.fileUrl && b.fileUrl.length > 5){
    body += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px;margin-bottom:16px;">'
      + '<div style="font-weight:700;font-size:10pt;color:#1e3a5f;margin-bottom:6px;">🔗 Akses File Asli</div>'
      + '<div style="font-size:9pt;color:#1d4ed8;word-break:break-all;">'+_esc(b.fileUrl)+'</div>'
      + '</div>';
  }

  // TTD arsip
  body += '<div style="margin-top:24px;">'
    + '<table width="100%" style="border-collapse:collapse;border:none;">'
    + '<tr>'
    + '<td width="50%" style="border:none;text-align:center;vertical-align:top;">'
    + '<div style="font-size:10pt;">Mengetahui,</div>'
    + '<div style="font-weight:700;font-size:10pt;">Manager IT Departemen</div>'
    + '<div style="height:50px;"></div>'
    + '<div style="border-top:1px solid #000;padding-top:3px;font-weight:700;font-size:10pt;">_______________</div>'
    + '</td>'
    + '<td width="50%" style="border:none;text-align:center;vertical-align:top;">'
    + '<div style="font-size:10pt;">Diarsipkan oleh,</div>'
    + '<div style="font-weight:700;font-size:10pt;">'+_esc(b.uploader||'IT Departemen')+'</div>'
    + '<div style="height:50px;"></div>'
    + '<div style="border-top:1px solid #000;padding-top:3px;font-weight:700;font-size:10pt;">'+_esc(b.uploader||'-')+'</div>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '</div>';

  var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Arsip - '+_esc(b.namaFile||'')+'</title>'
    + '<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}'
    + '@page{size:A4 portrait;margin:0;}'
    + '@media print{.noprint{display:none!important}button{display:none!important}}'
    + '</style></head><body>'
    + wm
    + makeGlobalPage(body, true)
    + '<div class="noprint" style="text-align:center;padding:16px;">'
    + '<button onclick="window.print()" style="padding:10px 28px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">🖨 Print / Simpan PDF</button>'
    + '</div>'
    + '</body></html>';

  var win = window.open('','_blank');
  if(!win){ showToast('Popup diblokir browser. Izinkan popup untuk export PDF.','info'); return; }
  win.document.write(fullHtml);
  win.document.close();
  setTimeout(function(){ win.print(); }, 600);
}
