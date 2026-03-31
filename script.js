// script.js
let data = { modules: [] };
let currentModuleId = null;
let currentSectionKey = 'videos'; // 'videos' | 'files' | 'websites'

const STORAGE_KEY = 'univault_modules_data';

// Tailwind script already loaded in HTML
function initTailwind() {
    tailwind.config = {
        content: [],
        theme: {
            extend: {}
        }
    };
}

// Load data: first try localStorage, then data.json
async function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        data = JSON.parse(saved);
        console.log('✅ Loaded from localStorage');
    } else {
        try {
            const response = await fetch('data.json');
            if (response.ok) {
                data = await response.json();
                console.log('✅ Loaded from data.json');
            } else {
                throw new Error('data.json not found');
            }
        } catch (e) {
            console.warn('⚠️ No data.json found – starting empty');
            data = { modules: [] };
        }
    }
    renderModulesList();
    if (data.modules.length > 0) {
        selectModule(data.modules[0].id);
    } else {
        showNoModuleScreen();
    }
}

// Save to localStorage + update last saved time
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const lastSavedEl = document.getElementById('last-saved');
    if (lastSavedEl) lastSavedEl.textContent = 'Just now';
    setTimeout(() => {
        if (lastSavedEl) lastSavedEl.textContent = 'a minute ago';
    }, 60000);
    showToast('✅ Changes saved automatically');
}

// Render sidebar list of modules
function renderModulesList() {
    const container = document.getElementById('modules-list');
    container.innerHTML = '';

    data.modules.forEach(mod => {
        const isActive = mod.id === currentModuleId;
        const li = document.createElement('li');
        li.className = `module-item flex items-center gap-3 px-4 py-3 rounded-3xl cursor-pointer ${isActive ? 'bg-violet-600 text-white' : 'hover:bg-zinc-800'}`;
        li.innerHTML = `
            <span class="text-2xl">📘</span>
            <div class="flex-1 font-medium">${mod.name}</div>
        `;
        li.onclick = (e) => {
            e.stopImmediatePropagation();
            selectModule(mod.id);
        };
        container.appendChild(li);
    });

    if (data.modules.length === 0) {
        container.innerHTML = `<li class="px-4 py-8 text-center text-zinc-400 text-sm">No modules yet.<br>Click “New Module” above 👆</li>`;
    }
}

// Select a module and show its content
function selectModule(id) {
    currentModuleId = id;
    renderModulesList();
    
    const module = data.modules.find(m => m.id === id);
    if (!module) return;

    // Update header
    document.getElementById('current-module-name').innerHTML = `
        ${module.name}
        <span onclick="editModuleName(event)" class="text-xs ml-2 bg-white/10 px-3 py-1 rounded-2xl hover:bg-white/20">edit</span>
    `;

    // Hide no-module screen
    document.getElementById('no-module-selected').style.display = 'none';

    // Render section tabs
    renderSectionTabs();

    // Show first section by default (or the current one)
    renderCurrentSection();
}

// Render the three tabs: Videos / Files / Websites
function renderSectionTabs() {
    const container = document.getElementById('section-tabs');
    const sections = [
        { key: 'videos', label: '🎥 Videos', icon: '🎥' },
        { key: 'files', label: '📄 Files', icon: '📄' },
        { key: 'websites', label: '🔗 Websites', icon: '🔗' }
    ];

    container.innerHTML = sections.map(sec => {
        const active = sec.key === currentSectionKey ? 'bg-white text-zinc-900 shadow-inner' : 'hover:bg-zinc-700';
        return `
            <button onclick="switchSection('${sec.key}')" 
                    class="flex items-center gap-2 px-5 py-2 rounded-3xl ${active}">
                <span>${sec.icon}</span>
                <span class="font-semibold">${sec.label}</span>
            </button>
        `;
    }).join('');
}

// Switch between Videos / Files / Websites inside current module
function switchSection(key) {
    currentSectionKey = key;
    renderSectionTabs();
    renderCurrentSection();
}

// Main rendering of the selected section
function renderCurrentSection() {
    const module = data.modules.find(m => m.id === currentModuleId);
    if (!module) return;

    const sectionData = module.sections[currentSectionKey];
    const main = document.getElementById('main-content');

    let html = `
        <div class="mb-8 flex items-center justify-between">
            <h3 class="text-3xl font-semibold capitalize">${currentSectionKey}</h3>
            <button onclick="addTopic()" 
                    class="flex items-center gap-2 bg-white text-zinc-900 px-6 py-3 rounded-3xl font-semibold hover:scale-105">
                <span class="text-xl">+</span> New Topic Folder
            </button>
        </div>
    `;

    if (!sectionData.topics || sectionData.topics.length === 0) {
        html += `
            <div class="border border-dashed border-zinc-700 rounded-3xl p-12 text-center">
                <div class="text-6xl mb-4">📂</div>
                <p class="text-zinc-400">No topics yet in this section.</p>
                <button onclick="addTopic()" class="mt-6 text-violet-300 underline">Create first topic folder →</button>
            </div>`;
        main.innerHTML = html;
        return;
    }

    // Render each topic as an accordion card
    sectionData.topics.forEach(topic => {
        html += `
            <div class="mb-6 bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden">
                <!-- Topic header -->
                <div onclick="toggleAccordion('${topic.id}')" 
                     class="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-zinc-800">
                    <div class="flex items-center gap-4">
                        <span class="text-3xl">📁</span>
                        <h4 class="text-xl font-semibold">${topic.name}</h4>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="event.stopImmediatePropagation(); editTopic('${topic.id}');" 
                                class="text-xs px-4 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-2xl">edit</button>
                        <button onclick="event.stopImmediatePropagation(); deleteTopic('${topic.id}');" 
                                class="text-xs px-4 py-1 bg-red-900/30 hover:bg-red-900/70 text-red-300 rounded-2xl">delete</button>
                        <span class="text-2xl transition-transform" id="arrow-${topic.id}">›</span>
                    </div>
                </div>

                <!-- Items container -->
                <div id="accordion-${topic.id}" class="accordion-content px-6 pb-6 hidden">
                    <div class="flex justify-end mb-4">
                        <button onclick="addItem('${topic.id}')" 
                                class="text-sm flex items-center gap-1 text-violet-300 hover:text-violet-200">
                            <span class="text-xl">+</span> Add ${currentSectionKey === 'videos' ? 'video' : currentSectionKey === 'files' ? 'file' : 'website'}
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${topic.items.map(item => {
                            let actionHTML = '';

                            if (currentSectionKey === 'videos') {
                                actionHTML = `
                                    <button onclick="playVideo('${item.id}', '${topic.id}'); event.stopImmediatePropagation();" 
                                            class="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-6 py-2 rounded-3xl">▶ Play in app</button>`;
                            } else {
                                actionHTML = `
                                    <a href="${item.url}" target="_blank" 
                                       onclick="event.stopImmediatePropagation();"
                                       class="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium px-6 py-2 rounded-3xl">
                                        ${currentSectionKey === 'files' ? '📥 Download' : '🔗 Visit'} 
                                    </a>`;
                            }

                            return `
                                <div class="bg-zinc-800 rounded-3xl p-5 flex flex-col">
                                    <div class="flex-1">
                                        <div class="font-semibold text-lg">${item.title}</div>
                                        <div class="text-xs text-zinc-400 mt-1 break-all">${item.url}</div>
                                    </div>
                                    <div class="flex justify-between items-end mt-6">
                                        ${actionHTML}
                                        <div class="flex gap-2">
                                            <button onclick="event.stopImmediatePropagation(); editItem('${topic.id}', '${item.id}');" 
                                                    class="text-xs px-3 py-1 text-zinc-300 hover:text-white">✏️</button>
                                            <button onclick="event.stopImmediatePropagation(); deleteItem('${topic.id}', '${item.id}');" 
                                                    class="text-xs px-3 py-1 text-red-300 hover:text-red-400">🗑️</button>
                                        </div>
                                    </div>
                                </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
    });

    main.innerHTML = html;
}

// Toggle accordion for a topic
function toggleAccordion(topicId) {
    const content = document.getElementById(`accordion-${topicId}`);
    const arrow = document.getElementById(`arrow-${topicId}`);
    
    if (content.classList.contains('hidden')) {
        content.style.display = 'block';
        content.classList.remove('hidden');
        arrow.style.transform = 'rotate(90deg)';
    } else {
        content.style.display = 'none';
        content.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// ====================== CRUD OPERATIONS ======================

function addModule() {
    const name = prompt('New module name (e.g. Physics 202):', 'New Module');
    if (!name || name.trim() === '') return;
    
    const newModule = {
        id: 'm' + Date.now(),
        name: name.trim(),
        sections: {
            videos: { topics: [] },
            files: { topics: [] },
            websites: { topics: [] }
        }
    };
    data.modules.push(newModule);
    saveData();
    renderModulesList();
    selectModule(newModule.id);
}

function editModuleName(e) {
    if (e) e.stopImmediatePropagation();
    const module = data.modules.find(m => m.id === currentModuleId);
    if (!module) return;
    
    const newName = prompt('Rename module:', module.name);
    if (!newName || newName.trim() === module.name) return;
    
    module.name = newName.trim();
    saveData();
    selectModule(currentModuleId);
}

function deleteModule(id) {
    if (!confirm('Delete this entire module and all its content?')) return;
    data.modules = data.modules.filter(m => m.id !== id);
    saveData();
    currentModuleId = null;
    renderModulesList();
    showNoModuleScreen();
}

function goBackToModules() {
    currentModuleId = null;
    showNoModuleScreen();
    renderModulesList();
}

function showNoModuleScreen() {
    document.getElementById('no-module-selected').style.display = 'flex';
    document.getElementById('main-content').innerHTML = document.getElementById('no-module-selected').outerHTML;
}

// Topic
function addTopic() {
    const module = data.modules.find(m => m.id === currentModuleId);
    if (!module) return;
    
    const name = prompt(`New topic folder for ${currentSectionKey}:`, 'New Topic');
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
    const module = data.modules.find(m => m.id === currentModuleId);
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);
    if (!topic) return;
    
    const newName = prompt('Rename topic folder:', topic.name);
    if (!newName || newName === topic.name) return;
    
    topic.name = newName.trim();
    saveData();
    renderCurrentSection();
}

function deleteTopic(topicId) {
    if (!confirm('Delete this topic folder and ALL items inside?')) return;
    
    const module = data.modules.find(m => m.id === currentModuleId);
    const section = module.sections[currentSectionKey];
    section.topics = section.topics.filter(t => t.id !== topicId);
    
    saveData();
    renderCurrentSection();
}

// Item
function addItem(topicId) {
    showItemModal(topicId, null);
}

function editItem(topicId, itemId) {
    showItemModal(topicId, itemId);
}

function showItemModal(topicId, itemId) {
    const module = data.modules.find(m => m.id === currentModuleId);
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);
    let item = null;
    
    if (itemId) {
        item = topic.items.find(i => i.id === itemId);
    }
    
    const title = item ? item.title : '';
    const url = item ? item.url : '';
    
    let typeLabel = currentSectionKey === 'videos' ? 'Video URL (YouTube supported)' : 
                    currentSectionKey === 'files' ? 'File URL (PDF, slides…)' : 'Website URL';
    
    const modalHTML = `
        <h2 class="text-2xl font-semibold mb-6">${item ? 'Edit' : 'Add new'} ${currentSectionKey.slice(0, -1)}</h2>
        
        <div class="space-y-6">
            <div>
                <label class="text-sm text-zinc-400 block mb-1">Title</label>
                <input id="item-title-input" value="${title}" 
                       class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 outline-none focus:border-violet-400" 
                       placeholder="Enter a clear title">
            </div>
            
            <div>
                <label class="text-sm text-zinc-400 block mb-1">${typeLabel}</label>
                <input id="item-url-input" value="${url}" 
                       class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 outline-none focus:border-violet-400" 
                       placeholder="https://...">
            </div>
            
            <div class="flex gap-3 pt-4">
                <button onclick="hideModal()" 
                        class="flex-1 py-4 text-zinc-400 font-medium border border-zinc-700 rounded-3xl">Cancel</button>
                <button onclick="saveItem('${topicId}', '${itemId || ''}')" 
                        class="flex-1 py-4 bg-violet-600 hover:bg-violet-500 font-semibold rounded-3xl">Save ${currentSectionKey.slice(0, -1)}</button>
            </div>
        </div>`;
    
    showModal(modalHTML);
}

function saveItem(topicId, itemId) {
    const titleInput = document.getElementById('item-title-input').value.trim();
    const urlInput = document.getElementById('item-url-input').value.trim();
    
    if (!titleInput || !urlInput) {
        alert('Title and URL are required!');
        return;
    }
    
    const module = data.modules.find(m => m.id === currentModuleId);
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);
    
    if (itemId) {
        // edit
        const item = topic.items.find(i => i.id === itemId);
        item.title = titleInput;
        item.url = urlInput;
    } else {
        // add
        if (!topic.items) topic.items = [];
        topic.items.push({
            id: 'i' + Date.now(),
            title: titleInput,
            url: urlInput
        });
    }
    
    hideModal();
    saveData();
    renderCurrentSection();
}

function deleteItem(topicId, itemId) {
    if (!confirm('Delete this item?')) return;
    
    const module = data.modules.find(m => m.id === currentModuleId);
    const topic = module.sections[currentSectionKey].topics.find(t => t.id === topicId);
    topic.items = topic.items.filter(i => i.id !== itemId);
    
    saveData();
    renderCurrentSection();
}

// Video player
function playVideo(itemId, topicId) {
    const module = data.modules.find(m => m.id === currentModuleId);
    const topic = module.sections.videos.topics.find(t => t.id === topicId);
    const item = topic.items.find(i => i.id === itemId);
    if (!item) return;
    
    let embedUrl = item.url;
    
    // Convert normal YouTube links to embed
    if (embedUrl.includes('youtube.com/watch?v=')) {
        const videoId = embedUrl.split('v=')[1].split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (embedUrl.includes('youtu.be/')) {
        const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    const container = document.getElementById('video-player-container');
    container.innerHTML = `
        <iframe width="100%" height="100%" 
                src="${embedUrl}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>`;
    
    document.getElementById('video-modal-title').textContent = item.title;
    document.getElementById('video-modal').classList.remove('hidden');
    document.getElementById('video-modal').classList.add('flex');
}

function hideVideoModal() {
    const modal = document.getElementById('video-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    // Clear iframe so video stops
    document.getElementById('video-player-container').innerHTML = '';
}

// Modal helpers
function showModal(html) {
    const backdrop = document.getElementById('modal-backdrop');
    const contentContainer = document.getElementById('modal-content');
    contentContainer.innerHTML = html;
    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');
}

function hideModal() {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.classList.add('hidden');
    backdrop.classList.remove('flex');
}

// JSON import / export
function downloadJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'univault-modules-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 JSON downloaded – keep it safe!');
}

function loadJSONFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const imported = JSON.parse(ev.target.result);
            if (imported.modules && Array.isArray(imported.modules)) {
                data = imported;
                saveData();
                renderModulesList();
                if (data.modules.length > 0) selectModule(data.modules[0].id);
                showToast('✅ Imported new data successfully');
            } else {
                throw new Error('Invalid format');
            }
        } catch (err) {
            alert('❌ Invalid JSON file. Make sure it matches the original structure.');
        }
    };
    reader.readAsText(file);
}

function resetToSampleData() {
    if (!confirm('Reset everything to the original sample data? You will lose all your edits.')) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
}

// Help
function showHelp() {
    const helpText = `UniVault is fully offline and stores everything in your browser.\n\n• Add modules, topics, videos, PDFs, links\n• Videos play directly inside the site (YouTube links auto-embed)\n• All changes saved automatically\n• Download JSON anytime to backup or share\n\nEnjoy your studies! 📖`;
    alert(helpText);
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toast-text');
    text.innerHTML = message;
    toast.classList.remove('hidden');
    toast.classList.add('toast-enter');
    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('toast-enter');
    }, 2800);
}

// ====================== START THE APP ======================
window.onload = function() {
    initTailwind();
    loadData();
};