// ═══════════════════════════════════════════════════════════════
//  config.js — Konstanta global & URL endpoint Apps Script
// ═══════════════════════════════════════════════════════════════

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzEN11fV2c_SqBoFhUbs87Nxk8vMGHy7ShphNp3oB_-F4BgHNjXElpvPlmToq1JzYNp/exec';
function getUrl(){ return localStorage.getItem('hn_script_url') || SCRIPT_URL; }
function saveDB(entry){ try{ const db=JSON.parse(localStorage.getItem('hn_db')||'[]'); db.push(entry); localStorage.setItem('hn_db',JSON.stringify(db)); }catch(e){} }
