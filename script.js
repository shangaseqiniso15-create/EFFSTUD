// script.js - Complete CivilVault with Icons8 support
let data = { theme: {}, modules: [] };
let currentModuleId = null;
let currentSectionKey = 'videos';

const STORAGE_KEY = 'civilvault_modules_data';

function applyTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', data.theme.primaryColor || '#14b8a6');

    const logoContainer = document.getElementById('logo-container');
    if (logoContainer) {
        logoContainer.innerHTML = `
            <img src="${data.theme.appIcon || 'https://img.icons8.com/color/96/bridge.png'}" 
                 class="w-9 h-9 rounded-2xl shadow-inner" alt="CivilVault">
            <h1 class="text-3xl font-bold tracking-tight">CivilVault</h1>
        `;
    }
}

function getIconHTML(url) {
    return `<img src="${url}" class="w-7 h-7 object-contain" alt="icon">`;
}

async function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        data = JSON.parse(saved);
        console.log('Loaded from localStorage');
    } else {
        try {
            const response = await fetch('data.json');
            if (response.ok) {
                data = await response.json();
                console.log('Loaded from data.json');
            }
        } catch (e) {
            console.warn('No data.json found - starting empty');
            data = {
                theme: {
                    primaryColor: "#14b8a6",
                    appIcon: "https://img.icons8.com/color/96/bridge.png",
                    moduleIcon: "https://img.icons8.com/color/96/skyscraper.png",
                    videoIcon: "https://img.icons8.com/color/96/video.png",
                    fileIcon: "https://img.icons8.com/color/96/blueprint.png",
                    websiteIcon: "https://img.icons8.com/color/96/domain.png"
                },
                modules: []
            };
        }
    }
    applyTheme();
    renderModulesList();
    if (data.modules && data.modules.length > 0) {
        selectModule(data.modules[0].id);
    } else {
        showNoModuleScreen();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const lastSaved = document.getElementById('last-saved');
    if (lastSaved) lastSaved.textContent = 'Just now';
    setTimeout(() => { if (lastSaved) lastSaved.textContent = 'a minute ago'; }, 60000);
    showToast('✅ Changes saved');
}

// ====================== RENDERING ======================
function renderModulesList() {
    const container = document.getElementById('modules-list');
    if (!container) return;
    container.innerHTML = '';

    (data.modules || []).forEach(mod => {
        const isActive = mod.id === currentModuleId;
        const li = document.createElement('li');
        li.className = `flex items-center gap-3 px-4 py-3 rounded-3xl cursor-pointer transition ${isActive ? 'bg-[var(--primary-color)] text-white' : 'hover:bg-zinc-800'}`;
        li.innerHTML = `
            ${getIconHTML(data.theme.moduleIcon)}
            <div class="flex-1 font-medium">${mod.name}</div>
        `;
        li.onclick = () => selectModule(mod.id);
        container.appendChild(li);
    });

    if (!data.modules || data.modules.length === 0) {
        container.innerHTML = `<li class="px-4 py-8 text-center text-zinc-400 text-sm">No modules yet.<br>Click New Module</li>`;
    }
}

function selectModule(id) {
    currentModuleId = id;
    renderModulesList();

    const module = (data.modules || []).find(m => m.id === id);
    if (!module) return;

    const header = document.getElementById('current-module-name');
    if (header) {
        header.innerHTML = `${module.name} <span class="text-xs ml-2 underline text-teal-300 cursor-pointer" onclick="event.stopImmediatePropagation(); editModuleName(event)">edit</span>`;
    }

    document.getElementById('no-module-selected').classList.add('hidden');
    renderSectionTabs();
    renderCurrentSection();
}

function renderSectionTabs() {
    const container = document.getElementById('section-tabs');
    if (!container) return;

    const sections = [
        { key: 'videos', label: 'Videos', icon: data.theme.videoIcon },
        { key: 'files', label: 'Files', icon: data.theme.fileIcon },
        { key: 'websites', label: 'Websites', icon: data.theme.websiteIcon }
    ];

    container.innerHTML = sections.map(sec => {
        const active = sec.key === currentSectionKey ? 'bg-white text-zinc-900 shadow' : 'hover:bg-zinc-700';
        return `
            <button onclick="switchSection('${sec.key}')" 
                    class="flex items-center gap-2 px-6 py-2 rounded-3xl ${active}">
                <img src="${sec.icon}" class="w-5 h-5">
                <span class="font-semibold">${sec.label}</span>
            </button>`;
    }).join('');
}

function switchSection(key) {
    currentSectionKey = key;
    renderSectionTabs();
    renderCurrentSection();
}

function renderCurrentSection() {
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    if (!module) return;

    const sectionData = module.sections[currentSectionKey] || { topics: [] };
    const main = document.getElementById('main-content');
    if (!main) return;

    let html = `
        <div class="mb-8 flex items-center justify-between">
            <h3 class="text-3xl font-semibold capitalize">${currentSectionKey}</h3>
            <button onclick="addTopic()" 
                    class="bg-[var(--primary-color)] hover:brightness-110 text-white px-6 py-3 rounded-3xl font-medium flex items-center gap-2">
                + New Topic Folder
            </button>
        </div>`;

    if (!sectionData.topics || sectionData.topics.length === 0) {
        html += `
            <div class="border border-dashed border-zinc-700 rounded-3xl p-16 text-center">
                <p class="text-zinc-400 mb-4">No topics yet</p>
                <button onclick="addTopic()" class="text-teal-400 underline">Create first topic</button>
            </div>`;
    } else {
        sectionData.topics.forEach(topic => {
            html += `
                <div class="mb-6 bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden">
                    <div onclick="toggleAccordion('${topic.id}')" class="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-zinc-800">
                        <div class="flex items-center gap-4">
                            <span class="text-3xl">📁</span>
                            <h4 class="text-xl font-semibold">${topic.name}</h4>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="event.stopImmediatePropagation(); editTopic('${topic.id}');" class="text-xs px-4 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-2xl">edit</button>
                            <button onclick="event.stopImmediatePropagation(); deleteTopic('${topic.id}');" class="text-xs px-4 py-1 bg-red-900/30 hover:bg-red-900/70 text-red-300 rounded-2xl">delete</button>
                            <span class="text-3xl transition-transform" id="arrow-${topic.id}">›</span>
                        </div>
                    </div>
                    <div id="accordion-${topic.id}" class="hidden px-6 pb-6">
                        <div class="flex justify-end mb-4">
                            <button onclick="addItem('${topic.id}')" class="text-teal-400 hover:text-teal-300 flex items-center gap-1">
                                + Add ${currentSectionKey.slice(0,-1)}
                            </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${topic.items.map(item => `
                                <div class="bg-zinc-800 rounded-3xl p-5">
                                    <div class="font-semibold">${item.title}</div>
                                    <div class="text-xs text-zinc-400 break-all mt-1">${item.url}</div>
                                    <div class="mt-6 flex justify-between">
                                        ${currentSectionKey === 'videos' 
                                            ? `<button onclick="playVideo('${item.id}','${topic.id}');event.stopImmediatePropagation()" class="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-3xl text-sm">▶ Play</button>`
                                            : `<a href="${item.url}" target="_blank" onclick="event.stopImmediatePropagation()" class="bg-zinc-700 hover:bg-zinc-600 px-5 py-2 rounded-3xl text-sm inline-flex items-center gap-2">${currentSectionKey==='files'?'📥 Download':'🔗 Visit'}</a>`}
                                        <div class="flex gap-2">
                                            <button onclick="event.stopImmediatePropagation();editItem('${topic.id}','${item.id}')" class="text-zinc-400 hover:text-white">✏️</button>
                                            <button onclick="event.stopImmediatePropagation();deleteItem('${topic.id}','${item.id}')" class="text-red-400 hover:text-red-300">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>`;
        });
    }
    main.innerHTML = html;
}

function toggleAccordion(topicId) {
    const content = document.getElementById(`accordion-${topicId}`);
    const arrow = document.getElementById(`arrow-${topicId}`);
    if (!content || !arrow) return;

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.style.transform = 'rotate(90deg)';
    } else {
        content.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// ====================== CRUD ======================
function addModule() {
    const name = prompt('Module name (e.g. Structural Engineering):', 'New Module');
    if (!name || !name.trim()) return;

    const newModule = {
        id: 'm' + Date.now(),
        name: name.trim(),
        sections: {
            videos: { topics: [] },
            files: { topics: [] },
            websites: { topics: [] }
        }
    };
    data.modules = data.modules || [];
    data.modules.push(newModule);
    saveData();
    renderModulesList();
    selectModule(newModule.id);
}

function editModuleName(e) {
    if (e) e.stopImmediatePropagation();
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    if (!module) return;
    const newName = prompt('Rename module:', module.name);
    if (!newName || newName.trim() === module.name) return;
    module.name = newName.trim();
    saveData();
    selectModule(currentModuleId);
}

function addTopic() {
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    if (!module) return;
    const name = prompt(`New topic for ${currentSectionKey}:`, 'New Topic');
    if (!name) return;

    const section = module.sections[currentSectionKey];
    if (!section.topics) section.topics = [];
    section.topics.push({
        id: 't' + Date.now(),
        name: name.trim(),
        items: []
    });
    saveData();
    renderCurrentSection();
}

function editTopic(topicId) {
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    if (!module) return;
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);
    if (!topic) return;
    const newName = prompt('Rename topic:', topic.name);
    if (!newName || newName === topic.name) return;
    topic.name = newName.trim();
    saveData();
    renderCurrentSection();
}

function deleteTopic(topicId) {
    if (!confirm('Delete topic and all items inside?')) return;
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    if (!module) return;
    const section = module.sections[currentSectionKey];
    section.topics = section.topics.filter(t => t.id !== topicId);
    saveData();
    renderCurrentSection();
}

function addItem(topicId) {
    showItemModal(topicId, null);
}

function editItem(topicId, itemId) {
    showItemModal(topicId, itemId);
}

function showItemModal(topicId, itemId) {
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    if (!module) return;
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);
    const item = itemId ? topic.items.find(i => i.id === itemId) : null;

    const modalHTML = `
        <h2 class="text-2xl font-semibold mb-6">${item ? 'Edit' : 'Add'} ${currentSectionKey.slice(0,-1)}</h2>
        <div class="space-y-6">
            <div>
                <label class="block text-sm text-zinc-400 mb-1">Title</label>
                <input id="item-title" value="${item ? item.title : ''}" class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 focus:border-teal-400 outline-none">
            </div>
            <div>
                <label class="block text-sm text-zinc-400 mb-1">URL</label>
                <input id="item-url" value="${item ? item.url : ''}" class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 focus:border-teal-400 outline-none">
            </div>
            <div class="flex gap-3">
                <button onclick="hideModal()" class="flex-1 py-4 border border-zinc-700 rounded-3xl text-zinc-400">Cancel</button>
                <button onclick="saveItem('${topicId}', '${itemId || ''}')" class="flex-1 py-4 bg-[var(--primary-color)] rounded-3xl font-medium">Save</button>
            </div>
        </div>`;
    showModal(modalHTML);
}

function saveItem(topicId, itemId) {
    const title = document.getElementById('item-title').value.trim();
    const url = document.getElementById('item-url').value.trim();
    if (!title || !url) {
        alert('Title and URL required');
        return;
    }

    const module = (data.modules || []).find(m => m.id === currentModuleId);
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);

    if (itemId) {
        const item = topic.items.find(i => i.id === itemId);
        item.title = title;
        item.url = url;
    } else {
        if (!topic.items) topic.items = [];
        topic.items.push({ id: 'i' + Date.now(), title, url });
    }

    hideModal();
    saveData();
    renderCurrentSection();
}

function deleteItem(topicId, itemId) {
    if (!confirm('Delete this item?')) return;
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);
    topic.items = topic.items.filter(i => i.id !== itemId);
    saveData();
    renderCurrentSection();
}

function playVideo(itemId, topicId) {
    const module = (data.modules || []).find(m => m.id === currentModuleId);
    const topic = module.sections.videos.topics.find(t => t.id === topicId);
    const item = topic.items.find(i => i.id === itemId);
    if (!item) return;

    let embedUrl = item.url;
    if (embedUrl.includes('youtube.com/watch?v=')) {
        const vid = embedUrl.split('v=')[1].split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${vid}`;
    } else if (embedUrl.includes('youtu.be/')) {
        const vid = embedUrl.split('youtu.be/')[1].split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${vid}`;
    }

    document.getElementById('video-player-container').innerHTML = `
        <iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    document.getElementById('video-modal-title').textContent = item.title;
    document.getElementById('video-modal').classList.remove('hidden');
    document.getElementById('video-modal').classList.add('flex');
}

function hideVideoModal() {
    const modal = document.getElementById('video-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('video-player-container').innerHTML = '';
}

// Modal helpers
function showModal(html) {
    const backdrop = document.getElementById('modal-backdrop');
    document.getElementById('modal-content').innerHTML = html;
    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');
}

function hideModal() {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.classList.add('hidden');
    backdrop.classList.remove('flex');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toast-text').innerHTML = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

// Helper functions
function goBackToModules() {
    currentModuleId = null;
    showNoModuleScreen();
    renderModulesList();
}

function showNoModuleScreen() {
    const noScreen = document.getElementById('no-module-selected');
    if (noScreen) noScreen.classList.remove('hidden');
}

function downloadJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'civilvault-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 Backup downloaded');
}

function loadJSONFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            data = JSON.parse(ev.target.result);
            saveData();
            applyTheme();
            renderModulesList();
            if (data.modules && data.modules.length > 0) selectModule(data.modules[0].id);
            showToast('✅ Imported');
        } catch(err) {
            alert('Invalid JSON file');
        }
    };
    reader.readAsText(file);
}

// Start the app
window.onload = loadData;
