        const SUPABASE_URL = 'https://twbmjojqyhmjsoywiqrs.supabase.co'; 
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Ym1qb2pxeWhtanNveXdpcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzUyODUsImV4cCI6MjA4MDUxMTI4NX0._Q3peI3s04DuBHyHE3qUl-OzcagrbpWdP2-QIid3agY';
        
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        let isAdmin = false;
        
        async function loadDataFromSupabase() {
            
            console.log("Sedang menarik data dari Supabase...");
        
            try {
                let { data: membersData, error: errorMembers } = await supabaseClient
                    .from('members')
                    .select('*')
                    .order('id', { ascending: true });
        
                if (errorMembers) throw errorMembers;
        
                let { data: expensesData, error: errorExpenses } = await supabaseClient
                    .from('expenses')
                    .select('*');
        
                if (errorExpenses) throw errorExpenses;
        
                if (membersData) members = membersData;
                if (expensesData) expenses = expensesData;
        
                renderTable();
                renderExpenses();
                
                console.log("Data berjaya dikemaskini!");
        
            } catch (error) {
                console.error("Gagal tarik data:", error.message);
                alert("Maaf, ada masalah sambungan ke database.");
            }
        }
        

        document.addEventListener('DOMContentLoaded', async () => {
            
            startImageSlider();
            initChecklist();
        
            await loadDataFromSupabase(); 
        
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                isAdmin = true;
                updateAdminUI();
                startAutoLogoutTimer(); 
            }
            
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
        
        function openLogoutSuccessModal() {
            const modal = document.getElementById('logoutSuccessModal');
            const content = modal.querySelector('div'); 
            
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
                    }, 10);
                
                    setTimeout(() => closeLogoutSuccessModal(), 3000);
                }
        
        function closeLogoutSuccessModal() {
            const modal = document.getElementById('logoutSuccessModal');
            const content = modal.querySelector('div');
            
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
        
        function openLoginSuccessModal() {
            const modal = document.getElementById('loginSuccessModal');
            const content = modal.querySelector('div');
        
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
        
            setTimeout(() => closeLoginSuccessModal(), 3000);
        }
        
        function closeLoginSuccessModal() {
            const modal = document.getElementById('loginSuccessModal');
            const content = modal.querySelector('div');
        
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
        

        async function handleLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            const btn = document.getElementById('btnLoginSubmit');
            const errorMsg = document.getElementById('loginErrorMsg');
        
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
            btn.disabled = true;
            errorMsg.classList.add('hidden');
        
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
                isAdmin = true;
                closeLoginModal();
            
                openLoginSuccessModal();
            
                updateAdminUI();
                startAutoLogoutTimer();
                btn.innerHTML = 'Log Masuk <i class="fa-solid fa-arrow-right"></i>';
                btn.disabled = false;
                
                document.getElementById('adminEmail').value = '';
                document.getElementById('adminPassword').value = '';
            }
        }
        
        async function handleLogout() {
            const { error } = await supabaseClient.auth.signOut();
            

            isAdmin = false;
            stopAutoLogoutTimer();
            
            closeLogoutModal(); 
            updateAdminUI();
            const modal = document.getElementById('logoutSuccessModal');
            if (modal) {
                const title = modal.querySelector('h3');
                const desc = modal.querySelector('p');
                if(title) title.innerText = "Berjaya Log Keluar!";
                if(desc) desc.innerText = "Sesi anda telah ditamatkan";
            }
            
            openLogoutSuccessModal(); 
            
            if (error) console.warn("Logout server response:", error.message);
        }
        
        function updateAdminUI() {
            const dot = document.getElementById('loginStatusDot');
            const fab = document.getElementById('adminFab');
        
            if (isAdmin) {
                if(dot) dot.classList.remove('hidden'); 
                if(fab) fab.classList.remove('hidden'); 
                if(fab) fab.classList.add('flex');
                console.log("Admin Mode: ON");
            } else {
                if(dot) dot.classList.add('hidden'); 
                if(fab) fab.classList.add('hidden'); 
                if(fab) fab.classList.remove('flex');
                console.log("Admin Mode: OFF");
            }
        
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
        
        const sliderImages = [{ url: "images/candat1.jpg"}, { url: "images/candat2.jpg"}, { url: "images/candat3.jpg"}, { url: "images/candat4.jpg"}, { url: "images/candat5.jpg"}];
        let currentImageIndex = 0;
        let slideInterval;
        
        let members = []; 
        let expenses = [];

        function parseMYDate(dateStr) {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        function getRemainingTime() {
            const now = new Date();
            const diff = DEADLINE - now;
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            return { expired: diff <= 0, totalDays: days };
        }

        let currentCalDate = new Date(); 
        
        function openCalendarModal() {
            const modal = document.getElementById('calendarModal');
            const content = document.getElementById('calendarModalContent');
            
            currentCalDate = new Date();
            renderCalendar();
            
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
            if (images.length === 0) return;
        
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
        
            const targetDisplay = document.getElementById('totalTargetDisplay');
            if (targetDisplay) {
                targetDisplay.innerText = formatCurrency(FIXED_TARGET);
            }
        
            const sortedMembers = [...members].sort((a,b) => b.paid - a.paid);
            let totalCollected = 0;
            
            sortedMembers.forEach(m => {
                totalCollected += parseFloat(m.paid); // Pastikan nombor
                
                const pct = Math.min(100, (m.paid / TARGET_PER_PERSON) * 100);
                const safeName = escapeHtml(m.name);
                
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
        
            document.getElementById('tableSummaryCollected').innerText = formatCurrency(totalCollected);
        
            const globalPct = Math.min(100, (totalCollected / FIXED_TARGET) * 100);
            
            const progressBar = document.getElementById('tableSummaryProgress');
            if(progressBar) progressBar.style.width = globalPct + '%';
            
            const pctText = document.getElementById('summaryPercentage');
            if(pctText) pctText.innerText = Math.round(globalPct) + '%';

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
            let totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
            let netBalance = totalCollected - totalExpenses;

            const collectedEl = document.getElementById('summaryCollected');
            if (collectedEl) collectedEl.innerText = formatCurrency(totalCollected);

            const expEl = document.getElementById('summaryExpenses');
            if (expEl) expEl.innerText = formatCurrency(totalExpenses);

            const netEl = document.getElementById('summaryNetBalance');
            if (netEl) {
                netEl.innerText = formatCurrency(netBalance);
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


        function toggleMemberConfigModal(show) {
            const modal = document.getElementById('memberConfigModal');
            const content = modal.querySelector('div');
            
            if(show) {
                modal.classList.remove('hidden');
                setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
                
                document.getElementById('memberModalTitle').innerHTML = "Tambah Ahli";
                
                document.getElementById('btnSaveMember').innerHTML = '<i class="fa-solid fa-user-plus"></i> Tambah'; 
                
                document.getElementById('configMemberId').value = '';
                document.getElementById('configMemberName').value = '';
                
                cancelHistoryEdit(); // Reset kotak hijau
        
                document.getElementById('btnDeleteMember').classList.add('hidden');
                document.getElementById('memberHistorySection').classList.add('hidden');
        
            } else {
                modal.classList.add('opacity-0');
                content.classList.remove('scale-100');
                setTimeout(() => modal.classList.add('hidden'), 300);
            }
        }
        
        function editMemberConfig(id) {
            const m = members.find(x => x.id === id);
            if (!m) return;
            
            toggleMemberConfigModal(true);
            
            document.getElementById('memberModalTitle').innerHTML = "Urus Ahli";
            
            document.getElementById('btnSaveMember').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kemaskini';
            
            document.getElementById('configMemberId').value = m.id;
            document.getElementById('configMemberName').value = m.name;
            document.getElementById('btnDeleteMember').classList.remove('hidden');
        
            renderMemberHistoryInModal(m);
        }
        
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
        
        function prepareEditHistoryItem(memberId, index) {
            const m = members.find(x => x.id === memberId);
            const item = m.history[index];
            
            document.getElementById('paymentBoxContainer').classList.replace('bg-emerald-50', 'bg-amber-50');
            document.getElementById('paymentBoxContainer').classList.replace('border-emerald-100', 'border-amber-100');
            
            document.getElementById('paymentBoxTitle').innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-600"></i> <span class="text-amber-700">Kemaskini Rekod Ini</span>`;
            document.getElementById('btnCancelHistoryEdit').classList.remove('hidden');
            
            document.getElementById('editHistoryIndex').value = index; // Set Index!
            document.getElementById('initPayAmount').value = item.amount;
            
            const [d, M, y] = item.date.split('-');
            document.getElementById('initPayDate').value = `${y}-${M.padStart(2,'0')}-${d.padStart(2,'0')}`;
            
            document.getElementById('initPayAmount').focus();
        }
        
        function cancelHistoryEdit() {
            document.getElementById('paymentBoxContainer').classList.replace('bg-amber-50', 'bg-emerald-50');
            document.getElementById('paymentBoxContainer').classList.replace('border-amber-100', 'border-emerald-100');
        
            document.getElementById('paymentBoxTitle').innerHTML = `<i class="fa-solid fa-plus-circle"></i> Jumlah Bayaran`;
            document.getElementById('btnCancelHistoryEdit').classList.add('hidden');
            
            document.getElementById('editHistoryIndex').value = '';
            document.getElementById('initPayAmount').value = '';
            document.getElementById('initPayDate').valueAsDate = new Date();
        }
        
        async function submitMemberConfig(e) {
            e.preventDefault();
            const id = document.getElementById('configMemberId').value;
            const name = document.getElementById('configMemberName').value;
            
            const amountVal = parseFloat(document.getElementById('initPayAmount').value) || 0;
            const dateInput = document.getElementById('initPayDate').value; // Format: yyyy-mm-dd
            const editIndex = document.getElementById('editHistoryIndex').value;
        
            const formatDate = (isoDateString) => {
                const d = new Date(isoDateString);
                const day = d.getDate().toString().padStart(2, '0');   // Tambah '0' jika < 10
                const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Tambah '0' jika < 10
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
            };
        
            if (id) {
                const member = members.find(m => m.id == id);
                let currentHistory = [...(member.history || [])];
                
                if (editIndex !== "") {
                    const idx = parseInt(editIndex);
                    if (amountVal > 0) {
                        const dateStr = formatDate(dateInput); 
                        currentHistory[idx] = { date: dateStr, amount: amountVal };
                    }
                } else {
                    if (amountVal > 0) {
                        const dateStr = formatDate(dateInput); 
                        currentHistory.push({ date: dateStr, amount: amountVal });
                    }
                }
        
                const newTotalPaid = currentHistory.reduce((sum, h) => sum + parseFloat(h.amount), 0);
        
                const { error } = await supabaseClient
                    .from('members')
                    .update({ name: name, paid: newTotalPaid, history: currentHistory })
                    .eq('id', id);
                
                if(!error) { 
                    showSuccessModal("Disimpan!", "Data ahli & bayaran berjaya dikemaskini");
                    
                    toggleMemberConfigModal(false); 
                    loadDataFromSupabase(); 
                } else {
                    alert("Gagal: " + error.message);
                }
        
            } else {
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
                    showSuccessModal("Selesai", "Ahli telah berjaya ditambah");
                    
                    toggleMemberConfigModal(false);
                    loadDataFromSupabase(); 
                }
            }
        }
        
        async function deleteMember() {
            const id = document.getElementById('configMemberId').value;
        
            if(!id) return;
        
            showConfirmationModal(
                "Adakah anda pasti mahu memadam ahli ini?",
                async () => {

                    const { error } = await supabaseClient
                        .from('members')
                        .delete()
                        .eq('id', id);
        
                    if(!error) {
                        toggleMemberConfigModal(false);
                        
                        showSuccessModal("Berjaya", "Ahli telah dipadam");
                        
                        loadDataFromSupabase();
                    } else {
                        alert("Gagal memadam: " + error.message);
                    }
                }
            );
        }
        

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
        

        function toggleExpenseModal(show) {
            const modal = document.getElementById('expenseModal');
            const content = modal.querySelector('div');
            
            if(show) {
                modal.classList.remove('hidden');
                setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
                
                document.getElementById('expenseModalTitle').innerText = "Tambah Perbelanjaan";
                document.getElementById('btnExpSubmit').innerHTML = '<i class="fa-solid fa-cart-plus"></i> Tambah';
                document.getElementById('btnDeleteExp').classList.add('hidden');
                
                document.getElementById('expId').value = '';
                document.getElementById('expDate').valueAsDate = new Date();
                document.getElementById('expDetail').value = '';
                document.getElementById('expAmount').value = '';
                document.getElementById('expCategory').selectedIndex = 0;
        
            } else {
                modal.classList.add('opacity-0');
                content.classList.remove('scale-100');
                setTimeout(() => { modal.classList.add('hidden'); }, 300);
            }
        }
        
        function editExpense(id) {
            const e = expenses.find(x => x.id === id);
            if (!e) return;
        
            const modal = document.getElementById('expenseModal');
            const content = modal.querySelector('div');
            modal.classList.remove('hidden');
            setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
        
            document.getElementById('expenseModalTitle').innerText = "Kemaskini Perbelanjaan";
            document.getElementById('btnExpSubmit').innerText = "Kemaskini";
            
            document.getElementById('expId').value = e.id;
            
            const [day, month, year] = e.date.split('-');
            const fmtMonth = month.length < 2 ? '0' + month : month;
            const fmtDay = day.length < 2 ? '0' + day : day;
            document.getElementById('expDate').value = `${year}-${fmtMonth}-${fmtDay}`;
        
            document.getElementById('expCategory').value = e.category;
            document.getElementById('expDetail').value = e.detail;
            document.getElementById('expAmount').value = e.amount;
            
            document.getElementById('btnDeleteExp').classList.remove('hidden'); // Tunjuk butang delete!
        }
        
        async function submitExpense(e) {
            e.preventDefault();
            const id = document.getElementById('expId').value;
            const dateInput = document.getElementById('expDate').value; // yyyy-mm-dd
            const category = document.getElementById('expCategory').value;
            const detail = document.getElementById('expDetail').value;
            const amount = parseFloat(document.getElementById('expAmount').value);
        
            const d = new Date(dateInput);
            const day = d.getDate().toString().padStart(2, '0');   // 2 -> 02
            const month = (d.getMonth() + 1).toString().padStart(2, '0'); // 1 -> 01
            const year = d.getFullYear();
            
            const dateStr = `${day}-${month}-${year}`;
        
            const payload = { date: dateStr, category, detail, amount };
        
            if (id) {
                const { error } = await supabaseClient.from('expenses').update(payload).eq('id', id);
                if(!error) { 
                    showSuccessModal("Direkod!", "Perbelanjaan berjaya dikemaskini");
                    
                    toggleExpenseModal(false); 
                    loadDataFromSupabase(); 
                } else {
                    alert("Gagal update: " + error.message);
                }
            } else {
                const { error } = await supabaseClient.from('expenses').insert([payload]);
                if(!error) { 
                    showSuccessModal("Berjaya!", "Perbelanjaan berjaya ditambah");
                    
                    toggleExpenseModal(false); 
                    loadDataFromSupabase(); 
                } else {
                    alert("Gagal simpan: " + error.message);
                }
            }
        }
        
        function deleteExpense() {
            const id = document.getElementById('expId').value;
            
            if (!id) {
                console.log("Tiada ID untuk dipadam.");
                return;
            }
        
            showConfirmationModal(
                "Adakah anda pasti mahu memadam rekod perbelanjaan ini?", 
                async () => {
                    const { error } = await supabaseClient
                        .from('expenses')
                        .delete()
                        .eq('id', id);
        
                    if(!error) { 
                        showSuccessModal("Berjaya!", "Rekod telah dipadam");
                        toggleExpenseModal(false); 
                        loadDataFromSupabase(); 
                    } else {
                        alert("Gagal memadam: " + error.message);
                    }
                }
            );
        }

        let afkTimer;
        const AFK_LIMIT = 5 * 60 * 1000; 
        
        function startAutoLogoutTimer() {
            window.onload = resetAfkTimer;
            document.onmousemove = resetAfkTimer;
            document.onkeypress = resetAfkTimer;
            document.ontouchstart = resetAfkTimer; 
            document.onclick = resetAfkTimer;
            document.onscroll = resetAfkTimer;
        
            resetAfkTimer(); 
        }
        
        function stopAutoLogoutTimer() {
            clearTimeout(afkTimer);
        }
        
        function resetAfkTimer() {
            if (!isAdmin) return;
        
            clearTimeout(afkTimer);
            
            afkTimer = setTimeout(async () => {
                console.log("Auto-logout triggered due to inactivity.");
                
                await handleLogout();
                
                const modal = document.getElementById('logoutSuccessModal');
                const title = modal.querySelector('h3');
                const desc = modal.querySelector('p');
                
                if(title) title.innerText = "Sesi Tamat";
                if(desc) desc.innerText = "Anda telah dilog keluar kerana tidak aktif";
        
            }, AFK_LIMIT);
        }

        function showSuccessModal(title, message) {
            const modal = document.getElementById('genericSuccessModal');
            const content = modal.querySelector('div');
            
            document.getElementById('genSuccessTitle').innerText = title;
            document.getElementById('genSuccessDesc').innerText = message;
        
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
            
            setTimeout(() => closeGenericSuccessModal(), 2000);
        }
        
        function closeGenericSuccessModal() {
            const modal = document.getElementById('genericSuccessModal');
            const content = modal.querySelector('div');
            
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }


        let pendingAction = null;
        
        function showConfirmationModal(message, actionCallback) {
            const modal = document.getElementById('confirmationModal');
            const content = modal.querySelector('div');
            
            document.getElementById('confirmMessage').innerText = message;
            
            pendingAction = actionCallback;
        
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
        }
        
        function closeConfirmationModal() {
            const modal = document.getElementById('confirmationModal');
            const content = modal.querySelector('div');
            
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => { 
                modal.classList.add('hidden'); 
                pendingAction = null;
            }, 300);
        }
        
        async function executeConfirmAction() {
            if (pendingAction) {
                await pendingAction();
            }
            closeConfirmationModal();
        }

        function deletePaymentHistoryItem(memberId, index) {
            showConfirmationModal(
                "Adakah anda pasti mahu memadam rekod bayaran ini?",
                async () => {

                    const m = members.find(x => x.id === memberId);
                    if (!m) return;
        
                    let currentHistory = [...m.history];
                    const amountToRemove = parseFloat(currentHistory[index].amount);
        
                    currentHistory.splice(index, 1);
        
                    const newPaid = parseFloat(m.paid) - amountToRemove;
        
                    const { error } = await supabaseClient
                        .from('members')
                        .update({ paid: newPaid, history: currentHistory })
                        .eq('id', memberId);
        
                    if (!error) {
                        showSuccessModal("Berjaya", "Rekod bayaran dipadam.");
        
                        await loadDataFromSupabase(); 
        
                        const updatedMember = members.find(x => x.id === memberId);
                        if (updatedMember) {
                            renderMemberHistoryInModal(updatedMember);
                            
                            cancelHistoryEdit(); 
                        }
        
                    } else {
                        alert("Gagal: " + error.message);
                    }
                }
            );
        }
