const SUPABASE_URL = 'https://twbmjojqyhmjsoywiqrs.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Ym1qb2pxeWhtanNveXdpcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzUyODUsImV4cCI6MjA4MDUxMTI4NX0._Q3peI3s04DuBHyHE3qUl-OzcagrbpWdP2-QIid3agY';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isAdmin = false;

// --- CONFIG TARIKH & TARGET ---
const DEFAULT_TARGET = 500;       
const SPECIAL_TARGET = 250;       
const SPECIAL_MEMBER = 'Rosddi';  
const FIXED_TARGET = 4750;        
const DEADLINE = new Date('2027-06-05'); 

// --- STATE MANAGEMENT ---
let members = []; 
let expenses = [];
let tentativeList = [];
let checklistList = [];
let showTentativeWarning = true;

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

        let { data: tentativeData, error: errorTentative } = await supabaseClient
            .from('tentative')
            .select('*')
            .order('sort_order', { ascending: true });

        if (errorTentative) throw errorTentative;

        let { data: settingsData, error: errorSettings } = await supabaseClient
            .from('app_settings')
            .select('*');

        if (settingsData) {
            let warningSetting = settingsData.find(s => s.setting_key === 'show_tentative_warning');
            if (warningSetting) showTentativeWarning = warningSetting.setting_value === 'true';
        }

        let { data: checklistData, error: errorChecklist } = await supabaseClient
            .from('checklist')
            .select('*')
            .order('sort_order', { ascending: true });

        if (errorChecklist) throw errorChecklist;

        if (membersData) members = membersData;
        if (expensesData) expenses = expensesData;
        if (tentativeData) tentativeList = tentativeData;
        if (checklistData) checklistList = checklistData;

        renderTable();
        renderExpenses();
        renderTentative();
        renderTentativeWarning();
        renderChecklist();
        
        console.log("Data berjaya dikemaskini!");

    } catch (error) {
        console.error("Gagal tarik data:", error.message);
        showDatabaseErrorModal(); 
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromSupabase(); 

    supabaseClient.auth.onAuthStateChange((event, session) => {
        isAdmin = !!session; 
        updateAdminUI();
        
        if (isAdmin) {
            startAutoLogoutTimer(); 
        } else {
            stopAutoLogoutTimer();
        }
    });

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

    const MAX_ATTEMPTS = 3;
    const BLOCK_DURATION = 60 * 1000; 

    const blockUntil = localStorage.getItem('loginBlockUntil');
    if (blockUntil) {
        const timeLeft = parseInt(blockUntil) - Date.now();
        if (timeLeft > 0) {
            const secondsLeft = Math.ceil(timeLeft / 1000);
            errorMsg.innerHTML = `<i class="fa-solid fa-hand"></i> Sila tunggu ${secondsLeft} saat lagi.`;
            errorMsg.classList.remove('hidden');
            errorMsg.classList.replace('text-red-500', 'text-orange-600'); 
            errorMsg.classList.replace('bg-red-50', 'bg-orange-50');
            return; 
        } else {
            localStorage.removeItem('loginBlockUntil');
            localStorage.removeItem('loginAttempts');
        }
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;
    errorMsg.classList.add('hidden');
    errorMsg.classList.replace('text-orange-600', 'text-red-500');
    errorMsg.classList.replace('bg-orange-50', 'bg-red-50');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Login Error:", error);
        
        let attempts = parseInt(localStorage.getItem('loginAttempts') || '0') + 1;
        localStorage.setItem('loginAttempts', attempts);

        let msg = "Email atau password salah.";

        if (attempts >= MAX_ATTEMPTS) {
            const releaseTime = Date.now() + BLOCK_DURATION;
            localStorage.setItem('loginBlockUntil', releaseTime);
            msg = `Terlalu banyak percubaan! <br>Sila tunggu 1 minit.`;
        } else {
            const left = MAX_ATTEMPTS - attempts;
            msg = `Salah. Tinggal <b>${left}</b> kali percubaan lagi.`;
        }

        btn.innerHTML = 'Log Masuk <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled = false;
        errorMsg.innerHTML = msg;
        errorMsg.classList.remove('hidden');

    } else {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginBlockUntil');

        closeLoginModal();
        openLoginSuccessModal();
        
        btn.innerHTML = 'Log Masuk <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled = false;
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPassword').value = '';
    }
}

async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    
    closeLogoutModal(); 
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
    const btnWarning = document.getElementById('btnToggleWarning');

    if (isAdmin) {
        if(dot) dot.classList.remove('hidden'); 
        if(fab) fab.classList.remove('hidden'); 
        if(fab) fab.classList.add('flex');
        if(btnWarning) btnWarning.classList.remove('hidden');
    } else {
        if(dot) dot.classList.add('hidden'); 
        if(fab) fab.classList.add('hidden'); 
        if(fab) fab.classList.remove('flex');
        if(btnWarning) btnWarning.classList.add('hidden');
    }

    renderTable();     
    renderExpenses();  
    renderTentative();
    renderTentativeWarning();
    renderChecklist();
}

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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
        const isTripDay = (year === 2027 && month === 5 && (day === 5 || day === 6 || day === 7));
        
        if (isTripDay) {
            cellClass += " bg-emerald-500 text-white shadow-lg shadow-emerald-200 font-bold scale-110";
            if(day === 6) cellClass += " animate-bounce";
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

function formatCurrency(num) { 
    const val = parseFloat(num); 
    const isWhole = Number.isInteger(val);

    return val.toLocaleString('ms-MY', { 
        style: 'currency', 
        currency: 'MYR',
        minimumFractionDigits: isWhole ? 0 : 2,
        maximumFractionDigits: isWhole ? 0 : 2
    }); 
}

function renderTable() {
    const tbody = document.getElementById('memberTableBody');

    const targetDisplay = document.getElementById('totalTargetDisplay');
    if (targetDisplay) {
        targetDisplay.innerText = formatCurrency(FIXED_TARGET);
    }

    const sortedMembers = [...members].sort((a,b) => b.paid - a.paid);
    let totalCollected = 0;
    
    let htmlContent = ''; 
    
    sortedMembers.forEach(m => {
        totalCollected += parseFloat(m.paid);
        
        let sumbanganTotal = 0;
        let tambahanTotal = 0;
        let asasTotal = 0;

        if (m.history && m.history.length > 0) {
            m.history.forEach(h => {
                const amt = parseFloat(h.amount);
                if (h.type === 'Sumbangan') sumbanganTotal += amt;
                else if (h.type === 'Bayaran Tambahan') tambahanTotal += amt;
                else asasTotal += amt; 
            });
        } else {
            asasTotal = parseFloat(m.paid); 
        }

        let memberTarget = (m.name.toLowerCase() === SPECIAL_MEMBER.toLowerCase()) ? SPECIAL_TARGET : DEFAULT_TARGET;

        const barPct = Math.min(100, (asasTotal / memberTarget) * 100);
        let textPeratus = Math.round((asasTotal / memberTarget) * 100) + '%';
        
        let lencanaTambahan = '';
        
        if (sumbanganTotal > 0) {
            lencanaTambahan += `<div class="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded mt-1 border border-blue-200 inline-block mr-1"><i class="fa-solid fa-hand-holding-heart mr-1"></i>+${formatCurrency(sumbanganTotal)} Sumbangan</div>`;
        }
        if (tambahanTotal > 0) {
            lencanaTambahan += `<div class="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded mt-1 border border-purple-200 inline-block"><i class="fa-solid fa-boxes-packing mr-1"></i>+${formatCurrency(tambahanTotal)} Tambahan</div>`;
        }

        const safeName = escapeHtml(m.name);
        
        let adminBtn = '';
        if (isAdmin) {
            adminBtn = `<i onclick="editMemberConfig(${m.id})" class="fa-solid fa-pen-to-square text-[10px] ml-2 text-gray-300 hover:text-blue-500 cursor-pointer" title="Urus Ahli"></i>`;
        }

        htmlContent += `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-3 font-bold text-gray-700 flex items-center">
                    ${safeName} ${adminBtn}
                </td>
                <td class="p-3 text-center">
                    <div class="w-16 mx-auto bg-gray-200 rounded-full h-1">
                        <div class="bg-emerald-500 h-1 rounded-full" style="width:${barPct}%"></div>
                    </div>
                    <div class="text-[10px] text-gray-400 mt-0.5">${textPeratus}</div>
                    <div class="text-left mt-1">${lencanaTambahan}</div>
                </td>
                <td class="p-3 text-center font-mono text-emerald-600 font-bold">${formatCurrency(m.paid)}</td>
                <td class="p-3 text-center">
                    <button onclick="openDetails(${m.id})" class="mt-1 inline-flex items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-700 transition group">
                        <i class="fa-solid fa-receipt text-lg group-hover:scale-110 transition-transform"></i>
                        <span class="text-[9px] font-medium underline decoration-dotted">Lihat</span>
                    </button>
                </td>
            </tr>`;
    });

    tbody.innerHTML = htmlContent;

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
    
    lockScroll();
    
    const tbody = document.getElementById('detailsTableBody');
    tbody.innerHTML = '';

    const sortedHistory = [...m.history].sort((a, b) => {
        return parseMYDate(b.date) - parseMYDate(a.date); 
    });

    sortedHistory.forEach(h => { 
        const safeDateHistory = escapeHtml(h.date); 
        const displayType = h.type ? `<span class="text-[9px] block text-gray-400 mt-0.5">${escapeHtml(h.type)}</span>` : '';
    
        tbody.innerHTML += `
            <tr class="border-b border-dashed border-gray-100">
                <td class="py-2">
                    ${safeDateHistory}
                    ${displayType}
                </td> 
                <td class="text-right py-2">${formatCurrency(h.amount)}</td> 
            </tr>`; 
    });

    document.getElementById('detailTotal').innerText = formatCurrency(m.paid);
    document.getElementById('detailsModal').classList.remove('hidden');
}

function closeDetailsModal() { 
    unlockScroll(); 
    document.getElementById('detailsModal').classList.add('hidden'); 
}

function renderExpenses() {
    const tbody = document.getElementById('expensesTableBody');

    document.getElementById('noExpensesMsg').className = expenses.length === 0 ? "p-6 text-center text-gray-400 text-sm" : "hidden";

    const sortedExpenses = [...expenses].sort((a,b) => parseMYDate(b.date) - parseMYDate(a.date));

    let htmlContent = '';

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

        let receiptIcon = '';

        if (e.receipt_url && e.receipt_url.trim() !== "") {
            receiptIcon = `
                <div onclick="viewReceipt('${e.receipt_url}')" class="mt-1 inline-flex items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-700 transition group">
                    <i class="fa-solid fa-receipt text-lg group-hover:scale-110 transition-transform"></i>
                    <span class="text-[9px] font-medium underline decoration-dotted">Lihat</span>
                </div>
            `;
        } else {
            receiptIcon = `
                <div onclick="showNoReceiptModal()" class="mt-1 inline-flex items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-700 transition group">
                    <i class="fa-solid fa-receipt text-lg group-hover:scale-110 transition-transform"></i>
                    <span class="text-[9px] font-medium underline decoration-dotted">Lihat</span>
                </div>
            `;
        }
        htmlContent += `
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
                <td class="p-3 text-right align-top">
                    <div class="font-bold text-red-500">-${formatCurrency(e.amount)}</div>
                    
                    ${receiptIcon}
                </td>
            </tr>`;
    });
    
    tbody.innerHTML = htmlContent;

    updateExpensesSummary(members.reduce((sum, m) => sum + m.paid, 0)); 
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

function toggleTentative(element) {
    const content = element.nextElementSibling || element.parentElement.querySelector('.tentative-body');
    const icon = element.querySelector('.fa-chevron-down');

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
    } else {
        content.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
    }
}

function renderTentative() {
    const container = document.getElementById('tentativeContainer');
    
    if (tentativeList.length === 0) {
        if (container) container.innerHTML = '<div class="text-center text-xs text-gray-400 py-4">Tiada rekod tentatif lagi.</div>';
        return;
    }

    let htmlContent = '';
    
    tentativeList.forEach(item => {
        const detailsArray = item.details ? item.details.split('\n') : [];
        let detailsHtml = '';
        detailsArray.forEach(d => {
            if (d.trim() !== '') detailsHtml += `<p class="text-xs text-gray-500">${escapeHtml(d)}</p>`;
        });

        let adminBtn = '';
        if (isAdmin) {
            adminBtn = `<button onclick="editTentative(${item.id})" class="ml-2 text-gray-300 hover:text-indigo-500 transition"><i class="fa-solid fa-pen-to-square"></i></button>`;
        }

        htmlContent += `
        <div class="flex gap-4 items-start relative mb-6">
            <div class="bg-${item.color_theme}-100 text-${item.color_theme}-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm">
                <i class="fa-solid ${item.icon || 'fa-clock'} text-xs"></i>
            </div>
        
            <div class="flex-1">
                <div class="cursor-pointer group select-none">
                    <span class="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase tracking-wide">
                        ${escapeHtml(item.time_label)} ${adminBtn}
                    </span>
                    
                    <div class="flex justify-between items-center" onclick="toggleTentative(this)">
                        <h4 class="font-bold text-sm text-gray-800 group-hover:text-${item.color_theme}-600 transition">${escapeHtml(item.title)}</h4>
                        <i class="fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-300"></i>
                    </div>
                    
                    <div class="tentative-body hidden mt-2 space-y-1">
                        ${detailsHtml}
                    </div>
                </div>
            </div>
        </div>`;
    });

    if (container) container.innerHTML = htmlContent;
}

function renderTentativeWarning() {
    const warningEl = document.getElementById('tentativeWarningText');
    const btnIcon = document.querySelector('#btnToggleWarning i');
    
    if (warningEl) {
        if (showTentativeWarning) {
            warningEl.classList.remove('hidden');
            if(btnIcon) btnIcon.className = 'fa-solid fa-eye';
        } else {
            warningEl.classList.add('hidden');
            if(btnIcon) btnIcon.className = 'fa-solid fa-eye-slash text-red-400';
        }
    }
}

async function toggleTentativeWarning() {
    showTentativeWarning = !showTentativeWarning;
    renderTentativeWarning(); 

    const { error } = await supabaseClient
        .from('app_settings')
        .upsert({ setting_key: 'show_tentative_warning', setting_value: showTentativeWarning.toString() });
    
    if (error) {
        alert("Gagal mengemaskini tetapan: " + error.message);
        showTentativeWarning = !showTentativeWarning;
        renderTentativeWarning();
    }
}

function toggleTentativeModal(show) {
    const modal = document.getElementById('tentativeModal');
    const content = modal.querySelector('div');
    
    if(show) {
        lockScroll();
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
        
        document.getElementById('tentativeModalTitle').innerText = "Tambah Tentatif";
        document.getElementById('btnTentSubmit').innerHTML = 'Simpan';
        document.getElementById('btnDeleteTent').classList.add('hidden');
        
        document.getElementById('tentId').value = '';
        document.getElementById('tentTime').value = '';
        document.getElementById('tentTitle').value = '';
        document.getElementById('tentDetails').value = '';
        document.getElementById('tentSort').value = tentativeList.length + 1;
        document.getElementById('tentColor').value = 'blue';
        document.getElementById('tentIcon').value = 'fa-clock';
    } else {
        unlockScroll();
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        setTimeout(() => { modal.classList.add('hidden'); }, 300);
    }
}

function editTentative(id) {
    const t = tentativeList.find(x => x.id === id);
    if (!t) return;

    toggleTentativeModal(true);
    
    document.getElementById('tentativeModalTitle').innerText = "Kemaskini Tentatif";
    document.getElementById('tentId').value = t.id;
    document.getElementById('tentTime').value = t.time_label;
    document.getElementById('tentTitle').value = t.title;
    document.getElementById('tentDetails').value = t.details || '';
    document.getElementById('tentSort').value = t.sort_order;
    document.getElementById('tentColor').value = t.color_theme;
    document.getElementById('tentIcon').value = t.icon;
    
    document.getElementById('btnDeleteTent').classList.remove('hidden');
}

async function submitTentative(e) {
    e.preventDefault();
    const id = document.getElementById('tentId').value;
    const payload = {
        time_label: document.getElementById('tentTime').value,
        title: document.getElementById('tentTitle').value,
        details: document.getElementById('tentDetails').value,
        sort_order: parseInt(document.getElementById('tentSort').value) || 0,
        color_theme: document.getElementById('tentColor').value,
        icon: document.getElementById('tentIcon').value || 'fa-clock'
    };

    if (id) {
        const { error } = await supabaseClient.from('tentative').update(payload).eq('id', id);
        if(!error) { 
            showSuccessModal("Dikemaskini!", "Tentatif berjaya diubah");
            toggleTentativeModal(false); 
            loadDataFromSupabase(); 
        } else alert("Gagal update: " + error.message);
    } else {
        const { error } = await supabaseClient.from('tentative').insert([payload]);
        if(!error) { 
            showSuccessModal("Ditambah!", "Tentatif baharu berjaya disimpan");
            toggleTentativeModal(false); 
            loadDataFromSupabase(); 
        } else alert("Gagal simpan: " + error.message);
    }
}

function deleteTentative() {
    const id = document.getElementById('tentId').value;
    if (!id) return;

    showConfirmationModal(
        "Anda pasti mahu memadam aktiviti tentatif ini?", 
        async () => {
            const { error } = await supabaseClient.from('tentative').delete().eq('id', id);
            if(!error) { 
                showSuccessModal("Berjaya!", "Rekod telah dipadam");
                toggleTentativeModal(false); 
                loadDataFromSupabase(); 
            } else alert("Gagal memadam: " + error.message);
        }
    );
}

// --- FUNGSI CHECKLIST DINAMIK ---
function renderChecklist() {
    const container = document.getElementById('checklistContainer');
    if (!container) return;

    if (checklistList.length === 0) {
        container.innerHTML = '<div class="text-center text-xs text-gray-400 py-4">Tiada rekod checklist.</div>';
        return;
    }

    let htmlContent = '';
    
    checklistList.forEach(cat => {
        let adminBtn = '';
        if (isAdmin) {
            adminBtn = `<button onclick="editChecklist(${cat.id}); event.stopPropagation();" class="ml-2 text-gray-300 hover:text-${cat.color_theme}-500 transition"><i class="fa-solid fa-pen-to-square"></i></button>`;
        }

        let itemsHtml = '';
        if (cat.items) {
            const lines = cat.items.split('\n');
            lines.forEach(line => {
                if(line.trim() === '') return;
                const parts = line.split('|');
                const itemName = parts[0] || '';
                const itemType = (parts[1] || '').trim().toLowerCase();

                let badge = '';
                if (itemType === 'wajib') {
                    badge = `<span class="ml-2 text-[10px] font-medium text-white bg-red-500 rounded px-1">(wajib)</span>`;
                } else if (itemType === 'pilihan') {
                    badge = `<span class="ml-2 text-[10px] font-medium text-emerald-700 rounded px-1 bg-emerald-50">(pilihan)</span>`;
                }

                itemsHtml += `
                <div class="flex gap-2 items-center">
                    <i class="fa-solid fa-angle-right text-gray-300 text-xs"></i>
                    <span class="text-xs">${escapeHtml(itemName)} ${badge}</span>
                </div>`;
            });
        }

        htmlContent += `
        <section>
            <header class="flex justify-between cursor-pointer font-bold text-sm text-gray-700" onclick="toggleChecklistCategory(this)">
                <div><i class="fa-solid ${escapeHtml(cat.icon)} text-${escapeHtml(cat.color_theme)}-500 mr-2"></i> ${escapeHtml(cat.category)} ${adminBtn}</div>
                <i class="fa-solid fa-chevron-down text-gray-400 transition-transform duration-300"></i>
            </header>
            <div class="category-body mt-2 pl-6 space-y-2 hidden">
                ${itemsHtml}
            </div>
        </section>`;
    });

    container.innerHTML = htmlContent;
}

function toggleChecklistCategory(el) {
    const body = el.nextElementSibling;
    const icon = el.querySelector('.fa-chevron-down');
    
    if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
    } else {
        body.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
    }
}

function toggleChecklistModal(show) {
    const modal = document.getElementById('checklistModal');
    const content = modal.querySelector('div');
    
    if(show) {
        lockScroll();
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
        
        document.getElementById('checklistModalTitle').innerText = "Tambah Checklist";
        document.getElementById('btnChkSubmit').innerHTML = 'Simpan';
        document.getElementById('btnDeleteChk').classList.add('hidden');
        
        document.getElementById('chkId').value = '';
        document.getElementById('chkCategory').value = '';
        document.getElementById('chkItems').value = '';
        document.getElementById('chkSort').value = checklistList.length + 1;
        document.getElementById('chkColor').value = 'emerald';
        document.getElementById('chkIcon').value = 'fa-list';
    } else {
        unlockScroll();
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        setTimeout(() => { modal.classList.add('hidden'); }, 300);
    }
}

function editChecklist(id) {
    const c = checklistList.find(x => x.id === id);
    if (!c) return;

    toggleChecklistModal(true);
    
    document.getElementById('checklistModalTitle').innerText = "Kemaskini Checklist";
    document.getElementById('chkId').value = c.id;
    document.getElementById('chkCategory').value = c.category;
    document.getElementById('chkItems').value = c.items || '';
    document.getElementById('chkSort').value = c.sort_order;
    document.getElementById('chkColor').value = c.color_theme;
    document.getElementById('chkIcon').value = c.icon;
    
    document.getElementById('btnDeleteChk').classList.remove('hidden');
}

async function submitChecklist(e) {
    e.preventDefault();
    const id = document.getElementById('chkId').value;
    const payload = {
        category: document.getElementById('chkCategory').value,
        items: document.getElementById('chkItems').value,
        sort_order: parseInt(document.getElementById('chkSort').value) || 0,
        color_theme: document.getElementById('chkColor').value,
        icon: document.getElementById('chkIcon').value || 'fa-list'
    };

    if (id) {
        const { error } = await supabaseClient.from('checklist').update(payload).eq('id', id);
        if(!error) { 
            showSuccessModal("Dikemaskini!", "Checklist berjaya diubah");
            toggleChecklistModal(false); 
            loadDataFromSupabase(); 
        } else alert("Gagal update: " + error.message);
    } else {
        const { error } = await supabaseClient.from('checklist').insert([payload]);
        if(!error) { 
            showSuccessModal("Ditambah!", "Checklist baharu berjaya disimpan");
            toggleChecklistModal(false); 
            loadDataFromSupabase(); 
        } else alert("Gagal simpan: " + error.message);
    }
}

function deleteChecklist() {
    const id = document.getElementById('chkId').value;
    if (!id) return;

    showConfirmationModal(
        "Anda pasti mahu memadam kategori checklist ini?", 
        async () => {
            const { error } = await supabaseClient.from('checklist').delete().eq('id', id);
            if(!error) { 
                showSuccessModal("Berjaya!", "Rekod telah dipadam");
                toggleChecklistModal(false); 
                loadDataFromSupabase(); 
            } else alert("Gagal memadam: " + error.message);
        }
    );
}
// --- TAMAT FUNGSI CHECKLIST DINAMIK ---

function toggleMemberConfigModal(show) {
    const modal = document.getElementById('memberConfigModal');
    const content = modal.querySelector('div');
    
    if(show) {
        lockScroll();
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);
        
        document.getElementById('memberModalTitle').innerHTML = "Tambah Ahli";
        document.getElementById('btnSaveMember').innerHTML = '<i class="fa-solid fa-user-plus"></i> Tambah'; 
        
        document.getElementById('configMemberId').value = '';
        document.getElementById('configMemberName').value = '';
        
        cancelHistoryEdit();
        
        const payTypeEl = document.getElementById('initPayType');
        if(payTypeEl) payTypeEl.value = 'Bayaran Asas';

        document.getElementById('btnDeleteMember').classList.add('hidden');
        document.getElementById('memberHistorySection').classList.add('hidden');

    } else {
        unlockScroll();
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
            const displayType = h.type ? `<span class="block text-[9px] text-gray-400 mt-0.5">${h.type}</span>` : '';
            container.innerHTML += `
                <div class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 hover:bg-blue-50 transition">
                    <div>
                        <span class="text-gray-600 font-mono">${h.date}</span>
                        ${displayType}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-emerald-600">RM${h.amount}</span>
                        <button onclick="prepareEditHistoryItem(${member.id}, ${index})" class="text-blue-400 hover:text-blue-600 ml-2 bg-white p-1 rounded border border-blue-100 shadow-sm" title="Edit">
                            <i class="fa-solid fa-pen-to-square"></i>
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
    
    document.getElementById('editHistoryIndex').value = index; 
    document.getElementById('initPayAmount').value = item.amount;
    
    const payTypeEl = document.getElementById('initPayType');
    if (payTypeEl) payTypeEl.value = item.type || 'Bayaran Asas';

    const [d, M, y] = item.date.split('-');
    document.getElementById('initPayDate').value = `${y}-${M.padStart(2,'0')}-${d.padStart(2,'0')}`;
    
    document.getElementById('initPayAmount').focus();
}

function cancelHistoryEdit() {
    document.getElementById('paymentBoxContainer').classList.replace('bg-amber-50', 'bg-emerald-50');
    document.getElementById('paymentBoxContainer').classList.replace('border-amber-100', 'border-emerald-100');

    document.getElementById('paymentBoxTitle').innerHTML = `<i class="fa-solid fa-plus-circle"></i> Tambah Bayaran`;
    document.getElementById('btnCancelHistoryEdit').classList.add('hidden');
    
    document.getElementById('editHistoryIndex').value = '';
    document.getElementById('initPayAmount').value = '';
    document.getElementById('initPayDate').valueAsDate = new Date();
    
    const payTypeEl = document.getElementById('initPayType');
    if(payTypeEl) payTypeEl.value = 'Bayaran Asas';
}

async function submitMemberConfig(e) {
    e.preventDefault();
    const id = document.getElementById('configMemberId').value;
    const name = document.getElementById('configMemberName').value;
    
    const amountVal = parseFloat(document.getElementById('initPayAmount').value) || 0;
    const dateInput = document.getElementById('initPayDate').value; 
    const editIndex = document.getElementById('editHistoryIndex').value;
    
    const payTypeEl = document.getElementById('initPayType');
    const payType = payTypeEl ? payTypeEl.value : 'Bayaran Asas';

    const formatDate = (isoDateString) => {
        if (!isoDateString) return new Date().toLocaleDateString('en-GB').replace(/\//g, '-'); 
        const d = new Date(isoDateString);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`; 
    };

    if ((amountVal <= 0) && (dateInput || editIndex !== "")) {
        const amountInput = document.getElementById('initPayAmount');
        amountInput.setCustomValidity("please fill out this field.");
        amountInput.reportValidity();
        amountInput.oninput = function() { this.setCustomValidity(""); };
        return; 
    }

    if (id) {
        const member = members.find(m => m.id == id);
        let currentHistory = [...(member.history || [])];
        
        if (amountVal > 0) {
            const dateStr = formatDate(dateInput); 
            
            if (editIndex !== "") {
                const idx = parseInt(editIndex);
                currentHistory[idx] = { date: dateStr, amount: amountVal, type: payType };
            } else {
                currentHistory.push({ date: dateStr, amount: amountVal, type: payType });
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
            const dateStr = formatDate(dateInput);
            history.push({ date: dateStr, amount: amountVal, type: payType });
            paid = amountVal;
        }

        const { error } = await supabaseClient
            .from('members')
            .insert([{ name: name, paid: paid, history: history }]);
            
        if(!error) { 
            showSuccessModal("Selesai", "Ahli telah berjaya ditambah");
            toggleMemberConfigModal(false);
            loadDataFromSupabase(); 
        } else {
            alert("Gagal tambah ahli: " + error.message);
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

function toggleExpenseModal(show) {
    const modal = document.getElementById('expenseModal');
    const content = modal.querySelector('div');
    
    if(show) {
        lockScroll();
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
        unlockScroll();
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
    
    lockScroll();
    
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.add('scale-100'); }, 10);

    document.getElementById('expenseModalTitle').innerText = "Kemaskini Perbelanjaan";
    document.getElementById('btnExpSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kemaskini';
    
    document.getElementById('expId').value = e.id;
    
    const [day, month, year] = e.date.split('-');
    const fmtMonth = month.length < 2 ? '0' + month : month;
    const fmtDay = day.length < 2 ? '0' + day : day;
    document.getElementById('expDate').value = `${year}-${fmtMonth}-${fmtDay}`;

    document.getElementById('expCategory').value = e.category;
    document.getElementById('expDetail').value = e.detail;
    document.getElementById('expAmount').value = e.amount;
    
    document.getElementById('expReceiptUrl').value = e.receipt_url || '';
    
    document.getElementById('btnDeleteExp').classList.remove('hidden');
}

async function submitExpense(e) {
    e.preventDefault();
    const id = document.getElementById('expId').value;
    const dateInput = document.getElementById('expDate').value; 
    const category = document.getElementById('expCategory').value;
    const detail = document.getElementById('expDetail').value;
    const amount = parseFloat(document.getElementById('expAmount').value);

    const receiptUrl = document.getElementById('expReceiptUrl').value;

    const d = new Date(dateInput);
    const day = d.getDate().toString().padStart(2, '0');   
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); 
    const year = d.getFullYear();
    
    const dateStr = `${day}-${month}-${year}`;

    const payload = { date: dateStr, category, detail, amount, receipt_url: receiptUrl };

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
const AFK_LIMIT = 3 * 60 * 1000;

function startAutoLogoutTimer() {
    const events = ['click', 'keypress', 'touchstart', 'scroll'];
    events.forEach(evt => {
        document.addEventListener(evt, resetAfkTimer, { passive: true });
    });
    resetAfkTimer(); 
}

function stopAutoLogoutTimer() {
    clearTimeout(afkTimer);
    const events = ['click', 'keypress', 'touchstart', 'scroll'];
    events.forEach(evt => {
        document.removeEventListener(evt, resetAfkTimer);
    });
}

let lastActivityTime = 0; 

function resetAfkTimer() {
    if (!isAdmin) return;

    const now = Date.now();
    if (now - lastActivityTime < 1000) return;
    lastActivityTime = now;

    clearTimeout(afkTimer);
    
    afkTimer = setTimeout(async () => {
        console.log("Auto-logout triggered due to inactivity.");
        await supabaseClient.auth.signOut();
        openAfkLogoutModal();
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
                showSuccessModal("Selesai", "Rekod bayaran dipadam.");
                toggleMemberConfigModal(false); 
                await loadDataFromSupabase(); 
            } else {
                alert("Gagal: " + error.message);
            }
        }
    );
}

function showDatabaseErrorModal() {
    const modal = document.getElementById('databaseErrorModal');
    const content = modal.querySelector('div');
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closeDatabaseErrorModal() {
    const modal = document.getElementById('databaseErrorModal');
    const content = modal.querySelector('div');
    
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    
    setTimeout(() => { 
        modal.classList.add('hidden'); 
    }, 300);
}

function openAfkLogoutModal() {
    const modal = document.getElementById('afkLogoutModal');
    const content = modal.querySelector('div');

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closeAfkLogoutModal() {
    const modal = document.getElementById('afkLogoutModal');
    const content = modal.querySelector('div');

    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    
    setTimeout(() => { 
        modal.classList.add('hidden'); 
    }, 300);
}

function jumpTen(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        
        const currentVal = parseFloat(event.target.value) || 0;
        const adjustment = event.key === 'ArrowUp' ? 10 : -10;
        
        const newVal = Math.max(0, currentVal + adjustment);
        
        event.target.value = newVal.toFixed(2); 
    }
}

function showNoReceiptModal() {
    const modal = document.getElementById('noReceiptModal');
    const content = modal.querySelector('div');
    
    lockScroll();
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closeNoReceiptModal() {
    const modal = document.getElementById('noReceiptModal');
    const content = modal.querySelector('div');
    
    unlockScroll();
    
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function viewReceipt(url) {
    const modal = document.getElementById('receiptImageModal');
    const img = document.getElementById('receiptImageDisplay');
    
    if (!modal || !img) {
        console.error("Error: Modal 'receiptImageModal' tidak dijumpai dalam HTML.");
        return;
    }

    img.src = url;
    
    lockScroll();
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
    }, 10);
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptImageModal');
    const img = document.getElementById('receiptImageDisplay');
    
    if (modal) {
        unlockScroll();
        modal.classList.add('opacity-0');
        setTimeout(() => { 
            modal.classList.add('hidden'); 
            if(img) img.src = '';
        }, 300);
    }
}

function lockScroll() {
    document.body.classList.add('overflow-hidden');
}

function unlockScroll() {
    document.body.classList.remove('overflow-hidden');
}
