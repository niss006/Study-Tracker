// --- DYNAMIC DATA STORAGE ---
let studyLog = JSON.parse(localStorage.getItem('bun-study-log-v2')) || {};
let subjects = JSON.parse(localStorage.getItem('bun-subjects')) || [
    { id: 1, name: 'Mathematics', color: '#ffab91', hours: 0 },
    { id: 2, name: 'Biology', color: '#81c784', hours: 0 }
];

window.onload = () => {
    populateSubjectDropdown();
    renderSubjects();
};

function populateSubjectDropdown() {
    const select = document.getElementById('subject-selector');
    const currentValue = select.value; 
    select.innerHTML = '<option value="General">General Study</option>';
    subjects.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.name;
        option.innerText = sub.name;
        select.appendChild(option);
    });
    if (subjects.find(s => s.name === currentValue) || currentValue === 'General') {
        select.value = currentValue;
    }
}

// --- PAGE NAVIGATION ---
function openDashboard() {
    document.getElementById('room-page').classList.add('slide-left');
    document.getElementById('dashboard-page').classList.add('slide-in');
    generateBarChart(); 
    renderSubjects(); 
}
function closeDashboard() {
    document.getElementById('dashboard-page').classList.remove('slide-in');
    document.getElementById('room-page').classList.remove('slide-left');
}

// --- DYNAMIC STACKED BAR CHART ---
function generateBarChart() {
    const chart = document.getElementById('bar-chart');
    chart.innerHTML = '';
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    let chartData = [];
    let globalMaxMinutes = 1; 

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const dayData = studyLog[dateString] || {};
        let totalMinutes = 0;
        Object.values(dayData).forEach(min => totalMinutes += min);
        if (totalMinutes > globalMaxMinutes) globalMaxMinutes = totalMinutes;

        chartData.push({
            label: daysOfWeek[d.getDay()],
            data: dayData,
            totalMinutes: totalMinutes,
            isToday: i === 0
        });
    }

    chartData.forEach(day => {
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        const totalHeightPercent = (day.totalMinutes / globalMaxMinutes) * 100;
        const barColumn = document.createElement('div');
        barColumn.className = 'bar-column';
        barColumn.style.height = `${totalHeightPercent}%`;
        
        if (day.totalMinutes === 0) {
            barColumn.style.background = 'rgba(255, 255, 255, 0.05)';
            barColumn.style.height = '5%';
        } else {
            for (const [subjectName, minutes] of Object.entries(day.data)) {
                const segment = document.createElement('div');
                segment.className = 'bar-segment';
                const subInfo = subjects.find(s => s.name === subjectName);
                segment.style.background = subInfo ? subInfo.color : '#555';
                if(subjectName === 'General') segment.style.background = '#888';
                const segmentPercent = (minutes / day.totalMinutes) * 100;
                segment.style.height = `${segmentPercent}%`;
                segment.title = `${subjectName}: ${minutes.toFixed(0)} mins`;
                barColumn.appendChild(segment);
            }
        }
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.innerText = day.label;
        if(day.isToday) { label.style.color = 'var(--accent)'; label.style.fontWeight = '900'; }
        wrapper.appendChild(barColumn);
        wrapper.appendChild(label);
        chart.appendChild(wrapper);
    });
}

// --- DYNAMIC SUBJECT LIST ---
function renderSubjects() {
    const list = document.getElementById('subject-list');
    list.innerHTML = '';
    let subjectHoursMap = {};
    for (const date in studyLog) {
        for (const [subject, mins] of Object.entries(studyLog[date])) {
            subjectHoursMap[subject] = (subjectHoursMap[subject] || 0) + mins;
        }
    }
    subjects.forEach(sub => { sub.hours = (subjectHoursMap[sub.name] || 0) / 60; });
    if (subjects.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:14px;">No subjects yet. Add one below!</p>';
        return;
    }
    const maxHours = Math.max(...subjects.map(s => s.hours), 1); 
    subjects.forEach(sub => {
        const item = document.createElement('div');
        item.className = 'subject-item';
        const percent = Math.min((sub.hours / maxHours) * 100, 100);
        item.innerHTML = `
            <div class="subject-dot" style="background: ${sub.color};"></div>
            <div class="subject-info">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="subject-name">${sub.name}</div>
                    <button class="delete-subject" onclick="deleteSubject('${sub.name}')" title="Remove">✕</button>
                </div>
                <div class="subject-time">${sub.hours.toFixed(1)} hours total</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%; background: ${sub.color};"></div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function addSubject() {
    const nameInput = document.getElementById('subject-name');
    const colorInput = document.getElementById('subject-color');
    const name = nameInput.value.trim();
    const color = colorInput.value;
    if (!name) return alert("Please enter a subject name.");
    if (subjects.find(s => s.name.toLowerCase() === name.toLowerCase())) return alert("Subject already exists!");
    subjects.push({ id: Date.now(), name: name, color: color, hours: 0 });
    nameInput.value = '';
    localStorage.setItem('bun-subjects', JSON.stringify(subjects));
    renderSubjects();
    populateSubjectDropdown(); 
}

function deleteSubject(name) {
    showModal("Remove Subject?", `Are you sure you want to delete ${name}?`, "🗑️", () => {
        subjects = subjects.filter(s => s.name !== name);
        localStorage.setItem('bun-subjects', JSON.stringify(subjects));
        renderSubjects();
        populateSubjectDropdown(); 
    });
}

// --- CUSTOM MODAL ---
function showModal(title, text, icon, onConfirm, showCancel = true) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerText = text;
    document.getElementById('modal-icon').innerText = icon;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = '';
    if (showCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-cancel';
        cancelBtn.innerText = 'Cancel';
        cancelBtn.onclick = closeModal;
        actions.appendChild(cancelBtn);
    }
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn modal-btn-confirm';
    confirmBtn.innerText = showCancel ? 'Confirm' : 'OK';
    confirmBtn.onclick = () => { closeModal(); if(onConfirm) onConfirm(); };
    actions.appendChild(confirmBtn);
    document.getElementById('custom-modal').classList.add('active');
}
function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

// --- TIMER LOGIC ---
let isBaking = false;
let mode = 'timer'; 
let timeLeft = 25 * 60;
let timeElapsed = 0;
let interval;
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const bun = document.getElementById('bun');
const uiPanel = document.getElementById('ui-panel');

function updateDisplay() {
    let timeToShow = mode === 'timer' ? timeLeft : timeElapsed;
    const minutes = Math.floor(timeToShow / 60);
    const seconds = timeToShow % 60;
    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function switchMode(newMode) {
    if(isBaking) return;
    mode = newMode;
    document.getElementById('mode-timer').classList.toggle('active', mode === 'timer');
    document.getElementById('mode-stopwatch').classList.toggle('active', mode === 'stopwatch');
    uiPanel.classList.toggle('stopwatch-mode', mode === 'stopwatch');
    if(mode === 'timer') timeLeft = 25 * 60;
    else timeElapsed = 0;
    updateDisplay();
}

function adjustTime(minutes) {
    if(isBaking || mode === 'stopwatch') return;
    timeLeft += (minutes * 60);
    if(timeLeft < 60) timeLeft = 60; 
    if(timeLeft > 180 * 60) timeLeft = 180 * 60; 
    updateDisplay();
}

function toggleBaking() { if (!isBaking) startBaking(); else stopBaking(); }

function startBaking() {
    isBaking = true;
    startBtn.innerText = 'Stop / Give Up';
    startBtn.style.background = '#ef4444'; 
    bun.className = 'bun';
    setTimeout(() => { bun.classList.add('rising'); }, 100);
    interval = setInterval(() => {
        if (mode === 'timer') {
            timeLeft--;
            if (timeLeft <= 0) { clearInterval(interval); finishBaking(); }
        } else { timeElapsed++; }
        updateDisplay();
    }, 1000);
}

function stopBaking() {
    showModal("Stop Baking?", "Are you sure you want to give up? Your bun will burn and you will lose your progress.", "⚠️", () => {
        isBaking = false;
        clearInterval(interval);
        startBtn.innerText = 'Start Baking';
        startBtn.style.background = 'var(--accent)';
        bun.classList.remove('rising');
        bun.classList.add('burnt');
        if(mode === 'timer') timeLeft = 25 * 60;
        else timeElapsed = 0;
        updateDisplay();
    });
}

// --- SAVE DATA & AI LOGIC ---
function finishBaking() {
    isBaking = false;
    startBtn.innerText = 'Start Baking';
    startBtn.style.background = 'var(--accent)';
    bun.classList.remove('rising');
    bun.classList.add('baked');
    
    const selectedSubject = document.getElementById('subject-selector').value;
    let minutesStudied = mode === 'timer' ? 25 : Math.floor(timeElapsed / 60);
    if (minutesStudied < 1) minutesStudied = 1; 
    const today = new Date().toISOString().split('T')[0];
    if(!studyLog[today]) studyLog[today] = {};
    studyLog[today][selectedSubject] = (studyLog[today][selectedSubject] || 0) + minutesStudied;
    localStorage.setItem('bun-study-log-v2', JSON.stringify(studyLog));

    if(mode === 'timer') timeLeft = 25 * 60;
    else timeElapsed = 0;
    updateDisplay();
    
    setTimeout(() => {
        document.getElementById('ai-modal').classList.add('active');
        document.getElementById('ai-topic-input').value = '';
        document.getElementById('ai-response').style.display = 'none';
        document.getElementById('ai-text').innerHTML = '';
    }, 500);
}

function closeAiModal() { document.getElementById('ai-modal').classList.remove('active'); }

// The original simple AI function
async function askOllama() {
    const topic = document.getElementById('ai-topic-input').value.trim();
    if (!topic) return alert("Please enter what you studied!");

    const responseDiv = document.getElementById('ai-response');
    const textDiv = document.getElementById('ai-text');
    const loader = document.getElementById('ai-loader');

    responseDiv.style.display = 'block';
    textDiv.innerHTML = '';
    loader.style.display = 'block';

    try {
        const response = await ollama.chat({
            model: 'gemma2:2b',
            messages: [{ 
                role: 'user', 
                content: `I just finished studying ${topic}. Give me a 2-sentence summary of the most important concept, and then 1 quick multiple-choice question to test me. Format it nicely.` 
            }]
        });

        loader.style.display = 'none';
        textDiv.innerText = response.message.content;

    } catch (error) {
        loader.style.display = 'none';
        textDiv.innerText = "Error connecting to Ollama. Make sure the Ollama app is running!";
    }
}

// --- AI CHAT BUBBLE LOGIC ---
function openChatModal() {
    document.getElementById('ai-chat-modal').classList.add('active');
}
function closeChatModal() {
    document.getElementById('ai-chat-modal').classList.remove('active');
}
function handleChatEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    
    const history = document.getElementById('chat-history');
    
    history.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    input.value = '';
    history.scrollTop = history.scrollHeight;
    
    const aiMsgDiv = document.createElement('div');
    aiMsgDiv.className = 'chat-msg ai';
    aiMsgDiv.innerHTML = '<div class="loader" style="display:block; width:16px; height:16px; margin:0;"></div>';
    history.appendChild(aiMsgDiv);
    history.scrollTop = history.scrollHeight;

    try {
        const response = await ollama.chat({
            model: 'gemma2:2b',
            messages: [{ role: 'user', content: msg }]
        });
        aiMsgDiv.innerText = response.message.content;
    } catch (error) {
        aiMsgDiv.innerText = "Error: Make sure Ollama is running!";
    }
    history.scrollTop = history.scrollHeight;
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden && isBaking) {
        clearInterval(interval);
        isBaking = false;
        startBtn.innerText = 'Start Baking';
        startBtn.style.background = 'var(--accent)';
        bun.classList.remove('rising');
        bun.classList.add('burnt');
        if(mode === 'timer') timeLeft = 25 * 60;
        else timeElapsed = 0;
        updateDisplay();
        showModal("Burnt!", "You left the oven! Your bun burnt to a crisp. Try again and stay focused!", "💀", null, false);
    }
});