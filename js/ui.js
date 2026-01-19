// --- 界面交互逻辑 (js/ui.js) ---

// DOM 元素缓存 (将在脚本加载时初始化)
const screens = document.querySelectorAll('.screen');
const homeScreen = document.getElementById('home-screen');
const chatRoomScreen = document.getElementById('chat-room-screen');
const chatExpansionPanel = document.getElementById('chat-expansion-panel');
const panelFunctionArea = document.getElementById('panel-function-area');
const panelStickerArea = document.getElementById('panel-sticker-area');
const messageArea = document.getElementById('message-area');
const chatRoomHeaderDefault = document.getElementById('chat-room-header-default');
const chatRoomHeaderSelect = document.getElementById('chat-room-header-select');
const multiSelectBar = document.getElementById('multi-select-bar');
const multiSelectTitle = document.getElementById('multi-select-title');
const selectCount = document.getElementById('select-count');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const chatRoomTitle = document.getElementById('chat-room-title');
const chatRoomStatusText = document.getElementById('chat-room-status-text');
const typingIndicator = document.getElementById('typing-indicator');
const messageInput = document.getElementById('message-input');
const getReplyBtn = document.getElementById('get-reply-btn');
const regenerateBtn = document.getElementById('regenerate-btn');

// 屏幕切换
const switchScreen = (targetId) => {
    // 离开聊天室时清理自定义样式
    if (targetId !== 'chat-room-screen') {
        const customStyles = document.querySelectorAll('style[id^="custom-bubble-style-for-"]');
        customStyles.forEach(style => style.remove());
    } else {
        // 返回聊天室时重新应用样式
        if (typeof currentChatId !== 'undefined' && currentChatId) {
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            if (chat) {
                updateCustomBubbleStyle(currentChatId, chat.customBubbleCss, chat.useCustomBubbleCss);
            }
        }
    }

    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(targetId);
    if (targetScreen) targetScreen.classList.add('active');

    // 关闭所有覆盖层和侧边栏
    const overlays = document.querySelectorAll('.modal-overlay, .action-sheet-overlay, .settings-sidebar');
    overlays.forEach(o => o.classList.remove('visible', 'open'));

    // 离开设置页面时清空CSS预览区域，防止预览样式(可能是全局的)污染其他页面
    if (targetId !== 'chat-settings-screen' && targetId !== 'group-settings-screen') {
        const previewContainers = document.querySelectorAll('.bubble-css-preview');
        previewContainers.forEach(el => el.innerHTML = '');
    }

    // 控制全局底栏显示与状态
    const globalNav = document.getElementById('global-bottom-nav');
    if (globalNav) {
        if (targetId === 'chat-list-screen' || targetId === 'contacts-screen' || targetId === 'more-screen' || targetId === 'phone-screen') {
            globalNav.style.display = 'flex';
            // 更新选中状态
            const navItems = globalNav.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                if (item.getAttribute('data-target') === targetId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        } else {
            globalNav.style.display = 'none';
        }
    }

    if (targetId === 'more-screen') {
        renderMoreScreen();
    }
};

function renderMoreScreen() {
    let myName = 'User Name';
    let myAvatar = 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg';

    let activePersona = null;
    if (db.activePersonaId) {
        activePersona = db.myPersonaPresets.find(p => p.id === db.activePersonaId);
    }

    if (!activePersona && db.myPersonaPresets && db.myPersonaPresets.length > 0) {
        activePersona = db.myPersonaPresets[0];
    }

    if (activePersona) {
        myName = activePersona.name || 'User';
        myAvatar = activePersona.avatar || myAvatar;
    } else if (db.characters && db.characters.length > 0) {
        const firstChar = db.characters[0];
        myName = firstChar.myName || 'User Name';
        myAvatar = firstChar.myAvatar || 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg';
    }

    const avatarEl = document.getElementById('more-my-avatar');
    const nameEl = document.getElementById('more-my-name');
    const dateEl = document.getElementById('more-date-display');

    if (avatarEl) avatarEl.src = myAvatar;
    if (nameEl) nameEl.textContent = myName;

    // 更新日期显示 (格式: YYYY#MMDD)
    if (dateEl) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateEl.textContent = `${year}#${month}${day}`;
    }

    // 应用自定义背景图
    const bgLayer = document.querySelector('.glass-background-layer');
    if (bgLayer && db.moreProfileCardBg) {
        bgLayer.style.backgroundImage = `url('${db.moreProfileCardBg}')`;
    }
}

function setupMoreCardBgModal() {
    const modal = document.getElementById('more-card-bg-modal');
    const form = document.getElementById('more-card-bg-form');
    const preview = document.getElementById('more-card-bg-preview');
    const urlInput = document.getElementById('more-card-bg-url-input');
    const fileUpload = document.getElementById('more-card-bg-file-upload');

    // 绑定点击事件到背景层
    // 注意：由于 renderMoreScreen 可能会被多次调用，我们需要使用事件委托或者确保只绑定一次
    // 这里我们使用事件委托绑定到 document，在 renderMoreScreen 中不需要重复绑定
    document.body.addEventListener('click', (e) => {
        // 只要点击了更多界面的个人卡片区域（包括背景和内容），都触发更换背景
        // 这样可以避免因为内容层遮挡背景层导致点击无效
        if (e.target.closest('.more-profile-card.custom-glass-style')) {
            // 打开模态框
            modal.classList.add('visible');
            urlInput.value = '';
            fileUpload.value = null;
            preview.style.backgroundImage = `url('${db.moreProfileCardBg || 'https://i.postimg.cc/XvFDdTKY/Smart-Select-20251013-023208.jpg'}')`;
            preview.innerHTML = '';
        }
    });

    // URL 输入预览
    urlInput.addEventListener('input', () => {
        if (urlInput.value) {
            preview.style.backgroundImage = `url('${urlInput.value}')`;
            preview.innerHTML = '';
        }
    });

    // 文件上传预览
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.style.backgroundImage = `url('${e.target.result}')`;
                preview.innerHTML = '';
                // 临时存储 base64，提交时使用
                fileUpload.dataset.base64 = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 保存
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let newBg = db.moreProfileCardBg;

        if (fileUpload.files.length > 0 && fileUpload.dataset.base64) {
            newBg = fileUpload.dataset.base64;
        } else if (urlInput.value) {
            newBg = urlInput.value;
        }

        if (newBg !== db.moreProfileCardBg) {
            db.moreProfileCardBg = newBg;
            await saveData();
            renderMoreScreen(); // 重新渲染以应用更改
            showToast('背景已更新');
        }

        modal.classList.remove('visible');
        // 清理
        fileUpload.dataset.base64 = '';
    });
}

// 右键菜单
function createContextMenu(items, x, y) {
    removeContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    menu.style.visibility = 'hidden';
    document.body.appendChild(menu);

    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        if (item.danger) menuItem.classList.add('danger');
        menuItem.textContent = item.label;
        menuItem.onclick = () => {
            item.action();
            removeContextMenu();
        };
        menu.appendChild(menuItem);
    });

    const rect = menu.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    if (x + rect.width > winWidth) {
        x = winWidth - rect.width - 10;
    }

    if (y + rect.height > winHeight) {
        y = y - rect.height;
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.visibility = 'visible';

    document.addEventListener('click', removeContextMenu, {
        once: true
    });
}

function removeContextMenu() {
    const menu = document.querySelector('.context-menu');
    if (menu) menu.remove();
}

// 更新气泡样式
function updateCustomBubbleStyle(chatId, css, enabled) {
    const STYLE_TAG_CLASS = 'dynamic-chat-style-tag';
    const existingStyles = document.querySelectorAll(`.${STYLE_TAG_CLASS}, style[id^="custom-bubble-style-for-"]`);
    existingStyles.forEach(el => el.remove());

    if (!enabled || !css) return;

    const styleElement = document.createElement('style');
    styleElement.id = `custom-bubble-style-for-${chatId}`;
    styleElement.className = STYLE_TAG_CLASS;

    styleElement.textContent = `
        #chat-room-screen {
            ${css}
        }
    `;

    document.head.appendChild(styleElement);
}

function updateBubbleCssPreview(previewContainer, css, useDefault, theme) {
    previewContainer.innerHTML = '';

    const sentBubble = document.createElement('div');
    sentBubble.className = 'message-bubble sent';
    sentBubble.textContent = '这是我方气泡。';
    sentBubble.style.alignSelf = 'flex-end';
    sentBubble.style.borderBottomRightRadius = '5px';

    const receivedBubble = document.createElement('div');
    receivedBubble.className = 'message-bubble received';
    receivedBubble.textContent = '这是对方气泡。';
    receivedBubble.style.alignSelf = 'flex-start';
    receivedBubble.style.borderBottomLeftRadius = '5px';

    [sentBubble, receivedBubble].forEach(bubble => {
        bubble.style.maxWidth = '70%';
        bubble.style.padding = '8px 12px';
        bubble.style.wordWrap = 'break-word';
        bubble.style.lineHeight = '1.4';
    });

    if (useDefault || !css) {
        sentBubble.style.backgroundColor = theme.sent.bg;
        sentBubble.style.color = theme.sent.text;
        sentBubble.style.borderRadius = '18px';
        sentBubble.style.borderBottomRightRadius = '5px';
        receivedBubble.style.backgroundColor = theme.received.bg;
        receivedBubble.style.color = theme.received.text;
        receivedBubble.style.borderRadius = '18px';
        receivedBubble.style.borderBottomLeftRadius = '5px';
    } else {
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            #${previewContainer.id} {
                ${css}
            }
        `;
        previewContainer.appendChild(styleTag);
    }
    previewContainer.appendChild(receivedBubble);
    previewContainer.appendChild(sentBubble);
}

// 主屏幕逻辑
let currentPageIndex = 0;

function setupHomeScreen() {
    const getIcon = (id) => db.customIcons[id] || defaultIcons[id].url;
    if (!db.insWidgetSettings) {
        db.insWidgetSettings = {
            avatar1: 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg',
            bubble1: '„- ω -„',
            avatar2: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg',
            bubble2: 'ｷ...✩'
        };
    }
    const insWidget = db.insWidgetSettings;

    const homeScreenHTML = `
    <div class="home-screen-swiper">
        <div class="home-screen-page">
            <div class="home-widget-container">
                <div class="central-circle" style="background-image: url('${db.homeWidgetSettings.centralCircleImage}');"></div>
                <div class="satellite-oval oval-top-left" data-widget-part="topLeft">
                    <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.topLeft.emoji || '❤️'}</span>
                    <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.topLeft.text}</span>
                </div>
                <div class="satellite-oval oval-top-right" data-widget-part="topRight">
                    <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.topRight.emoji || '🧡'}</span>
                    <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.topRight.text}</span>
                </div>
                <div class="satellite-oval oval-bottom-left" data-widget-part="bottomLeft">
                    <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.bottomLeft.emoji || '💛'}</span>
                    <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.bottomLeft.text}</span>
                </div>
                <div class="satellite-oval oval-bottom-right" data-widget-part="bottomRight">
                    <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.bottomRight.emoji || '💙'}</span>
                    <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.bottomRight.text}</span>
                </div>


                <div class="widget-time" id="time-display"></div>
                <div contenteditable="true" class="widget-signature" id="widget-signature" placeholder="编辑个性签名..."></div>
                <div class="widget-date" id="date-display"></div>
                <div class="widget-battery">
                    <svg width="32" height="23" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 2.5C1 1.94772 1.44772 1.5 2 1.5H20C20.5523 1.5 21 1.94772 21 2.5V9.5C21 10.0523 20.5523 10.5 20 10.5H2C1.44772 10.5 1 10.0523 1 9.5V2.5Z" stroke="#666" stroke-opacity="0.8" stroke-width="1"/>
                        <path d="M22.5 4V8" stroke="#666" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/>
                        <rect id="battery-fill-rect" x="2" y="2.5" width="18" height="7" rx="0.5" fill="#666" fill-opacity="0.8"/>
                    </svg>
                    <span id="battery-level">--%</span>
                </div>
            </div>
            <div class="app-grid">
                <div class="app-grid-widget-container">
                   <div class="app-grid-widget">
                        <div class="ins-widget">
                            <div class="ins-widget-row user">
                                <img src="${insWidget.avatar1}" alt="Character Avatar" class="ins-widget-avatar" id="ins-widget-avatar-1">
                                <div class="ins-widget-bubble" id="ins-widget-bubble-1" contenteditable="true">${insWidget.bubble1}</div>
                            </div>
                            <div class="ins-widget-divider"><span>୨୧</span></div>
                            <div class="ins-widget-row character">
                                <div class="ins-widget-bubble" id="ins-widget-bubble-2" contenteditable="true">${insWidget.bubble2}</div>
                                <img src="${insWidget.avatar2}" alt="User Avatar" class="ins-widget-avatar" id="ins-widget-avatar-2">
                            </div>
                        </div>
                   </div>
                </div>
                <a href="#" class="app-icon" data-target="chat-list-screen"><img src="${getIcon('chat-list-screen')}" alt="404" class="icon-img"><span class="app-name">${defaultIcons['chat-list-screen'].name}</span></a>
                <a href="#" class="app-icon" data-target="api-settings-screen"><img src="${getIcon('api-settings-screen')}" alt="API" class="icon-img"><span class="app-name">${defaultIcons['api-settings-screen'].name}</span></a>
                <a href="#" class="app-icon" data-target="wallpaper-screen"><img src="${getIcon('wallpaper-screen')}" alt="Wallpaper" class="icon-img"><span class="app-name">${defaultIcons['wallpaper-screen'].name}</span></a>
                <a href="#" class="app-icon" data-target="world-book-screen"><img src="${getIcon('world-book-screen')}" alt="World Book" class="icon-img"><span class="app-name">${defaultIcons['world-book-screen'].name}</span></a>
                <a href="#" class="app-icon" data-target="customize-screen"><img src="${getIcon('customize-screen')}" alt="Customize" class="icon-img"><span class="app-name">${defaultIcons['customize-screen'].name}</span></a>
                <a href="#" class="app-icon" data-target="tutorial-screen"><img src="${getIcon('tutorial-screen')}" alt="Tutorial" class="icon-img"><span class="app-name">${defaultIcons['tutorial-screen'].name}</span></a>
                <div class="heart-photo-widget"></div>
            </div>
        </div>

        <div class="home-screen-page">
             <div class="app-grid">
                <a href="#" class="app-icon" data-target="pomodoro-screen">
                    <img src="${getIcon('pomodoro-screen')}" alt="番茄钟" class="icon-img">
                    <span class="app-name">${defaultIcons['pomodoro-screen'].name}</span>
                </a>
                <a href="#" class="app-icon" data-target="forum-screen">
                    <img src="${getIcon('forum-screen')}" alt="论坛" class="icon-img">
                    <span class="app-name">${defaultIcons['forum-screen'].name}</span>
                </a>
                <a href="#" class="app-icon" data-target="bubble-maker-screen">
                    <img src="${getIcon('bubble-maker-screen')}" alt="创意工坊" class="icon-img">
                    <span class="app-name">${defaultIcons['bubble-maker-screen'].name}</span>
                </a>
             </div>
        </div>

    </div>
    <div class="page-indicator">
        <span class="dot active" data-page="0"></span>
        <span class="dot" data-page="1"></span>
    </div>
    <div class="dock">
        <a href="#" class="app-icon" id="day-mode-btn"><img src="${getIcon('day-mode-btn')}" alt="日间" class="icon-img"></a>
        <a href="#" class="app-icon" id="night-mode-btn"><img src="${getIcon('night-mode-btn')}" alt="夜间" class="icon-img"></a>
        <a href="#" class="app-icon" data-target="storage-analysis-screen"><img src="${getIcon('storage-analysis-screen')}" alt="存储" class="icon-img"></a>
    </div>`;
    homeScreen.innerHTML = homeScreenHTML;

    const polaroidImage = db.homeWidgetSettings ? .polaroidImage;
    if (polaroidImage) {
        updatePolaroidImage(polaroidImage);
    }

    updateClock();
    applyWallpaper(db.wallpaper);
    applyHomeScreenMode(db.homeScreenMode);

    document.getElementById('day-mode-btn') ? .addEventListener('click', (e) => {
        e.preventDefault();
        applyHomeScreenMode('day');
    });
    document.getElementById('night-mode-btn') ? .addEventListener('click', (e) => {
        e.preventDefault();
        applyHomeScreenMode('night');
    });

    document.querySelector('[data-target="world-book-screen"]').addEventListener('click', renderWorldBookList);
    document.querySelector('[data-target="customize-screen"]').addEventListener('click', renderCustomizeForm);
    document.querySelector('[data-target="tutorial-screen"]').addEventListener('click', renderTutorialContent);
    updateBatteryStatus();

    const homeWidgetContainer = homeScreen.querySelector('.home-widget-container');

    // Central Circle Click
    const centralCircle = homeWidgetContainer.querySelector('.central-circle');
    if (centralCircle) {
        centralCircle.addEventListener('click', () => {
            const modal = document.getElementById('ins-widget-avatar-modal');
            const preview = document.getElementById('ins-widget-avatar-preview');
            const urlInput = document.getElementById('ins-widget-avatar-url-input');
            const fileUpload = document.getElementById('ins-widget-avatar-file-upload');
            const targetInput = document.getElementById('ins-widget-avatar-target');

            targetInput.value = 'centralCircle';
            preview.style.backgroundImage = `url("${db.homeWidgetSettings.centralCircleImage}")`;
            preview.innerHTML = '';
            urlInput.value = '';
            fileUpload.value = null;
            modal.classList.add('visible');
        });
    }

    // Blur to Save Logic
    homeScreen.addEventListener('blur', async (e) => {
        const target = e.target;
        if (target.hasAttribute('contenteditable')) {
            const oval = target.closest('.satellite-oval');
            if (oval) {
                const part = oval.dataset.widgetPart;
                const prop = target.classList.contains('satellite-emoji') ? 'emoji' : 'text';
                const newValue = target.textContent.trim();

                if (db.homeWidgetSettings[part] && db.homeWidgetSettings[part][prop] !== newValue) {
                    db.homeWidgetSettings[part][prop] = newValue;
                    await saveData();
                    showToast('小组件已更新');
                }
            } else if (target.id === 'widget-signature') {
                const newSignature = target.textContent.trim();
                if (db.homeSignature !== newSignature) {
                    db.homeSignature = newSignature;
                    await saveData();
                    showToast('签名已保存');
                }
            } else if (target.id === 'ins-widget-bubble-1' || target.id === 'ins-widget-bubble-2') {
                const bubbleId = target.id === 'ins-widget-bubble-1' ? 'bubble1' : 'bubble2';
                const newText = target.textContent.trim();
                if (db.insWidgetSettings[bubbleId] !== newText) {
                    db.insWidgetSettings[bubbleId] = newText;
                    await saveData();
                    showToast('小组件文字已保存');
                }
            }
        }
    }, true);

    const signatureWidget = document.getElementById('widget-signature');
    if (signatureWidget) {
        signatureWidget.textContent = db.homeSignature || '';
    }

    // Home Screen Swipe Logic
    const swiper = homeScreen.querySelector('.home-screen-swiper');
    let touchStartX = 0;
    let touchEndX = 0;
    const totalPages = 2;
    const swipeThreshold = 50;
    let isDragging = false;

    swiper.style.transform = `translateX(-${currentPageIndex * 100 / totalPages}%)`;
    updatePageIndicator(currentPageIndex);

    swiper.addEventListener('touchstart', (e) => {
        if (e.target.closest('[contenteditable]')) return;
        isDragging = true;
        touchStartX = e.changedTouches[0].screenX;
        touchEndX = e.changedTouches[0].screenX;
    }, {
        passive: true
    });

    swiper.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        touchEndX = e.changedTouches[0].screenX;
    }, {
        passive: true
    });

    swiper.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        handleSwipe();
    });

    swiper.addEventListener('mousedown', (e) => {
        if (e.target.closest('[contenteditable]')) return;
        e.preventDefault();
        isDragging = true;
        touchStartX = e.screenX;
        touchEndX = e.screenX;
        swiper.style.cursor = 'grabbing';
    });

    swiper.addEventListener('mousemove', (e) => {
        if (isDragging) {
            touchEndX = e.screenX;
        }
    });

    swiper.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            swiper.style.cursor = 'grab';
            handleSwipe();
        }
    });

    swiper.addEventListener('mouseleave', (e) => {
        if (isDragging) {
            isDragging = false;
            swiper.style.cursor = 'grab';
            touchStartX = 0;
            touchEndX = 0;
        }
    });

    function handleSwipe() {
        if (touchEndX === 0 && touchStartX === 0) return;

        const deltaX = touchEndX - touchStartX;

        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX < 0 && currentPageIndex < totalPages - 1) {
                currentPageIndex++;
            } else if (deltaX > 0 && currentPageIndex > 0) {
                currentPageIndex--;
            }
        }

        swiper.style.transform = `translateX(-${currentPageIndex * 100 / totalPages}%)`;
        updatePageIndicator(currentPageIndex);

        touchStartX = 0;
        touchEndX = 0;
    }

    homeScreen.addEventListener('click', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.hasAttribute('contenteditable') && e.target !== activeEl) {
            activeEl.blur();
        }
    });

    homeScreen.querySelectorAll('.satellite-emoji').forEach(span => {
        span.addEventListener('input', (e) => {
            const chars = [...e.target.textContent];
            if (chars.length > 1) {
                e.target.textContent = chars[0];
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(e.target);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    });
}

function updateClock() {
    const now = new Date();
    const timeString = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const dateString = `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日`;

    const homeTimeDisplay = document.getElementById('time-display');
    const homeDateDisplay = document.getElementById('date-display');
    if (homeTimeDisplay) homeTimeDisplay.textContent = timeString;
    if (homeDateDisplay) homeDateDisplay.textContent = dateString;

    const peekTimeDisplay = document.getElementById('peek-time-display');
    const peekDateDisplay = document.getElementById('peek-date-display');
    if (peekTimeDisplay) peekTimeDisplay.textContent = timeString;
    if (peekDateDisplay) peekDateDisplay.textContent = dateString;
}

function updatePageIndicator(index) {
    const dots = document.querySelectorAll('.page-indicator .dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function applyWallpaper(url) {
    if (homeScreen) homeScreen.style.backgroundImage = `url(${url})`;
}

async function applyHomeScreenMode(mode) {
    if (mode === 'day') {
        homeScreen.classList.add('day-mode');
    } else {
        homeScreen.classList.remove('day-mode');
    }
    db.homeScreenMode = mode;
    await saveData();
}

function applyGlobalFont(fontUrl) {
    const styleId = 'global-font-style';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }
    if (fontUrl) {
        const fontName = 'CustomGlobalFont';
        styleElement.innerHTML = `@font-face { font-family: '${fontName}'; src: url('${fontUrl}'); } :root { --font-family: '${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }`;
    } else {
        styleElement.innerHTML = `:root { --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }`;
    }
}

function applyGlobalCss(css) {
    const styleId = 'global-css-style';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = css || '';
}

function applyFontSize(scale) {
    document.documentElement.style.setProperty('--app-font-scale', scale);
}

// 统一面板控制函数
function showPanel(type) {
    const toggleExpansionBtn = document.getElementById('toggle-expansion-btn');

    if (type === 'none') {
        chatExpansionPanel.classList.remove('visible');
        if (toggleExpansionBtn) toggleExpansionBtn.classList.remove('rotate-45');
        return;
    }

    chatExpansionPanel.classList.add('visible');

    if (type === 'function') {
        panelFunctionArea.style.display = 'flex';
        panelStickerArea.style.display = 'none';
        if (toggleExpansionBtn) toggleExpansionBtn.classList.add('rotate-45');
    } else if (type === 'sticker') {
        panelFunctionArea.style.display = 'none';
        panelStickerArea.style.display = 'flex';
        if (toggleExpansionBtn) toggleExpansionBtn.classList.remove('rotate-45');
        renderStickerCategories();
        renderStickerGrid();
    }

    setTimeout(() => {
        messageArea.scrollTop = messageArea.scrollHeight;
    }, 50);
}

// 底部导航栏逻辑
function setupBottomNavigation() {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                // 切换屏幕
                switchScreen(targetId);

                // 更新所有底部导航栏的选中状态
                document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => {
                    if (nav.getAttribute('data-target') === targetId) {
                        nav.classList.add('active');
                    } else {
                        nav.classList.remove('active');
                    }
                });
            }
        });
    });
}

function setupPhoneScreen() {
    const bubble = document.getElementById('burnout-bubble');
    if (bubble) {
        bubble.addEventListener('click', () => {
            document.getElementById('burnout-update-modal').classList.add('visible');
        });
    }
}