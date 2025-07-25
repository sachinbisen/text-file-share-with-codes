// Theme management functions
function setTheme(isDark) {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
  updateThemeButton(isDark);
}

function updateThemeButton(isDark) {
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  if (isDark) {
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light';
  } else {
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Dark';
  }
}

function getPreferredTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme === 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Initialize theme
function initTheme() {
  const prefersDark = getPreferredTheme();
  setTheme(prefersDark);
  
  // Watch for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches);
    }
  });
}

// Set up theme toggle
function setupThemeToggle() {
  document.getElementById('toggleTheme').addEventListener('click', () => {
    const isDark = !document.documentElement.classList.contains('dark');
    setTheme(isDark);
    
    // Force repaint to ensure transitions work
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
  });
}

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupThemeToggle();
});

async function sendData() {
  const text = document.getElementById('textInput').value;
  const files = document.getElementById('fileInput').files;
  const maxReceivers = document.getElementById('receiverInput').value || 1;
  const expiryMinutes = document.getElementById('expiryInput').value || 10;

  // Validate inputs
  if (!text.trim() && files.length === 0) {
    showToast('Please enter text or select files', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('maxReceivers', maxReceivers);
  formData.append('expiryMinutes', expiryMinutes);

  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
  }

  if (text.trim() !== '') {
    formData.append('text', text);
  }

  const sendResult = document.getElementById('sendResult');
  const sendLoading = document.getElementById('sendLoading');
  
  sendResult.classList.add('hidden');
  sendLoading.classList.remove('hidden');

  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    sendResult.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="mb-2">
          <span class="font-bold">Your code:</span> 
          <span class="text-xl">${data.code}</span>
        </div>
        <button onclick="copyToClipboard('${data.code}')" 
          class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
          📋 Copy Code
        </button>
      </div>
    `;
    sendResult.classList.remove('hidden');
    showToast(`✅ Sent successfully! Code: ${data.code}`);
  } catch (error) {
    console.error('Error:', error);
    sendResult.innerHTML = `<span class="text-red-500">Error: ${error.message || 'Failed to send data'}</span>`;
    sendResult.classList.remove('hidden');
    showToast('❌ Failed to send data', 'error');
  } finally {
    sendLoading.classList.add('hidden');
  }
}

async function receiveData() {
  const code = document.getElementById('codeInput').value;
  if (!code || code.length !== 4 || !/^\d+$/.test(code)) {
    document.getElementById('receiveResult').innerText = "Please enter a valid 4-digit code";
    showToast('Please enter a 4-digit code', 'error');
    return;
  }

  const receiveResult = document.getElementById('receiveResult');
  receiveResult.innerHTML = `
    <div class="flex items-center justify-center gap-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
      <span>Fetching data...</span>
    </div>
  `;

  try {
    const res = await fetch(`/api/receive/${code}`);
    const data = await res.json();

    const textBlock = document.getElementById('textBlock');
    const filesBlock = document.getElementById('filesBlock');
    const fileLinks = document.getElementById('fileLinks');

    textBlock.classList.add('hidden');
    filesBlock.classList.add('hidden');
    fileLinks.innerHTML = "";

    if (data.error) {
      receiveResult.innerText = data.error === 'Code expired' ? "Code expired!" : "Error: " + data.error;
      showToast('❌ ' + data.error, 'error');
      return;
    }

    receiveResult.innerText = "";

    if (data.text) {
      document.getElementById('receivedText').innerText = data.text;
      textBlock.classList.remove('hidden');
    }

    if (data.files && data.files.length > 0) {
      fileLinks.innerHTML = data.files.map(file =>
        `<a href="${file.url}" download class="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
          <span class="text-lg">📄</span>
          <span>${file.filename}</span>
          <span class="text-xs text-gray-500 ml-auto">(Click to download)</span>
        </a>`).join('');
      filesBlock.classList.remove('hidden');
    }

    if (data.text || data.files) {
      showToast('✅ Content received successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    receiveResult.innerText = "Error fetching data. Please try again.";
    showToast('❌ Error fetching data', 'error');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Code copied to clipboard!');
  }).catch(err => {
    showToast('Failed to copy code', 'error');
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById("toast");
  const toastIcon = document.getElementById("toast-icon");
  const toastMessage = document.getElementById("toast-message");

  // Set icon and color based on type
  if (type === 'error') {
    toastIcon.textContent = '❌';
    toast.className = "fixed bottom-5 right-5 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl opacity-0 transition-all duration-300 flex items-center gap-2";
  } else {
    toastIcon.textContent = '✅';
    toast.className = "fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl opacity-0 transition-all duration-300 flex items-center gap-2";
  }

  toastMessage.textContent = message;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 3000);
}

// Clear form function (optional)
function clearForm() {
  document.getElementById('textInput').value = '';
  document.getElementById('fileInput').value = '';
  document.getElementById('receiverInput').value = '';
  document.getElementById('expiryInput').value = '';
  document.getElementById('sendResult').classList.add('hidden');
}

function copyReceivedText() {
  const text = document.getElementById('receivedText').innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Text copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy text', 'error');
  });
}
