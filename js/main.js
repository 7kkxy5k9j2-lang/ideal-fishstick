// --- 主程序入口 (js/main.js) ---

const init = async () => {
    await loadData();
    if (!db.homeWidgetSettings || !db.homeWidgetSettings.topLeft) {
        db.homeWidgetSettings = JSON.parse(JSON.stringify(defaultWidgetSettings));
    }

    // 全局点击事件委托
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.context-menu')) {
            e.stopPropagation();
            return;
        }
        removeContextMenu();

        const backBtn = e.target.closest('.back-btn');
        if (backBtn) {
            e.preventDefault();
            switchScreen(backBtn.getAttribute('data-target'));
        }

        const openOverlay = document.querySelector('.modal-overlay.visible, .action-sheet-overlay.visible');
        if (openOverlay && e.target === openOverlay) {
            openOverlay.classList.remove('visible');
        }
    });

    // 导航栏跳转
    document.body.addEventListener('click', e => {
        const navLink = e.target.closest('.app-icon[data-target]');
        if (navLink) {
            e.preventDefault();
            const target = navLink.getAttribute('data-target');
            if (target === 'music-screen' || target === 'diary-screen' || target === 'piggy-bank-screen') {
                showToast('该应用正在开发中，敬请期待！');
                return;
            }
            switchScreen(target);
        }
    });

    // 定时任务
    updateClock();
    setInterval(updateClock, 30000);
    setInterval(checkAutoReply, 60000);

    // 应用全局设置
    applyGlobalFont(db.fontUrl);
    applyGlobalCss(db.globalCss);
    applyFontSize(db.fontSizeScale || 1.0);
    applyPomodoroBackgrounds();
    if (typeof applyThemeSettings === 'function') applyThemeSettings();

    // 初始化各个模块
    setupHomeScreen();
    setupChatListScreen();
    setupContactsScreen();
    setupBottomNavigation();
    setupAddCharModal();
    setupChatRoom();
    setupChatSettings();
    setupApiSettingsApp();
    setupWallpaperApp();
    await setupStickerSystem();
    setupPresetFeatures();
    setupVoiceMessageSystem();
    setupPhotoVideoSystem();
    setupImageRecognition();
    setupWalletSystem();
    setupGiftSystem();
    setupTimeSkipSystem();

    // 错误处理包裹的模块初始化
    try {
        setupWorldBookApp();
    } catch (e) {
        console.error("setupWorldBookApp failed:", e);
    }
    try {
        setupGroupChatSystem();
    } catch (e) {
        console.error("setupGroupChatSystem failed:", e);
    }
    try {
        setupCustomizeApp();
    } catch (e) {
        console.error("setupCustomizeApp failed:", e);
    }
    try {
        setupTutorialApp();
    } catch (e) {
        console.error("setupTutorialApp failed:", e);
    }

    checkForUpdates();
    setupPeekFeature();
    setupMemoryJournalScreen();
    setupDeleteHistoryChunk();
    setupForumBindingFeature();
    setupForumFeature();
    setupShareModal();
    setupStorageAnalysisScreen();
    setupPomodoroApp();
    setupPomodoroSettings();
    setupPomodoroGlobalSettings();
    setupInsWidgetAvatarModal();
    setupHeartPhotoModal();
    setupMoreCardBgModal();
    if (typeof initMoreMenu === 'function') initMoreMenu();
    if (typeof setupPhoneScreen === 'function') setupPhoneScreen();

    // 全局事件绑定
    const delWBBtn = document.getElementById('delete-selected-world-books-btn');
    if (delWBBtn) delWBBtn.addEventListener('click', deleteSelectedWorldBooks);

    const cancelWBBtn = document.getElementById('cancel-wb-multi-select-btn');
    if (cancelWBBtn) cancelWBBtn.addEventListener('click', exitWorldBookMultiSelectMode);

    if (window.GitHubMgr) {
        window.GitHubMgr.init();
    }
};

async function checkAutoReply() {
    const now = Date.now();
    for (const char of db.characters) {
        if (char.autoReply && char.autoReply.enabled) {
            const intervalMs = (char.autoReply.interval || 60) * 60 * 1000;
            const lastTriggerTime = char.autoReply.lastTriggerTime || 0;

            // 检查上次触发时间
            if (now - lastTriggerTime < intervalMs) continue;

            let lastMsgTime = 0;
            if (char.history && char.history.length > 0) {
                lastMsgTime = char.history[char.history.length - 1].timestamp;
            } else {
                // 如果没有历史记录，暂不触发，或者可以设置为创建时间
                continue;
            }

            // 检查无操作时间 (最后一条消息到现在的时间)
            if (now - lastMsgTime > intervalMs) {
                console.log(`Auto-reply triggered for ${char.remarkName}`);
                char.autoReply.lastTriggerTime = now;
                await saveData(); // 先保存触发时间，防止重复触发
                await getAiReply(char.id, 'private', true);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', init);