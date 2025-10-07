// app.js — file upload + drag-and-drop

// Proactively unregister any service workers on this origin
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister().catch(() => {})))
    .catch(() => {});
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
const fileInput = document.getElementById('logFile');

// Regex to match names up to next key
const rx = /name='(.*?)'(?=\s+\w+=)/gu;

// File input loading
fileInput.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    input.value = event.target.result;
    count.textContent = "Log file loaded. Ready to extract.";
  };
  reader.readAsText(file);
});

// Drag-and-drop support for textarea
input.addEventListener('dragover', function(e) {
  e.preventDefault();
  input.style.borderColor = "#5496fa";
});
input.addEventListener('dragleave', function(e) {
  e.preventDefault();
  input.style.borderColor = "";
});
input.addEventListener('drop', function(e) {
  e.preventDefault();
  input.style.borderColor = "";
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      input.value = event.target.result;
      count.textContent = "Log file dropped. Ready to extract.";
    };
    reader.readAsText(file);
  }
});

// Helper: clear all
function wipe() {
  input.value = '';
  out.textContent = '';
  count.textContent = '';
  const sel = window.getSelection?.();
  if (sel && sel.removeAllRanges) sel.removeAllRanges();
}

// Extraction logic
function extract() {
  const text = input.value || "";
  const names = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let m;
    rx.lastIndex = 0;
    while ((m = rx.exec(line)) !== null) {
      names.push(m[1]);
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

clearBtn.addEventListener('click', wipe);

// Auto-wipe on page unload
window.addEventListener('beforeunload', wipe);

wipe();
