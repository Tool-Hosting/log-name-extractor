// app.js — no auto-clear on background/tab switch

// Proactively unregister any service workers on this origin
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister().catch(() => { })))
    .catch(() => { });
}

// Elements
const input = document.getElementById('in');
const out = document.getElementById('out');
const count = document.getElementById('count');
const extractBtn = document.getElementById('extract');
const copyBtn = document.getElementById('copy');
const clearBtn = document.getElementById('clear');
const cbUnique = document.getElementById('unique');
const cbSort = document.getElementById('sort');

// Never use storage; try to purge anything someone might add later
try { if (window.localStorage) localStorage.clear(); } catch { }
try { if (window.sessionStorage) sessionStorage.clear(); } catch { }

// Updated regex to match names with embedded apostrophes inside quotes
const rx = /name='(.*?)'(?=\s+\w+=)/gu;

function wipe() {
  input.value = '';
  out.textContent = '';
  count.textContent = '';
  const sel = window.getSelection?.();
  if (sel && sel.removeAllRanges) sel.removeAllRanges();
}

function extract() {
  const text = input.value || "";
  const names = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let m;
    rx.lastIndex = 0;
    while ((m = rx.exec(line)) !== null) {
      // m[1] if name in single quotes, m[2] if in double quotes
      names.push(m[1] || m[2]);
    }
  }
  let result = names;
  if (cbUnique.checked) result = [...new Set(result)];
  if (cbSort.checked) result = result.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  out.textContent = result.join("\n");
  count.textContent = result.length ? `Found ${result.length} name${result.length === 1 ? '' : 's'}.` : 'No names found.';
}

// Event wiring
extractBtn.addEventListener('click', extract);

copyBtn.addEventListener('click', async (e) => {
  const text = out.textContent || "";
  if (!text) {
    count.textContent = "Nothing to copy.";
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    const btn = e.currentTarget;
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = orig), 900);
  } catch {
    // Fallback: select text so user can copy manually
    const range = document.createRange();
    range.selectNodeContents(out);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    alert('Output selected—press Ctrl/Cmd+C to copy.');
  }
});

// Manual Clear button
clearBtn.addEventListener('click', wipe);

// Auto-wipe ONLY on full page reload/close for shared-computer safety
window.addEventListener('beforeunload', wipe);

// Start clean on initial load
wipe();


