const app = {
    data: [],

    init() {
        this.loadData();
        this.renderAll();
        this.initEventListeners();
        this.initDateTriggers();
        this.initDropdownHandler();
        this.currentPhotos = { defect: null, resolve: null };
    },

    initDropdownHandler() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.export-container')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    },

    toggleExportMenu(e) {
        e.stopPropagation();
        const container = e.target.closest('.export-container');
        const menu = container.querySelector('.dropdown-menu');
        
        // Close all other menus
        document.querySelectorAll('.dropdown-menu').forEach(m => {
            if (m !== menu) m.classList.remove('show');
        });

        menu.classList.toggle('show');
    },

    compressImage(file, maxDimension = 1024) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxDimension) {
                            height *= maxDimension / width;
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width *= maxDimension / height;
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
            reader.onerror = (error) => reject(error);
        });
    },

    handleImagePreview(input, previewId, key) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            this.compressImage(file).then(base64 => {
                this.currentPhotos[key] = base64;
                const preview = document.getElementById(previewId);
                preview.innerHTML = `<img src="${base64}" alt="Preview">`;
                preview.classList.remove('hidden');
            });
        }
    },

    initDateTriggers() {
        const triggers = document.querySelectorAll('.date-trigger');
        triggers.forEach(trigger => {
            const input = trigger.querySelector('input');
            const display = trigger.querySelector('.date-text');

            const syncValue = () => {
                if (input.value) {
                    display.textContent = input.value;
                    trigger.classList.add('has-value');
                } else {
                    display.textContent = '請點擊選擇日期...';
                    trigger.classList.remove('has-value');
                }
            };

            input.addEventListener('change', syncValue);
            syncValue(); // Initial check
        });

        // Handle Form Reset
        const form = document.getElementById('inspection-form');
        if (form) {
            form.addEventListener('reset', () => {
                setTimeout(() => {
                    triggers.forEach(trigger => {
                        const display = trigger.querySelector('.date-text');
                        display.textContent = '請點擊選擇日期...';
                        trigger.classList.remove('has-value');
                    });
                }, 0);
            });
        }
    },

    loadData() {
        const saved = localStorage.getItem('safety_inspections');
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            // Default sample data updated to new ID format
            this.data = [
                { id: '20260418-001', title: '高空作業安全帶損壞', category: '高空作業', date: '2026-04-18', location: 'C棟 頂樓施工區', severity: '高', status: 'pending', deadline: '2026-04-19', description: '安全帶掛鉤彈簧失效，無法完全閉合。', inspector: '陳大文' },
                { id: '20260417-003', title: '配電箱門未關閉且鎖損壞', category: '電氣安全', date: '2026-04-17', location: 'A棟 二樓機房', severity: '高', status: 'pending', deadline: '2026-04-18', description: '高壓配電箱門處於開啟狀態，鎖頭有明顯損毀痕跡。', inspector: '周杰倫' },
                { id: '20260417-002', title: '化學藥劑未依規定標示', category: '化學品管理', date: '2026-04-17', location: '研發實驗室 B', severity: '中', status: 'pending', deadline: '2026-04-24', description: '數瓶藍色溶劑桶標籤脫落，無法辨識內容物與警示圖案。', inspector: '蔡依林' },
                { id: '20260417-001', title: '通道堆放木製棧板', category: '環境衛生', date: '2026-04-17', location: 'B棟 出入口火災逃生口', severity: '中', status: 'resolved', deadline: '2026-04-18', description: '廢棄木棧板堆疊高度超過 1.5 公尺且佔據逃生動線。', inspector: '陳大文', resolveNote: '已聯繫外包廠商全數清運完成，目前動線通暢無礙。', resolveExecutor: '王小明', resolveDate: '2026-04-18' },
                { id: '20260416-001', title: '滅火器壓力不足', category: '消防安全', date: '2026-04-16', location: '行政大樓 走廊', severity: '低', status: 'resolved', deadline: '2026-04-20', description: '編號 Fire-A12 之滅火器指針異常進入紅色區域。', inspector: '蔡依林', resolveNote: '已送往總務組進行鋼瓶填充並檢驗完畢，放回原處。', resolveExecutor: '李四', resolveDate: '2026-04-17' }
            ];
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem('safety_inspections', JSON.stringify(this.data));
    },

    initEventListeners() {
        const inspectForm = document.getElementById('inspection-form');
        if (inspectForm) {
            inspectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(e.target);
            });
        }

        ['pending', 'resolved'].forEach(status => {
            const searchInput = document.getElementById(`search-${status}`);
            if (searchInput) {
                searchInput.addEventListener('input', () => this.applyFilters(status));
            }
            
            ['category', 'severity', 'inspector'].forEach(filter => {
                const select = document.getElementById(`filter-${filter}-${status}`);
                if (select) {
                    select.addEventListener('change', () => this.applyFilters(status));
                }
            });
        });

        const resolveForm = document.getElementById('resolve-form');
        if (resolveForm) {
            resolveForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleResolveSubmit();
            });
        }

        [document.getElementById('resolve-modal'), document.getElementById('details-modal')].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeResolveModal();
                        this.closeDetailsModal();
                    }
                });
            }
        });

        const defectInput = document.getElementById('photo-input');
        if (defectInput) {
            defectInput.addEventListener('change', (e) => this.handleImagePreview(e.target, 'preview-defect', 'defect'));
        }

        const resolveInput = document.getElementById('resolve-photo-input');
        if (resolveInput) {
            resolveInput.addEventListener('change', (e) => this.handleImagePreview(e.target, 'preview-resolve', 'resolve'));
        }
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.innerText.includes(this.getViewName(viewId))) {
                link.classList.add('active');
            }
        });

        document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
        document.getElementById('view-' + viewId).classList.remove('hidden');

        // Update mobile header title
        const mobileViewTitle = document.getElementById('mobile-current-view');
        if (mobileViewTitle) {
            mobileViewTitle.textContent = this.getViewName(viewId);
        }

        if (viewId === 'dashboard') this.renderDashboard();
        if (viewId === 'pending' || viewId === 'resolved') this.renderLists();
        
        if (window.lucide) lucide.createIcons();
    },

    getViewName(id) {
        const mapping = { 'dashboard': '儀表板', 'pending': '待處理清單', 'resolved': '已結案紀錄', 'form': '新增巡檢' };
        return mapping[id] || '';
    },

    handleFormSubmit(form) {
        const formData = new FormData(form);
        const today = new Date();
        const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        const todayRecords = this.data.filter(item => item.id.startsWith(datePrefix));
        const seq = (todayRecords.length + 1).toString().padStart(3, '0');
        const newId = `${datePrefix}-${seq}`;

        const newRecord = {
            id: newId,
            title: formData.get('title'),
            category: formData.get('category'),
            date: formData.get('date'),
            location: formData.get('location'),
            severity: formData.get('severity'),
            deadline: formData.get('deadline'),
            description: formData.get('description'),
            inspector: formData.get('inspector'),
            status: 'pending',
            defectPhoto: this.currentPhotos.defect
        };

        this.data.unshift(newRecord);
        this.saveData();
        form.reset();
        this.currentPhotos.defect = null;
        document.getElementById('preview-defect').classList.add('hidden');
        document.getElementById('preview-defect').innerHTML = '';
        
        alert('紀錄儲存成功！');
        this.switchView('pending');
    },

    applyFilters(status) {
        const queryEl = document.getElementById(`search-${status}`);
        const catEl = document.getElementById(`filter-category-${status}`);
        const sevEl = document.getElementById(`filter-severity-${status}`);
        const inspEl = document.getElementById(`filter-inspector-${status}`);

        const query = queryEl ? queryEl.value.toLowerCase() : '';
        const category = catEl ? catEl.value : '';
        const severity = sevEl ? sevEl.value : '';
        const inspector = inspEl ? inspEl.value : '';

        const sortedData = [...this.data].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const filteredData = sortedData.filter(item => {
            if (item.status !== status) return false;
            
            const matchQuery = !query || 
                item.title.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                (item.inspector && item.inspector.toLowerCase().includes(query));
                
            const matchCategory = !category || item.category === category;
            const matchSeverity = !severity || item.severity === severity;
            const matchInspector = !inspector || item.inspector === inspector;
            
            return matchQuery && matchCategory && matchSeverity && matchInspector;
        });
        
        this.renderTable(`list-${status}`, filteredData);
    },

    toggleStatus(id) {
        const record = this.data.find(d => d.id === id);
        if (record) {
            if (record.status === 'pending') {
                this.openResolveModal(id);
            } else {
                if (confirm('確定要重新開啟此案件嗎？')) {
                    record.status = 'pending';
                    this.saveData();
                    this.renderAll();
                }
            }
        }
    },

    openResolveModal(id) {
        const modal = document.getElementById('resolve-id');
        if (modal) {
            document.getElementById('resolve-id').value = id;
            document.getElementById('resolve-note').value = '';
            document.getElementById('resolve-executor').value = '';
            document.getElementById('resolve-modal').classList.remove('hidden');
        }
    },

    closeResolveModal() {
        const modal = document.getElementById('resolve-modal');
        if (modal) modal.classList.add('hidden');
    },

    handleResolveSubmit() {
        const id = document.getElementById('resolve-id').value;
        const note = document.getElementById('resolve-note').value;
        const executor = document.getElementById('resolve-executor').value;
        const record = this.data.find(d => d.id === id);
        
        if (record) {
            record.status = 'resolved';
            record.resolveNote = note;
            record.resolveExecutor = executor;
            record.resolveDate = new Date().toISOString().split('T')[0];
            record.resolvePhoto = this.currentPhotos.resolve;
            
            this.saveData();
            this.currentPhotos.resolve = null;
            document.getElementById('preview-resolve').classList.add('hidden');
            document.getElementById('preview-resolve').innerHTML = '';
            
            this.closeResolveModal();
            this.renderAll();
            alert('案件已結案！');
        }
    },

    viewDetails(id) {
        const item = this.data.find(d => d.id === id);
        if (!item) return;

        const content = document.getElementById('details-content');
        if (content) {
            content.innerHTML = `
                <p><strong>項目名稱：</strong>${item.title}</p>
                <p><strong>類別：</strong>${item.category}</p>
                <p><strong>地點：</strong>${item.location}</p>
                <p><strong>嚴重度：</strong>${item.severity}</p>
                <p><strong>缺失描述：</strong>${item.description || '無'}</p>
                <p><strong>開單人員：</strong>${item.inspector || '-'}</p>
                <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border);">
                <p><strong style="color: var(--success);">改善說明：</strong></p>
                <p style="background: #f0fdf4; padding: 12px; border-radius: 8px; margin-top: 8px;">${item.resolveNote || '尚未結案'}</p>
                <p style="margin-top: 8px;"><strong>改善人員：</strong>${item.resolveExecutor || '-'}</p>
                <p style="margin-top: 8px;"><strong>結案日期：</strong>${item.resolveDate ? item.resolveDate.replace(/-/g, '/') : '-'}</p>
                
                <div class="detail-photo-section">
                    <div class="photo-card">
                        <h4>缺失照片 (改善前)</h4>
                        <div class="img-container">
                            ${item.defectPhoto ? `<img src="${item.defectPhoto}" onclick="window.open(this.src)">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">尚未提供照片</div>'}
                        </div>
                    </div>
                    <div class="photo-card">
                        <h4>改善照片 (改善後)</h4>
                        <div class="img-container">
                            ${item.resolvePhoto ? `<img src="${item.resolvePhoto}" onclick="window.open(this.src)">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">尚未結案或提供照片</div>'}
                        </div>
                    </div>
                </div>
            `;
            
            const btnExportPdf = document.getElementById('btn-export-pdf');
            if (btnExportPdf) {
                btnExportPdf.onclick = () => app.exportSinglePDF(id);
            }
            
            document.getElementById('details-modal').classList.remove('hidden');
        }
    },

    closeDetailsModal() {
        const modal = document.getElementById('details-modal');
        if (modal) modal.classList.add('hidden');
    },

    deleteRecord(id) {
        if (confirm('確定要永久刪除此筆紀錄嗎？')) {
            this.data = this.data.filter(d => d.id !== id);
            this.saveData();
            this.renderAll();
        }
    },

    exportSinglePDF(id) {
        const item = this.data.find(d => d.id === id);
        if (!item) return;
        
        // Use the existing generateReportHTML but pass only this specific item
        const reportHtml = this.generateReportHTML([item]);
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
    },

    exportReport(filterStatus = 'all') {
        const dataToExport = filterStatus === 'all' 
            ? this.data 
            : this.data.filter(item => item.status === filterStatus);

        if (dataToExport.length === 0) {
            alert('目前沒有符合條件的資料可以產生報表');
            return;
        }

        const reportHtml = this.generateReportHTML(dataToExport);
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
    },

    generateReportHTML(data) {
        const date = new Date().toLocaleDateString();
        const pendingCount = data.filter(d => d.status === 'pending').length;
        const resolvedCount = data.length - pendingCount;

        let itemsHtml = '';
        data.forEach((item, index) => {
            itemsHtml += `
                <div class="report-item">
                    <div class="item-header">
                        <span class="item-id">#${item.id}</span>
                        <span class="item-title">${item.title}</span>
                        <span class="item-status ${item.status}">${item.status === 'pending' ? '待處理' : '已結案'}</span>
                    </div>
                    <div class="item-details">
                        <div class="detail-col">
                            <p><strong>發現日期：</strong>${this.formatDate(item.date)}</p>
                            <p><strong>發現地點：</strong>${item.location}</p>
                            <p><strong>嚴重程度：</strong>${item.severity}</p>
                            <p><strong>類別：</strong>${item.category}</p>
                            <p><strong>開單人員：</strong>${item.inspector || '-'}</p>
                        </div>
                        <div class="detail-col">
                            <p><strong>改善說明：</strong>${item.resolveNote || '尚未結案'}</p>
                            <p><strong>改善人員：</strong>${item.resolveExecutor || '-'}</p>
                            <p><strong>結案日期：</strong>${item.resolveDate ? this.formatDate(item.resolveDate) : '-'}</p>
                        </div>
                    </div>
                    <div class="item-photos">
                        <div class="photo-box">
                            <div class="photo-label">改善前 (缺失照片)</div>
                            <div class="photo-img">
                                ${item.defectPhoto ? `<img src="${item.defectPhoto}">` : '<div class="no-photo">無相片資料</div>'}
                            </div>
                        </div>
                        <div class="photo-box">
                            <div class="photo-label">改善後 (結案照片)</div>
                            <div class="photo-img">
                                ${item.resolvePhoto ? `<img src="${item.resolvePhoto}">` : '<div class="no-photo">無相片資料</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>工安巡檢缺失改善報表_${date}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; color: #334155; line-height: 1.5; padding: 40px; background: #fff; }
        .no-print-zone { margin-bottom: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; gap: 15px; justify-content: space-between; align-items: center; }
        .btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .btn-print { background: #3d6a5a; color: white; border: none; }
        .btn-csv { background: #fff; color: #64748b; border: 1px solid #e2e8f0; }
        
        header { border-bottom: 3px solid #3d6a5a; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        header h1 { margin: 0; color: #1e293b; font-size: 28px; }
        .report-meta { text-align: right; font-size: 14px; color: #64748b; }
        
        .summary-box { display: flex; gap: 20px; margin-bottom: 40px; }
        .summary-card { flex: 1; padding: 15px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
        .summary-card h4 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
        .summary-card p { margin: 5px 0 0; font-size: 24px; font-weight: 700; color: #3d6a5a; }

        .report-item { margin-bottom: 60px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; page-break-inside: avoid; }
        .item-header { background: #f8fafc; padding: 15px 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #e2e8f0; }
        .item-id { font-weight: 700; color: #3d6a5a; font-size: 18px; }
        .item-title { font-weight: 600; font-size: 18px; color: #1e293b; flex: 1; }
        .item-status { padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
        .item-status.pending { background: #fee2e2; color: #991b1b; }
        .item-status.resolved { background: #dcfce7; color: #166534; }
        
        .item-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 20px; background: #fff; }
        .detail-col p { margin: 8px 0; font-size: 14px; }
        .detail-col strong { color: #64748b; width: 100px; display: inline-block; }
        
        .item-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; border-top: 1px solid #f1f5f9; background: #fcfdfe; }
        .photo-box { text-align: center; }
        .photo-label { font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .photo-img { height: 280px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f1f5f9; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .photo-img img { width: 100%; height: 100%; object-fit: contain; }
        .no-photo { color: #cbd5e1; font-size: 14px; font-style: italic; }

        footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }

        @media print {
            body { padding: 0; }
            .no-print-zone { display: none; }
            .report-item { border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="no-print-zone">
        <div>
            <strong>報表預覽</strong> - 您可以存為 PDF 或直接列印
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="window.print()" class="btn btn-print">立即列印 / 存為 PDF</button>
            <button onclick="window.close()" class="btn btn-csv">關閉視窗</button>
        </div>
    </div>

    <header>
        <div>
            <h1>工安巡檢缺失改善報告</h1>
            <p style="margin: 5px 0 0; color: #64748b;">Industrial Safety Inspection & Resolution Report</p>
        </div>
        <div class="report-meta">
            <p>製表日期：${date}</p>
            <p>系統版本：v2.1 Mobile Optimized</p>
        </div>
    </header>

    ${data.length > 1 ? `
    <div class="summary-box">
        <div class="summary-card">
            <h4>總檢查項目</h4>
            <p>${data.length}</p>
        </div>
        <div class="summary-card">
            <h4>待處理項目</h4>
            <p>${pendingCount}</p>
        </div>
        <div class="summary-card">
            <h4>已改善完成</h4>
            <p>${resolvedCount}</p>
        </div>
    </div>
    ` : ''}

    <div class="report-content">
        ${itemsHtml}
    </div>

    <footer>
        <p>本報告由 崑山環工 - 工安缺失巡檢系統 自動產生</p>
    </footer>
</body>
</html>
        `;
    },

    exportCSV(filterStatus = 'all') {
        const dataToExport = filterStatus === 'all' 
            ? this.data 
            : this.data.filter(item => item.status === filterStatus);

        if (dataToExport.length === 0) {
            alert('目前沒有符合條件的資料可以匯出');
            return;
        }

        const headers = ['編號', '日期', '項目名稱', '類別', '地點', '嚴重度', '狀態', '開單人員', '改善人員', '改善說明', '結案日期'];
        const csvRows = [headers.join(',')];

        dataToExport.forEach(item => {
            const row = [
                item.id,
                this.formatDate(item.date),
                `"${item.title.replace(/"/g, '""')}"`,
                item.category,
                `"${item.location.replace(/"/g, '""')}"`,
                item.severity,
                item.status === 'pending' ? '待處理' : '已結案',
                item.inspector || '-',
                item.resolveExecutor || '-',
                `"${(item.resolveNote || '').replace(/"/g, '""')}"`,
                item.resolveDate ? item.resolveDate.replace(/-/g, '/') : '-'
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const fileNameDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const suffix = filterStatus === 'all' ? '全部' : (filterStatus === 'pending' ? '待處理' : '已結案');
        link.setAttribute('download', `工安巡檢紀錄_${suffix}_${fileNameDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    renderAll() {
        this.renderDashboard();
        this.renderLists();
    },

    renderLists() {
        this.populateFilterOptions();
        this.applyFilters('pending');
        this.applyFilters('resolved');
    },

    populateFilterOptions() {
        const baseCategories = ['機械安全', '電氣安全', '高空作業', '個人防護具', '消防安全', '環境衛生', '化學品管理', '其他'];
        const dataCategories = this.data.map(d => d.category).filter(Boolean);
        let rawCategories = [...new Set([...baseCategories, ...dataCategories])];
        
        let categories = rawCategories.filter(c => c !== '其他');
        categories.sort((a, b) => a.localeCompare(b, 'zh-TW'));
        categories.push('其他');
        
        const inspectors = [...new Set(this.data.map(d => d.inspector))].filter(Boolean);

        ['pending', 'resolved'].forEach(status => {
            const catSelect = document.getElementById(`filter-category-${status}`);
            if (catSelect) {
                const currentVal = catSelect.value;
                catSelect.innerHTML = `<option value="">類別 (全部)</option>` + 
                    categories.map(c => `<option value="${c}">${c}</option>`).join('');
                catSelect.value = currentVal;
            }

            const instSelect = document.getElementById(`filter-inspector-${status}`);
            if (instSelect) {
                const currentVal = instSelect.value;
                instSelect.innerHTML = `<option value="">開單人員 (全部)</option>` + 
                    inspectors.map(i => `<option value="${i}">${i}</option>`).join('');
                instSelect.value = currentVal;
            }
        });
    },

    renderDashboard() {
        const total = this.data.length;
        const pending = this.data.filter(d => d.status === 'pending').length;
        const resolved = total - pending;
        const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        const statTotal = document.getElementById('stat-total');
        if (statTotal) {
            statTotal.innerText = total;
            document.getElementById('stat-pending').innerText = pending;
            document.getElementById('stat-resolved').innerText = resolved;
            document.getElementById('stat-rate').innerText = rate + '%';
        }

        const sortedData = [...this.data].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentList = document.getElementById('recent-list');
        if (!recentList) return;
        recentList.innerHTML = '';
        sortedData.slice(0, 10).forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.onclick = (e) => {
                if (e.target.closest('button')) return;
                app.viewDetails(item.id);
            };
            tr.innerHTML = `
                <td>${this.formatDate(item.date)}</td>
                <td style="font-weight: 500; color: var(--primary);">${item.title}</td>
                <td>${item.location}</td>
                <td><span class="badge badge-${this.getSeverityClass(item.severity)}">${item.severity}</span></td>
                <td><span class="status-${item.status}">${item.status === 'pending' ? '🔴 待處理' : '🟢 已結案'}</span></td>
            `;
            recentList.appendChild(tr);
        });
    },

    renderTable(containerId, data) {
        const listBody = document.getElementById(containerId);
        if (!listBody) return;
        listBody.innerHTML = '';

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.onclick = (e) => {
                if (e.target.closest('button')) return;
                app.viewDetails(item.id);
            };
            tr.innerHTML = `
                <td style="font-weight: 500; color: var(--primary);">${item.id}</td>
                <td>${this.formatDate(item.date)}</td>
                <td>${item.title}</td>
                <td>${item.category}</td>
                <td>${item.location}</td>
                <td><span class="badge badge-${this.getSeverityClass(item.severity)}">${item.severity}</span></td>
                <td>${this.formatDate(item.deadline)}</td>
                <td>${item.inspector || '-'}</td>
                <td>
                    <div class="action-group">
                        ${item.status === 'pending' ? `
                            <button onclick="app.toggleStatus('${item.id}')" class="btn-primary btn-sm">結案</button>
                        ` : `
                            <button onclick="app.viewDetails('${item.id}')" class="btn-outline btn-sm">詳情</button>
                            <button onclick="app.toggleStatus('${item.id}')" class="btn-outline btn-sm">重啟</button>
                        `}
                        <button onclick="app.deleteRecord('${item.id}')" class="btn-outline btn-sm" style="color: var(--danger); border-color: var(--border); padding: 5px 8px;">
                            <i data-lucide="trash-2" size="16"></i>
                        </button>
                    </div>
                </td>
            `;
            listBody.appendChild(tr);
        });
        if (window.lucide) lucide.createIcons();
    },

    getSeverityClass(severity) {
        if (severity === '高') return 'high';
        if (severity === '中') return 'medium';
        return 'low';
    },

    formatDate(dateStr) {
        if (!dateStr) return '-';
        return dateStr.replace(/-/g, '/');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});
