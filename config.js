// ═══════════════════════════════════════════════════════════════
//  config.js — Konstanta global & URL endpoint Apps Script
// ═══════════════════════════════════════════════════════════════

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzyeTXLNlWGi9PHYa-z8g6LEGQtoR97ZtYR8DCKSeBWStWjCs2tF3pxMBRgEcHOGXXi/exec';
function getUrl(){ return localStorage.getItem('hn_script_url') || SCRIPT_URL; }
function saveDB(entry){ try{ const db=JSON.parse(localStorage.getItem('hn_db')||'[]'); db.push(entry); localStorage.setItem('hn_db',JSON.stringify(db)); }catch(e){} }
