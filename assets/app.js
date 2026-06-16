document.addEventListener('DOMContentLoaded', () => {
    
    // --- Toast Notification System ---
    function showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3400);
    }

    // --- Homepage URL Shortening ---
    const shortenForm = document.getElementById('shorten-form');
    if (shortenForm) {
        shortenForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const urlInput = document.getElementById('url-input');
            const submitBtn = document.getElementById('submit-btn');
            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');
            const resultContainer = document.getElementById('result-container');
            const shortUrlDisplay = document.getElementById('short-url-display');
            const originalUrl = urlInput.value.trim();

            if (!originalUrl) {
                showToast('Please enter a URL', 'error');
                return;
            }

            try {
                btnText.classList.add('hidden');
                btnSpinner.classList.remove('hidden');
                submitBtn.disabled = true;

                // Point to new api/index.php instead of index.php
                const response = await fetch('api/index.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `action=shorten&url=${encodeURIComponent(originalUrl)}`
                });

                const data = await response.json();

                if (data.success) {
                    showToast('URL Shortened Successfully!', 'success');
                    shortUrlDisplay.value = data.short_url;
                    shortUrlDisplay.setAttribute('data-full-url', data.short_url);
                    resultContainer.classList.remove('hidden');
                    urlInput.value = ''; 
                } else {
                    showToast(data.message || 'Error shortening URL', 'error');
                }

            } catch (error) {
                showToast('A network error occurred', 'error');
            } finally {
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    }

    // --- Copy to Clipboard Functionality ---
    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
            const targetId = copyBtn.getAttribute('data-target');
            let textToCopy = '';
            
            if (targetId) {
                textToCopy = document.getElementById(targetId).value;
            } else {
                textToCopy = copyBtn.getAttribute('data-url');
            }

            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('Copied to clipboard!', 'success');
                
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            });
        }
    });

    // --- Dashboard Specific ---
    
    // Search Functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#links-tbody tr');
            
            rows.forEach(row => {
                // skip the empty/loading state rows
                if (row.classList.contains('empty-state')) return;

                const originalUrl = row.querySelector('.original-url').textContent.toLowerCase();
                const shortCode = row.querySelector('.short-code').textContent.toLowerCase();
                
                if (originalUrl.includes(searchTerm) || shortCode.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Attach event listeners for dynamic dashboard elements (QR and Delete)
    function attachDashboardListeners() {
        const deleteForms = document.querySelectorAll('.delete-form');
        deleteForms.forEach(form => {
            // Prevent multiple bindings if called twice
            if (form.getAttribute('data-bound')) return;
            form.setAttribute('data-bound', 'true');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (!confirm('Are you sure you want to delete this link?')) return;

                const id = form.querySelector('input[name="id"]').value;
                const row = form.closest('tr');

                try {
                    const response = await fetch('api/index.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `action=delete&id=${id}`
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showToast('Link deleted successfully', 'success');
                        row.remove(); 
                        if (typeof loadDashboardData === 'function') loadDashboardData(); // Refresh stats
                    } else {
                        showToast(data.message || 'Failed to delete', 'error');
                    }
                } catch (error) {
                    showToast('Network error while deleting', 'error');
                }
            });
        });

        const qrButtons = document.querySelectorAll('.qr-btn');
        const qrModal = document.getElementById('qr-modal');
        const qrImage = document.getElementById('qr-image');
        const qrCloseBtn = document.getElementById('qr-close');

        if (qrModal) {
            qrButtons.forEach(btn => {
                if (btn.getAttribute('data-bound')) return;
                btn.setAttribute('data-bound', 'true');

                btn.addEventListener('click', () => {
                    const url = btn.getAttribute('data-url');
                    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
                    qrModal.classList.remove('hidden');
                    qrModal.classList.add('flex');
                });
            });

            if (!qrCloseBtn.getAttribute('data-bound')) {
                qrCloseBtn.setAttribute('data-bound', 'true');
                qrCloseBtn.addEventListener('click', () => {
                    qrModal.classList.add('hidden');
                    qrModal.classList.remove('flex');
                    qrImage.src = '';
                });

                qrModal.addEventListener('click', (e) => {
                    if (e.target === qrModal) {
                        qrModal.classList.add('hidden');
                        qrModal.classList.remove('flex');
                    }
                });
            }
        }
    }

    // Expose a global function to load dashboard data (called from dashboard.html)
    window.loadDashboardData = async function() {
        const tbody = document.getElementById('links-tbody');
        if (!tbody) return; // not on dashboard page

        try {
            const response = await fetch('api/index.php?action=get_dashboard');
            const data = await response.json();

            if (data.success) {
                // Update stats
                document.getElementById('stat-total-links').textContent = data.stats.total_links.toLocaleString();
                document.getElementById('stat-total-clicks').textContent = data.stats.total_clicks.toLocaleString();
                document.getElementById('stat-most-clicks').textContent = data.stats.most_clicked.toLocaleString();

                // Build Table
                tbody.innerHTML = '';
                if (data.urls.length === 0) {
                    tbody.innerHTML = `
                        <tr class="empty-state">
                            <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                                No links shortened yet. <a href="index.html" class="text-indigo-400 font-medium hover:underline">Create one now!</a>
                            </td>
                        </tr>
                    `;
                } else {
                    const baseUrl = window.location.origin + window.location.pathname.replace('dashboard.html', '');
                    
                    data.urls.forEach(url => {
                        const shortUrlFull = `${baseUrl}r/${url.short_code}`;
                        const dateObj = new Date(url.created_at);
                        const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 last:border-0';
                        tr.innerHTML = `
                            <td class="px-6 py-4 max-w-[200px] truncate original-url font-medium text-slate-200" title="${url.original_url}">
                                ${url.original_url}
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-2">
                                    <a href="${shortUrlFull}" target="_blank" class="text-indigo-400 hover:text-indigo-300 font-medium hover:underline short-code">
                                        ${url.short_code}
                                    </a>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <span class="bg-slate-900/50 text-slate-300 font-semibold px-3 py-1 rounded-full border border-slate-700">
                                    ${url.clicks.toLocaleString()}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-slate-500 text-sm">
                                ${formattedDate}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button class="qr-btn p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-600" data-url="${shortUrlFull}" title="QR Code">
                                        <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                                    </button>
                                    <button class="copy-btn p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-600" data-url="${shortUrlFull}" title="Copy Link">
                                        <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    </button>
                                    <form class="delete-form m-0 inline">
                                        <input type="hidden" name="id" value="${url.id}">
                                        <button type="submit" class="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-600" title="Delete">
                                            <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </form>
                                </div>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                    
                    attachDashboardListeners();
                }
            } else {
                tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Failed to load data.</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Network error loading dashboard.</td></tr>`;
        }
    };

});
