        const TARGET_PER_PERSON = 500;
        const DEADLINE = new Date('2026-05-01');
    
        function escapeHtml(text) {
            if (typeof text !== 'string') return text;
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        // --- DATA MOCKUP ---
        const sliderImages = [{ url: "images/candat1.jpg"}, { url: "images/candat2.jpg"}, { url: "images/candat3.jpg"}, { url: "images/candat4.jpg"}, { url: "images/candat5.jpg"}];
        let currentImageIndex = 0;
        let slideInterval;
        
        // Tarikh telah ditukar kepada dd-mm-yyyy
        let members = [
            { id: 1, name: 'Mie', paid: 150, history: [{date: '10-10-2025', amount: 50}, {date: '16-10-2025', amount: 50}, {date: '05-12-2025', amount: 50}] },
            { id: 2, name: 'John', paid: 200, history: [{date: '10-10-2025', amount: 50}, {date: '16-10-2025', amount: 50}, {date: '03-12-2025', amount: 100}] },
            { id: 3, name: 'ManRemy', paid: 50, history: [{date: '16-10-2025', amount: 50}] },
            { id: 4, name: 'Man', paid: 250, history: [{date: '10-10-2025', amount: 50}, {date: '16-10-2025', amount: 100}, {date: '27-10-2025', amount: 50}, {date: '03-12-2025', amount: 50}] },
            { id: 5, name: 'En Lan', paid: 250, history: [{date: '09-10-2025', amount: 50}, {date: '16-10-2025', amount: 100}, {date: '05-12-2025', amount: 100}] },
            { id: 6, name: 'AbgLan', paid: 250, history: [{date: '10-10-2025', amount: 50}, {date: '03-12-2025', amount: 100}, {date: '03-12-2025', amount: 100}] },
            { id: 7, name: 'AbgWan', paid: 100, history: [{date: '10-10-2025', amount: 50}, {date: '16-10-2025', amount: 50}] },
            { id: 8, name: 'Hariz', paid: 100, history: [{date: '16-10-2025', amount: 100}] },
            { id: 9, name: 'Rosddi', paid: 100, history: [{date: '10-10-2025', amount: 50}, {date: '16-10-2025', amount: 50}] },
            { id: 10, name: 'AbgRizal', paid: 100, history: [{date: '16-10-2025', amount: 100}] }
        ];
    
        let expenses = [
            { id: 101, date: '10-10-2025', category: 'Pengangkutan', detail: 'Bayar Booking (Boat)', amount: 350 },
            { id: 102, date: '16-10-2025', category: 'Pengangkutan', detail: 'Bayar Booking (Van VVIP)', amount: 550 }
        ];

        // Parse Tarikh dd-mm-yyyy dengan selamat
        function parseMYDate(dateStr) {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        // --- INIT & AUTO POP-UP ---
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Jalankan fungsi utama
            renderTable();
            renderExpenses();
            startImageSlider();
            initChecklist();

            // 2. Jalankan Pop-up Toast (Auto)
            setTimeout(() => {
                const toast = document.getElementById('paymentToast');
                if(toast) {
                    toast.classList.remove('-translate-x-full', 'opacity-0', 'pointer-events-none');
                    
                    window.toastTimer = setTimeout(() => {
                        closeToast();
                    }, 6000); 
                }
            }, 4000); 
        });
        
        function closeToast() {
            const toast = document.getElementById('paymentToast');
            if(toast) {
                toast.classList.add('-translate-x-full', 'opacity-0', 'pointer-events-none');
                
                if (window.toastTimer) clearTimeout(window.toastTimer);
            }
        }

        // --- HELPER TIME (PENTING!) ---
        function getRemainingTime() {
            const now = new Date();
            const diff = DEADLINE - now;
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            return { expired: diff <= 0, totalDays: days };
        }

        // --- CALENDAR LOGIC ---
        let currentCalDate = new Date(); 
        
        function openCalendarModal() {
            const modal = document.getElementById('calendarModal');
            const content = document.getElementById('calendarModalContent');
            
            // Reset date
            currentCalDate = new Date();
            renderCalendar();
            
            // Setup Countdown
            const timeData = getRemainingTime();
            const countEl = document.getElementById('modalCountdown');
            if (timeData.expired) {
                countEl.innerText = "Misi Sedang Berlangsung!";
                countEl.className = "font-bold text-emerald-600 text-sm animate-pulse";
            } else {
                countEl.innerText = `${timeData.totalDays} Hari Lagi`;
                countEl.className = "font-bold text-blue-600 text-sm";
            }

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
        }
    
        function closeCalendarModal() {
            const modal = document.getElementById('calendarModal');
            const content = document.getElementById('calendarModalContent');
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
    
        function changeMonth(direction) {
            currentCalDate.setMonth(currentCalDate.getMonth() + direction);
            renderCalendar();
        }
    
        function renderCalendar() {
            const year = currentCalDate.getFullYear();
            const month = currentCalDate.getMonth();
            const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
            
            document.getElementById('calTitle').innerText = `${monthNames[month]} ${year}`;
            
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const grid = document.getElementById('calGrid');
            grid.innerHTML = "";
            
            // Empty slots
            for (let i = 0; i < firstDay; i++) grid.innerHTML += `<span></span>`;
            
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                let cellClass = "w-7 h-7 flex items-center justify-center rounded-full mx-auto transition cursor-default";
                const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
                const isTripDay = (year === 2026 && month === 4 && (day === 1 || day === 2));
                
                if (isTripDay) {
                    cellClass += " bg-emerald-500 text-white shadow-lg shadow-emerald-200 font-bold scale-110";
                    if(day === 1) cellClass += " animate-bounce";
                } else if (isToday) {
                    cellClass += " bg-blue-500 text-white font-bold";
                } else {
                    cellClass += " hover:bg-gray-100 text-slate-700";
                }
                grid.innerHTML += `<span class="flex items-center justify-center"><div class="${cellClass}">${day}</div></span>`;
            }
        }

        // --- OTHER FUNCTIONS ---
        function triggerSquidSwim() {
            if (document.querySelectorAll('.swimming-squid').length >= 5) return;

            const squid = document.createElement('div');
            squid.innerText = '🦑'; 
            squid.classList.add('swimming-squid');
            squid.style.top = (Math.floor(Math.random() * 70) + 10) + '%';
            document.body.appendChild(squid);
            
            setTimeout(() => squid.remove(), 4000);
        }

        function startImageSlider() {
            const container = document.querySelector('.image-slider');
            
            if (slideInterval) clearInterval(slideInterval);
        
            const leftBtn = container.querySelector('.slider-nav-btn.left');
            const rightBtn = container.querySelector('.slider-nav-btn.right');
        
            container.innerHTML = ''; 
        
            sliderImages.forEach((imgData, index) => {
                const img = document.createElement('img');
                img.className = 'slider-image' + (index === 0 ? ' active' : '');
                img.src = imgData.url;
                img.onerror = function(){ this.src='https://placehold.co/600x400/1e293b/ffffff?text=Image'; };
                container.appendChild(img);
            });
        
            if (leftBtn) container.appendChild(leftBtn);
            if (rightBtn) container.appendChild(rightBtn);
            
            slideInterval = setInterval(() => changeSlide(1), 5000);
        }
        function changeSlide(n) {
            const images = document.querySelectorAll('.slider-image');
            if (images.length === 0) return; // Elak error jika tiada gambar
        
            images[currentImageIndex].classList.remove('active');
        
            currentImageIndex += n;
        
            if (currentImageIndex >= images.length) {
                currentImageIndex = 0;
            } else if (currentImageIndex < 0) {
                currentImageIndex = images.length - 1;
            }
        
            images[currentImageIndex].classList.add('active');
        
            clearInterval(slideInterval);
            slideInterval = setInterval(() => changeSlide(1), 5000);
        }

        function formatCurrency(num) { 
            return num.toLocaleString('ms-MY', { 
                style: 'currency', 
                currency: 'MYR',
                minimumFractionDigits: 0, // Boleh ubah ke 2 jika mahu sen
                maximumFractionDigits: 0  
            }); 
        }
        function renderTable() {
            const tbody = document.getElementById('memberTableBody');
            tbody.innerHTML = '';
        
            const sortedMembers = [...members].sort((a,b) => b.paid - a.paid);
            
            let totalCollected = 0;
            
            sortedMembers.forEach(m => {
                totalCollected += m.paid;
                
                const pct = Math.min(100, (m.paid / TARGET_PER_PERSON) * 100);
                
                const safeName = escapeHtml(m.name);
                
                tbody.innerHTML += `
                    <tr class="border-b border-gray-50 hover:bg-gray-50">
                        <td class="p-3 font-bold text-gray-700">${safeName}</td>
                        <td class="p-3 text-center">
                            <div class="w-16 mx-auto bg-gray-200 rounded-full h-1">
                                <div class="bg-emerald-500 h-1 rounded-full" style="width:${pct}%"></div>
                            </div>
                            <div class="text-[10px] text-gray-400">${Math.round(pct)}%</div>
                        </td>
                        <td class="p-3 text-center font-mono text-emerald-600 font-bold">${m.paid}</td>
                        <td class="p-3 text-center">
                            <button onclick="openDetails(${m.id})" class="text-blue-400 hover:text-blue-600">
                                <i class="fa-solid fa-receipt"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        
            document.getElementById('tableSummaryCollected').innerText = formatCurrency(totalCollected);
            
            const globalPct = (totalCollected / (members.length * TARGET_PER_PERSON)) * 100;
            document.getElementById('tableSummaryProgress').style.width = globalPct + '%';
            
            updateExpensesSummary(totalCollected);
            
            document.getElementById('summaryPercentage').innerText = Math.round(globalPct) + '%';
        }

        function openDetails(id) {
            const m = members.find(x => x.id === id);
            document.getElementById('detailMemberName').innerText = m.name;
            const tbody = document.getElementById('detailsTableBody');
            tbody.innerHTML = '';
        
            const sortedHistory = [...m.history].sort((a, b) => {
                return parseMYDate(b.date) - parseMYDate(a.date); 
            });
        
            sortedHistory.forEach(h => { 
                const safeDateHistory = escapeHtml(h.date); 
            
                tbody.innerHTML += `
                    <tr class="border-b border-dashed border-gray-100">
                        <td class="py-1">${safeDateHistory}</td> 
                        <td class="text-right">${formatCurrency(h.amount)}</td> </tr>`; 
            });
        
            document.getElementById('detailTotal').innerText = formatCurrency(m.paid);
            document.getElementById('detailsModal').classList.remove('hidden');
        }
        function closeDetailsModal() { document.getElementById('detailsModal').classList.add('hidden'); }

        function renderExpenses() {
            const tbody = document.getElementById('expensesTableBody');
            
            // --- FIX WAJIB: Kosongkan table sebelum render ---
            tbody.innerHTML = ''; 
            // -------------------------------------------------
        
            if(expenses.length === 0) { 
                document.getElementById('noExpensesMsg').classList.remove('hidden'); 
                return; 
            } else {
                // Pastikan mesej "Tiada rekod" disembunyikan jika ada data
                document.getElementById('noExpensesMsg').classList.add('hidden');
            }
        
            const sortedExpenses = [...expenses].sort((a,b) => {
                return parseMYDate(b.date) - parseMYDate(a.date);
            });
        
            sortedExpenses.forEach(e => {
                const safeDate = escapeHtml(e.date);
                const safeCategory = escapeHtml(e.category);
                const safeDetail = escapeHtml(e.detail);
        
                tbody.innerHTML += `
                    <tr class="border-b border-gray-50 hover:bg-gray-50">
                        <td class="p-3 align-top text-gray-500">${safeDate}</td>
                        <td class="p-3">
                            <div class="font-bold text-gray-700">${safeCategory}</div>
                            <div class="text-[10px] text-gray-400">&bull; ${safeDetail}</div>
                        </td>
                        <td class="p-3 text-right font-bold text-red-500">-${formatCurrency(e.amount)}</td>
                    </tr>`;
            });
        }
        function updateExpensesSummary(totalCollected) {
            // Kira total belanja
            let totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
            let netBalance = totalCollected - totalExpenses;

            // 1. Update Kolum Terkumpul (ID baru: summaryCollected)
            const collectedEl = document.getElementById('summaryCollected');
            if (collectedEl) collectedEl.innerText = formatCurrency(totalCollected);

            // 2. Update Kolum Belanja
            const expEl = document.getElementById('summaryExpenses');
            if (expEl) expEl.innerText = formatCurrency(totalExpenses);

            // 3. Update Kolum Baki Bersih
            const netEl = document.getElementById('summaryNetBalance');
            if (netEl) {
                netEl.innerText = formatCurrency(netBalance);
                // Tukar warna jika negatif
                netEl.className = netBalance < 0 
                    ? "font-bold text-red-600 text-sm" 
                    : "font-bold text-blue-600 text-sm";
            }
        }

        function toggleContactModal() { document.getElementById('adminContactModal').classList.toggle('hidden'); }

        function initChecklist() {
            const headers = document.querySelectorAll('.cat-header');
            headers.forEach(h => {
                h.addEventListener('click', () => {
                    const body = h.nextElementSibling;
                    body.classList.toggle('hidden');
                    h.querySelector('.fa-chevron-down').classList.toggle('rotate-180');
                });
            });
        }

        // --- FUNGSI UNTUK EXPAND/COLLAPSE TENTATIF ---
        function toggleTentative(element) {
            const content = element.nextElementSibling;
            
            const icon = element.querySelector('.fa-chevron-down');
        
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden'); // Buka
                icon.classList.add('rotate-180');   // Pusing panah ke atas
            } else {
                content.classList.add('hidden');    // Tutup
                icon.classList.remove('rotate-180');// Pusing panah ke bawah
            }
        }