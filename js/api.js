// ═══════════════════════════════════════════════════════════════
//  api.js — fetchGAS: wrapper komunikasi ke Google Apps Script
// ═══════════════════════════════════════════════════════════════

async function fetchGAS(params) {
  const url = getUrl();
  const qs = Object.entries(params)
    .map(([k,v]) => k + '=' + encodeURIComponent(String(v))).join('&');
  const fullUrl = url + '?' + qs;

  // Coba fetch biasa dulu
  try {
    const res = await fetch(fullUrl);
    const text = await res.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch(e1) {}

  // Fallback JSONP
  return new Promise((resolve, reject) => {
    const cbName = 'gasCallback_' + Date.now();
    const script = document.createElement('script');
    window[cbName] = (data) => {
      delete window[cbName];
      try { document.head.removeChild(script); } catch(e){}
      resolve(data);
    };
    script.onerror = () => {
      delete window[cbName];
      try { document.head.removeChild(script); } catch(e){}
      reject(new Error('Gagal fetch'));
    };
    script.src = fullUrl + '&callback=' + cbName;
    document.head.appendChild(script);
    setTimeout(() => {
      if (window[cbName]) {
        delete window[cbName];
        try { document.head.removeChild(script); } catch(e){}
        reject(new Error('Timeout'));
      }
    }, 15000);
  });
}