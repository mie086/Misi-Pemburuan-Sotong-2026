        // --- 1. KONFIGURASI SUPABASE ---
        const SUPABASE_URL = 'https://twbmjojqyhmjsoywiqrs.supabase.co'; 
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Ym1qb2pxeWhtanNveXdpcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzUyODUsImV4cCI6MjA4MDUxMTI4NX0._Q3peI3s04DuBHyHE3qUl-OzcagrbpWdP2-QIid3agY';
        
        // Kita namakan 'supabaseClient' supaya tidak keliru dengan library asal
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        let isAdmin = false;
        
        // --- FUNGSI BARU: TARIK DATA DARI SUPABASE ---
        async function loadDataFromSupabase() {
            
            // Tunjuk status loading (optional, bagus untuk UX)
            console.log("Sedang menarik data dari Supabase...");
        
            try {
                // 1. Tarik data Members
                // Kita guna .order('id') supaya susunan tak lari
                let { data: membersData, error: errorMembers } = await supabaseClient
                    .from('members')
                    .select('*')
                    .order('id', { ascending: true });
        
                if (errorMembers) throw errorMembers;
        
                // 2. Tarik data Expenses
                let { data: expensesData, error: errorExpenses } = await supabaseClient
                    .from('expenses')
                    .select('*');
        
                if (errorExpenses) throw errorExpenses;
        
                // 3. Masukkan data ke dalam variable global
                if (membersData) members = membersData;
                if (expensesData) expenses = expensesData;
        
                // 4. Render semula table dengan data baru
                renderTable();     // Update table ahli
                renderExpenses();  // Update table belanja
                
                console.log("Data berjaya dikemaskini!");
        
            } catch (error) {
                console.error("Gagal tarik data:", error.message);
                alert("Maaf, ada masalah sambungan ke database.");
            }
        }
        
        // --- 2. LOGIC LOGIN & LOGOUT ---
        
        document.addEventListener('DOMContentLoaded', async () => {
            
            // 1. Jalan fungsi-fungsi UI biasa dulu
            startImageSlider();
            initChecklist();
        
            // 2. PENTING: Panggil data dari Supabase
            await loadDataFromSupabase(); 
        
            // 3. Check session user (Kod asal anda untuk Admin)
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                isAdmin = true;
                updateAdminUI();
                startAutoLogoutTimer(); // <--- TAMBAH BARIS INI
            }
            
            // 4. Toast logic (Kod asal anda)
            setTimeout(() => {
                const toast = document.getElementById('paymentToast');
                if(toast) {
                    toast.classList.remove('-translate-x-full', 'opacity-0', 'pointer-events-none');
                    window.toastTimer = setTimeout(() => closeToast(), 6000); 
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
        
        // --- PENGENDALIAN MODAL LOGIN/LOGOUT ---
        
        function checkAuthAndToggle() {
            if (isAdmin) {
                document.getElementById('logoutModal').classList.remove('hidden');
            } else {
                openLoginModal();
            }
        }
        
        function openLoginModal() {
            const modal = document.getElementById('loginModal');
            const content = document.getElementById('loginModalContent');
            modal.classList.remove('hidden');
            // Animasi masuk
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
        }
        
        function closeLoginModal() {
            const modal = document.getElementById('loginModal');
            const content = document.getElementById('loginModalContent');
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
        
        function closeLogoutModal() {
            document.getElementById('logoutModal').classList.add('hidden');
        }
        
        // FUNGSI MODAL SUCCESS BARU
        function openLogoutSuccessModal() {
            const modal = document.getElementById('logoutSuccessModal');
            // Pastikan kita select elemen dalam modal (div pertama) untuk animasi
            const content = modal.querySelector('div'); 
            
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
        }
        
        function closeLogoutSuccessModal() {
            const modal = document.getElementById('logoutSuccessModal');
            const content = modal.querySelector('div');
            
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
        
        
        // --- PROSES LOGIN & LOGOUT ---
        
        async function handleLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            const btn = document.getElementById('btnLoginSubmit');
            const errorMsg = document.getElementById('loginErrorMsg');
        
            // Loading UI
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
            btn.disabled = true;
            errorMsg.classList.add('hidden');
        
            // FIX: Gunakan supabaseClient (bukan supabase)
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
        
            if (error) {
                console.error("Login Error:", error);
                btn.innerHTML = 'Log Masuk <i class="fa-solid fa-arrow-right"></i>';
                btn.disabled = false;
                errorMsg.textContent = "Email atau password tidak sah.";
                errorMsg.classList.remove('hidden');
            } else {
                // Berjaya Login
                isAdmin = true;
                closeLoginModal();
                updateAdminUI();
                
                startAutoLogoutTimer();
                btn.innerHTML = 'Log Masuk <i class="fa-solid fa-arrow-right"></i>';
                btn.disabled = false;
                
                // Reset form
                document.getElementById('adminEmail').value = '';
                document.getElementById('adminPassword').value = '';
            }
        }
        
        async function handleLogout() {
            const { error } = await supabaseClient.auth.signOut();
            if (!error) {
                isAdmin = false;
                
                stopAutoLogoutTimer(); // <--- TAMBAH BARIS INI
                
                closeLogoutModal(); 
                updateAdminUI();
                
                // Reset mesej modal ke asal (sebab auto-logout mungkin dah ubah teks ni)
                const modal = document.getElementById('logoutSuccessModal');
                modal.querySelector('h3').innerText = "Berjaya Log Keluar!";
                modal.querySelector('p').innerText = "Sesi admin anda telah ditamatkan dengan selamat.";
                
                openLogoutSuccessModal(); 
            }
        }
        
        function updateAdminUI() {
            const dot = document.getElementById('loginStatusDot');
            const fab = document.getElementById('adminFab'); // Butang terapung (Floating Button)
        
            if (isAdmin) {
                // Tunjuk indikator hijau & butang Admin
                if(dot) dot.classList.remove('hidden'); 
                if(fab) fab.classList.remove('hidden'); 
                if(fab) fab.classList.add('flex');
                console.log("Admin Mode: ON");
            } else {
                // Sorok indikator & butang Admin
                if(dot) dot.classList.add('hidden'); 
                if(fab) fab.classList.add('hidden'); 
                if(fab) fab.classList.remove('flex');
                console.log("Admin Mode: OFF");
            }
        
            // --- [PENTING] LUKIS SEMULA TABLE ---
            // Ini memaksa browser letak butang Edit/Delete bila admin login
            renderTable();     
            renderExpenses();  
        }

        const TARGET_PER_PERSON = 500;
        const FIXED_TARGET = 5000;
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
        let members = []; 
        let expenses = [];

        // Parse Tarikh dd-mm-yyyy dengan selamat
        function parseMYDate(dateStr) {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
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
        
            // 1. Paparkan Target Tetap (RM 5,000)
            const targetDisplay = document.getElementById('totalTargetDisplay');
            if (targetDisplay) {
                targetDisplay.innerText = formatCurrency(FIXED_TARGET);
            }
        
            // 2. Susun ahli ikut bayaran tertinggi
            const sortedMembers = [...members].sort((a,b) => b.paid - a.paid);
            let totalCollected = 0;
            
            // 3. Render Baris Table
            sortedMembers.forEach(m => {
                totalCollected += parseFloat(m.paid); // Pastikan nombor
                
                // Kira peratus individu
                const pct = Math.min(100, (m.paid / TARGET_PER_PERSON) * 100);
                const safeName = escapeHtml(m.name);
                
                // Butang Edit (Pensil) hanya muncul untuk Admin
                let adminBtn = '';
                if (isAdmin) {
                    adminBtn = `<i onclick="editMemberConfig(${m.id})" class="fa-solid fa-pen text-[10px] ml-2 text-gray-300 hover:text-blue-500 cursor-pointer" title="Urus Ahli"></i>`;
                }
        
                tbody.innerHTML += `
                    <tr class="border-b border-gray-50 hover:bg-gray-50">
                        <td class="p-3 font-bold text-gray-700 flex items-center">
                            ${safeName} ${adminBtn}
                        </td>
                        <td class="p-3 text-center">
                            <div class="w-16 mx-auto bg-gray-200 rounded-full h-1">
                                <div class="bg-emerald-500 h-1 rounded-full" style="width:${pct}%"></div>
                            </div>
                            <div class="text-[10px] text-gray-400">${Math.round(pct)}%</div>
                        </td>
                        <td class="p-3 text-center font-mono text-emerald-600 font-bold">${formatCurrency(m.paid)}</td>
                        <td class="p-3 text-center">
                            <button onclick="openDetails(${m.id})" class="text-blue-400 hover:text-blue-600">
                                <i class="fa-solid fa-receipt"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        
            // 4. Update Summary Utama (Atas Table)
            document.getElementById('tableSummaryCollected').innerText = formatCurrency(totalCollected);
        
            // --- [INI BAHAGIAN YANG HILANG SEBELUM INI] ---
            // Kira peratus keseluruhan (Total / 5000 * 100)
            const globalPct = Math.min(100, (totalCollected / FIXED_TARGET) * 100);
            
            // Update Progress Bar
            const progressBar = document.getElementById('tableSummaryProgress');
            if(progressBar) progressBar.style.width = globalPct + '%';
            
            // Update Teks %
            const pctText = document.getElementById('summaryPercentage');
            if(pctText) pctText.innerText = Math.round(globalPct) + '%';
            // ----------------------------------------------
            
            updateExpensesSummary(totalCollected);
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
            tbody.innerHTML = ''; 
            document.getElementById('noExpensesMsg').className = expenses.length === 0 ? "p-6 text-center text-gray-400 text-sm" : "hidden";
        
            const sortedExpenses = [...expenses].sort((a,b) => parseMYDate(b.date) - parseMYDate(a.date));
        
            sortedExpenses.forEach(e => {
                const safeDate = escapeHtml(e.date);
                const safeCategory = escapeHtml(e.category);
                const safeDetail = escapeHtml(e.detail);
                
                // Logik Admin: Tunjuk butang edit jika isAdmin = true
                let adminAction = '';
                if (isAdmin) {
                    adminAction = `
                    <button onclick="editExpense(${e.id})" class="ml-2 text-gray-300 hover:text-blue-500">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>`;
                }
        
                tbody.innerHTML += `
                    <tr class="border-b border-gray-50 hover:bg-gray-50">
                        <td class="p-3 align-top text-gray-500 whitespace-nowrap">
                            ${safeDate}
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-gray-700 flex items-center">
                                ${safeCategory} ${adminAction}
                            </div>
                            <div class="text-[10px] text-gray-400">&bull; ${safeDetail}</div>
                        </td>
                        <td class="p-3 text-right font-bold text-red-500">-${formatCurrency(e.amount)}</td>
                    </tr>`;
            });
            updateExpensesSummary(members.reduce((sum, m) => sum + m.paid, 0)); // Recalculate summary
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

        // --- 1. MEMBER CONFIG (Edit Nama + Tambah/Edit Bayaran + Delete) ---
        
        function toggleMemberConfigModal(show) {
            const modal = document.getElementById('memberConfigModal');
            const content = modal.querySelector('div');
            
            if(show) {
                modal.classList.remove('hidden');
                setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
                
                // Reset Form ke Mode "Tambah Ahli Baru"
                document.getElementById('memberModalTitle').innerHTML = "Tambah Ahli Baru";
                document.getElementById('configMemberId').value = '';
                document.getElementById('configMemberName').value = '';
                
                cancelHistoryEdit(); // Reset kotak hijau
        
                // Sorok elemen admin (delete & history)
                document.getElementById('btnDeleteMember').classList.add('hidden');
                document.getElementById('memberHistorySection').classList.add('hidden');
        
            } else {
                modal.classList.add('opacity-0');
                content.classList.remove('scale-100');
                setTimeout(() => modal.classList.add('hidden'), 300);
            }
        }
        
        // 1. Fungsi Buka Modal (Mode Edit User)
        function editMemberConfig(id) {
            const m = members.find(x => x.id === id);
            if (!m) return;
            
            toggleMemberConfigModal(true);
            
            // Set UI
            document.getElementById('memberModalTitle').innerHTML = "Urus Ahli";
            document.getElementById('configMemberId').value = m.id;
            document.getElementById('configMemberName').value = m.name;
            document.getElementById('btnDeleteMember').classList.remove('hidden');
        
            renderMemberHistoryInModal(m);
        }
        
        // 2. Fungsi Render Sejarah (Dengan butang Edit & Delete)
        function renderMemberHistoryInModal(member) {
            const historySection = document.getElementById('memberHistorySection');
            const container = document.getElementById('memberHistoryListContainer');
            
            if (member.history && member.history.length > 0) {
                historySection.classList.remove('hidden');
                container.innerHTML = '';
                
                member.history.forEach((h, index) => {
                    container.innerHTML += `
                        <div class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 hover:bg-blue-50 transition">
                            <span class="text-gray-600 font-mono">${h.date}</span>
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-emerald-600">RM${h.amount}</span>
                                <button onclick="prepareEditHistoryItem(${member.id}, ${index})" class="text-blue-400 hover:text-blue-600 ml-2 bg-white p-1 rounded border border-blue-100 shadow-sm" title="Edit">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button onclick="deletePaymentHistoryItem(${member.id}, ${index})" class="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-red-100 shadow-sm" title="Padam">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            } else {
                historySection.classList.add('hidden');
            }
        }
        
        // 3. Fungsi Bila Tekan Pensil pada Sejarah (Naikkan data ke Kotak Hijau)
        function prepareEditHistoryItem(memberId, index) {
            const m = members.find(x => x.id === memberId);
            const item = m.history[index];
            
            // Ubah UI Kotak Hijau jadi "Mode Edit"
            document.getElementById('paymentBoxContainer').classList.replace('bg-emerald-50', 'bg-amber-50');
            document.getElementById('paymentBoxContainer').classList.replace('border-emerald-100', 'border-amber-100');
            
            document.getElementById('paymentBoxTitle').innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-600"></i> <span class="text-amber-700">Kemaskini Rekod Ini</span>`;
            document.getElementById('btnCancelHistoryEdit').classList.remove('hidden');
            
            // Masukkan data lama
            document.getElementById('editHistoryIndex').value = index; // Set Index!
            document.getElementById('initPayAmount').value = item.amount;
            
            // Format date dd-mm-yyyy -> yyyy-mm-dd
            const [d, M, y] = item.date.split('-');
            document.getElementById('initPayDate').value = `${y}-${M.padStart(2,'0')}-${d.padStart(2,'0')}`;
            
            // Focus ke input amount
            document.getElementById('initPayAmount').focus();
        }
        
        // 4. Fungsi Batal Edit (Kembali ke Mode Tambah)
        function cancelHistoryEdit() {
            // Reset UI Kotak Hijau ke asal
            document.getElementById('paymentBoxContainer').classList.replace('bg-amber-50', 'bg-emerald-50');
            document.getElementById('paymentBoxContainer').classList.replace('border-amber-100', 'border-emerald-100');
        
            document.getElementById('paymentBoxTitle').innerHTML = `<i class="fa-solid fa-plus-circle"></i> Jumlah Bayaran`;
            document.getElementById('btnCancelHistoryEdit').classList.add('hidden');
            
            // Kosongkan input
            document.getElementById('editHistoryIndex').value = '';
            document.getElementById('initPayAmount').value = '';
            document.getElementById('initPayDate').valueAsDate = new Date();
        }
        
        // --- 5. Fungsi Simpan (Handle Tambah & Update) ---
        async function submitMemberConfig(e) {
            e.preventDefault();
            const id = document.getElementById('configMemberId').value;
            const name = document.getElementById('configMemberName').value;
            
            // Data Pembayaran
            const amountVal = parseFloat(document.getElementById('initPayAmount').value) || 0;
            const dateInput = document.getElementById('initPayDate').value; // Format: yyyy-mm-dd
            const editIndex = document.getElementById('editHistoryIndex').value;
        
            // --- HELPER FUNCTION: FORMAT TARIKH (PENTING!) ---
            // Tukar yyyy-mm-dd -> dd-mm-yyyy (dengan leading zero)
            const formatDate = (isoDateString) => {
                const d = new Date(isoDateString);
                const day = d.getDate().toString().padStart(2, '0');   // Tambah '0' jika < 10
                const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Tambah '0' jika < 10
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
            };
        
            if (id) {
                // --- PROSES UPDATE AHLI SEDIA ADA ---
                const member = members.find(m => m.id == id);
                let currentHistory = [...(member.history || [])];
                
                // 1. Logic Pembayaran
                if (editIndex !== "") {
                    // A. UPDATE SEJARAH LAMA
                    const idx = parseInt(editIndex);
                    if (amountVal > 0) {
                        const dateStr = formatDate(dateInput); // Guna helper function
                        currentHistory[idx] = { date: dateStr, amount: amountVal };
                    }
                } else {
                    // B. TAMBAH BAYARAN BARU
                    if (amountVal > 0) {
                        const dateStr = formatDate(dateInput); // Guna helper function
                        currentHistory.push({ date: dateStr, amount: amountVal });
                    }
                }
        
                // 2. Kira Semula Total Paid
                const newTotalPaid = currentHistory.reduce((sum, h) => sum + parseFloat(h.amount), 0);
        
                // 3. Hantar ke Supabase
                const { error } = await supabaseClient
                    .from('members')
                    .update({ name: name, paid: newTotalPaid, history: currentHistory })
                    .eq('id', id);
                
                if(!error) { 
                    alert("Data berjaya disimpan!");
                    toggleMemberConfigModal(false); 
                    loadDataFromSupabase(); 
                } else {
                    alert("Gagal: " + error.message);
                }
        
            } else {
                // --- PROSES INSERT AHLI BARU ---
                let history = [];
                let paid = 0;
                
                if (amountVal > 0) {
                    const dateStr = formatDate(dateInput); // Guna helper function
                    history.push({ date: dateStr, amount: amountVal });
                    paid = amountVal;
                }
        
                const { error } = await supabaseClient
                    .from('members')
                    .insert([{ name: name, paid: paid, history: history }]);
                    
                if(!error) { 
                    alert(`Ahli ${name} berjaya ditambah!`); 
                    toggleMemberConfigModal(false); 
                    loadDataFromSupabase(); 
                }
            }
        }
        
        // 6. FUNGSI PADAM AHLI (YANG HILANG) ---
        async function deleteMember() {
            const id = document.getElementById('configMemberId').value;
            
            // Safety check
            if(!id) return;
        
            if(!confirm("AMARAN: Adakah anda pasti mahu membuang ahli ini?\nSemua rekod bayaran mereka akan hilang selamanya.")) return;
            
            // Loading indicator
            const btn = document.getElementById('btnDeleteMember');
            const originalText = btn.innerHTML;
            btn.innerText = "Memadam...";
            btn.disabled = true;
        
            const { error } = await supabaseClient
                .from('members')
                .delete()
                .eq('id', id);
        
            if(!error) { 
                alert("Ahli berjaya dipadam."); 
                toggleMemberConfigModal(false); 
                loadDataFromSupabase(); 
            } else {
                alert("Gagal memadam: " + error.message);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
        
        // --- 2. PAYMENT & HISTORY (Full CRUD: Create, Read, Update, Delete) ---
        
        function renderHistoryList(memberId) {
            const m = members.find(x => x.id === memberId);
            const wrapper = document.getElementById('paymentHistoryList');
            const container = document.getElementById('historyListContainer');
            
            if (!m || !m.history || m.history.length === 0) {
                wrapper.classList.add('hidden');
                return;
            }
        
            wrapper.classList.remove('hidden');
            container.innerHTML = '';
        
            // Loop history dan tambah butang Edit & Delete
            m.history.forEach((h, index) => {
                container.innerHTML += `
                    <div class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 hover:bg-blue-50 transition">
                        <span class="text-gray-600 font-mono">${h.date} <span class="text-gray-300">|</span> <span class="font-bold text-emerald-600">RM${h.amount}</span></span>
                        <div class="flex gap-2">
                            <button onclick="prepareEditPayment(${memberId}, ${index})" class="text-blue-400 hover:text-blue-600" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deletePaymentHistoryItem(${memberId}, ${index})" class="text-red-400 hover:text-red-600" title="Padam">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        // --- 3. EXPENSES CRUD (MODE TAMBAH & MODE EDIT TERPISAH) ---
        
        // Fungsi 1: Buka Modal (Dipanggil oleh butang merah FAB)
        function toggleExpenseModal(show) {
            const modal = document.getElementById('expenseModal');
            const content = modal.querySelector('div');
            
            if(show) {
                modal.classList.remove('hidden');
                setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
                
                // --- MODE TAMBAH (Reset Semula) ---
                document.getElementById('expenseModalTitle').innerText = "Tambah Perbelanjaan";
                document.getElementById('btnExpSubmit').innerText = "Simpan";
                document.getElementById('btnDeleteExp').classList.add('hidden'); // Sorok butang delete
                
                // Kosongkan form
                document.getElementById('expId').value = '';
                document.getElementById('expDate').valueAsDate = new Date(); // Reset ke hari ini
                document.getElementById('expDetail').value = '';
                document.getElementById('expAmount').value = '';
                // Reset dropdown ke default (optional)
                document.getElementById('expCategory').selectedIndex = 0;
        
            } else {
                modal.classList.add('opacity-0');
                content.classList.remove('scale-100');
                setTimeout(() => { modal.classList.add('hidden'); }, 300);
            }
        }
        
        // Fungsi 2: Mode Edit (Dipanggil oleh ikon pensil pada list)
        function editExpense(id) {
            const e = expenses.find(x => x.id === id);
            if (!e) return;
        
            // Buka modal secara manual (tanpa reset)
            const modal = document.getElementById('expenseModal');
            const content = modal.querySelector('div');
            modal.classList.remove('hidden');
            setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
        
            // --- MODE EDIT (Isi Data Lama) ---
            document.getElementById('expenseModalTitle').innerText = "Kemaskini Perbelanjaan";
            document.getElementById('btnExpSubmit').innerText = "Simpan";
            
            document.getElementById('expId').value = e.id;
            
            // Format Tarikh (dd-mm-yyyy -> yyyy-mm-dd)
            const [day, month, year] = e.date.split('-');
            const fmtMonth = month.length < 2 ? '0' + month : month;
            const fmtDay = day.length < 2 ? '0' + day : day;
            document.getElementById('expDate').value = `${year}-${fmtMonth}-${fmtDay}`;
        
            document.getElementById('expCategory').value = e.category;
            document.getElementById('expDetail').value = e.detail;
            document.getElementById('expAmount').value = e.amount;
            
            document.getElementById('btnDeleteExp').classList.remove('hidden'); // Tunjuk butang delete!
        }
        
        // --- Fungsi Submit Expense (Dengan Format Tarikh Betul) ---
        async function submitExpense(e) {
            e.preventDefault();
            const id = document.getElementById('expId').value;
            const dateInput = document.getElementById('expDate').value; // yyyy-mm-dd
            const category = document.getElementById('expCategory').value;
            const detail = document.getElementById('expDetail').value;
            const amount = parseFloat(document.getElementById('expAmount').value);
        
            // --- FORMAT TARIKH (DIBETULKAN) ---
            // Tukar yyyy-mm-dd -> dd-mm-yyyy (dengan 0 di depan)
            const d = new Date(dateInput);
            const day = d.getDate().toString().padStart(2, '0');   // 2 -> 02
            const month = (d.getMonth() + 1).toString().padStart(2, '0'); // 1 -> 01
            const year = d.getFullYear();
            
            const dateStr = `${day}-${month}-${year}`;
        
            const payload = { date: dateStr, category, detail, amount };
        
            if (id) {
                // --- UPDATE (Sebab ada ID) ---
                const { error } = await supabaseClient.from('expenses').update(payload).eq('id', id);
                if(!error) { 
                    alert("Belanja dikemaskini!"); 
                    toggleExpenseModal(false); 
                    loadDataFromSupabase(); 
                } else {
                    alert("Gagal update: " + error.message);
                }
            } else {
                // --- INSERT (Sebab tiada ID) ---
                const { error } = await supabaseClient.from('expenses').insert([payload]);
                if(!error) { 
                    alert("Belanja direkod!"); 
                    toggleExpenseModal(false); 
                    loadDataFromSupabase(); 
                } else {
                    alert("Gagal simpan: " + error.message);
                }
            }
        }
        
        async function deleteExpense() {
            const id = document.getElementById('expId').value;
            if(!confirm("Padam rekod belanja ini?")) return;
            
            const { error } = await supabaseClient.from('expenses').delete().eq('id', id);
            if(!error) { alert("Padam berjaya!"); toggleExpenseModal(false); loadDataFromSupabase(); }
        }

        // --- AUTO LOGOUT (AFK 5 MINIT) ---
        
        let afkTimer;
        const AFK_LIMIT = 5 * 60 * 1000; // 5 Minit dalam milisaat
        
        function startAutoLogoutTimer() {
            // Senarai aktiviti yang akan reset timer
            window.onload = resetAfkTimer;
            document.onmousemove = resetAfkTimer;
            document.onkeypress = resetAfkTimer;
            document.ontouchstart = resetAfkTimer; // Untuk mobile (penting!)
            document.onclick = resetAfkTimer;
            document.onscroll = resetAfkTimer;
        
            resetAfkTimer(); // Mula kira
        }
        
        function stopAutoLogoutTimer() {
            clearTimeout(afkTimer);
        }
        
        function resetAfkTimer() {
            // Hanya jalankan timer kalau user adalah Admin
            if (!isAdmin) return;
        
            clearTimeout(afkTimer);
            
            afkTimer = setTimeout(async () => {
                console.log("Auto-logout triggered due to inactivity.");
                
                // Panggil fungsi logout sedia ada
                await handleLogout();
                
                // Ubah mesej modal success supaya user tahu kenapa dia logout
                const modal = document.getElementById('logoutSuccessModal');
                const title = modal.querySelector('h3');
                const desc = modal.querySelector('p');
                
                if(title) title.innerText = "Sesi Tamat";
                if(desc) desc.innerText = "Anda telah dilog keluar automatik kerana tidak aktif selama 5 minit.";
        
            }, AFK_LIMIT);
        }
