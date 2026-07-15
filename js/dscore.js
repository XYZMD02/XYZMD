/*核心应用逻辑：数据加载保存、消息渲染、会话管理等*/

        function clearAllAppData() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
    overlay.innerHTML = `
        <div style="background:var(--secondary-bg);border-radius:20px;padding:24px;width:88%;max-width:340px;box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:modalContentSlideIn 0.3s ease forwards;">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,80,80,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                    <i class="fas fa-trash-alt" style="color:#ff5050;font-size:20px;"></i>
                </div>
                <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">重置数据</div>
                <div style="font-size:12px;color:var(--text-secondary);">请选择要重置的范围</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <button id="_reset_current" style="width:100%;padding:12px 16px;border:1px solid var(--border-color);border-radius:12px;background:var(--primary-bg);color:var(--text-primary);font-size:13px;font-weight:600;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;transition:all 0.2s;">
                    <i class="fas fa-comment-slash" style="color:var(--accent-color);font-size:15px;width:18px;text-align:center;"></i>
                    <span>仅清除当前会话消息</span>
                </button>
                <button id="_reset_all" style="width:100%;padding:12px 16px;border:1px solid rgba(255,80,80,0.3);border-radius:12px;background:rgba(255,80,80,0.06);color:#ff5050;font-size:13px;font-weight:600;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;transition:all 0.2s;">
                    <i class="fas fa-bomb" style="font-size:15px;width:18px;text-align:center;"></i>
                    <span>重置所有数据（完全清空）</span>
                </button>
                <button id="_reset_cancel" style="width:100%;padding:10px 16px;border:none;border-radius:12px;background:none;color:var(--text-secondary);font-size:13px;cursor:pointer;transition:all 0.2s;">取消</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    function closeDialog() { overlay.remove(); }
    overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });
    const _resetCancelBtn = document.getElementById('_reset_cancel');
    const _resetCurrentBtn = document.getElementById('_reset_current');
    const _resetAllBtn = document.getElementById('_reset_all');

    if (_resetCancelBtn) _resetCancelBtn.onclick = closeDialog;

    if (_resetCurrentBtn) _resetCurrentBtn.onclick = () => {
        closeDialog();
        if (confirm('确定要清除当前会话的所有消息吗？此操作无法恢复！')) {
            messages = [];
            window.messages = messages; // 双保险：同步 window 属性
            displayedMessageCount = HISTORY_BATCH_SIZE;

            // 立即清除 localStorage 备份，防止 _tryRecoverFromBackup 在 IndexedDB 写入前恢复旧消息
            try { localStorage.removeItem('BACKUP_V1_critical'); } catch(e) {}
            try { localStorage.removeItem('BACKUP_V1_timestamp'); } catch(e) {}

            // 直接写入 IndexedDB（跳过 500ms 防抖），确保刷新后不恢复
            localforage.setItem(getStorageKey('chatMessages'), []).catch(() => {});

            renderMessages();
            showNotification('当前会话消息已清除', 'success');
        }
    };

    if (_resetAllBtn) _resetAllBtn.onclick = () => {
        closeDialog();
        if (confirm('【高危操作】确定要重置所有数据吗？此操作将清除所有本地数据且无法恢复！')) {
            window._skipBackup = true;
            messages = [];
            settings = {};
            localforage.clear().then(() => {
                localStorage.clear();
                showNotification('所有数据已重置，页面即将刷新', 'info', 2000);
                setTimeout(() => { window.location.href = window.location.pathname + '?reset=' + Date.now(); }, 2000);
            }).catch(e => {
                window._skipBackup = false;
                showNotification('清除数据时发生错误', 'error');
                console.error("清除 localforage 失败:", e);
            });
        }
    };
}

function loadMoreHistory() {
    const historyLoader = document.getElementById('history-loader');
    const container = DOMElements && DOMElements.chatContainer;
    const currentOldestMsgIndex = messages.length - displayedMessageCount;

    if (!container) return;
    if (isLoadingHistory) return;

    if (currentOldestMsgIndex <= 0) {
        if (historyLoader) historyLoader.style.display = 'none';
        return;
    }

    isLoadingHistory = true;
    if (historyLoader) historyLoader.style.display = 'flex';

    const visibleWrappers = Array.from(container.querySelectorAll('.message-wrapper'));
    const firstVisible = visibleWrappers.find(function(el) {
        return el.offsetTop + el.offsetHeight >= container.scrollTop;
    }) || visibleWrappers[0] || null;

    const anchorId = firstVisible ? firstVisible.dataset.msgId : null;
    const anchorTop = firstVisible ? firstVisible.getBoundingClientRect().top : 0;

    const prevVisibility = container.style.visibility;
    const prevOverflow = container.style.overflow;
    const prevScrollBehavior = container.style.scrollBehavior;
    const prevOpacity = container.style.opacity;

    container.style.opacity = '0.015';
    container.style.visibility = 'hidden';
    container.style.overflow = 'hidden';
    container.style.scrollBehavior = 'auto';

    setTimeout(() => {
        displayedMessageCount = Math.min(messages.length, displayedMessageCount + HISTORY_BATCH_SIZE);
        renderMessages(true);

        requestAnimationFrame(() => {
            if (anchorId) {
                const newAnchor = container.querySelector('[data-msg-id="' + anchorId + '"]');
                if (newAnchor) {
                    const newTop = newAnchor.getBoundingClientRect().top;
                    container.scrollTop += (newTop - anchorTop);
                }
            }

            requestAnimationFrame(() => {
                container.style.opacity = prevOpacity || '';
                container.style.visibility = prevVisibility || '';
                container.style.overflow = prevOverflow || '';
                container.style.scrollBehavior = prevScrollBehavior || '';

                if (historyLoader) {
                    historyLoader.style.display = (messages.length > displayedMessageCount) ? 'flex' : 'none';
                }
                isLoadingHistory = false;
            });
        });
    }, 120);
}


        function getDefaultSettings() {
            return {
                partnerName: "梦角",
                myName: "我",
                myStatus: "在线",
                partnerStatus: "在线",
                isDarkMode: false,
                colorTheme: "gold",
                soundEnabled: true,
                typingIndicatorEnabled: true,
                readReceiptsEnabled: true,
                replyEnabled: true,
                lastStatusChange: Date.now(),
                nextStatusChange: 1 + Math.random() * 7,
                fontSize: 16,
                bubbleStyle: 'standard',
                messageFontFamily: "'Noto Serif SC', serif",
                messageFontWeight: 400,
                messageLineHeight: 1.5,
                replyDelayMin: 3000,
                replyDelayMax: 7000,
                inChatAvatarEnabled: true,
                inChatAvatarSize: 36,
                inChatAvatarPosition: 'center',
                alwaysShowAvatar: false,
                showPartnerNameInChat: false,
                customFontUrl: "", 
        customBubbleCss: "",
        customGlobalCss: "",
                myAvatarFrame: null, 
                partnerAvatarFrame: null,
                myAvatarShape: 'circle',
                partnerAvatarShape: 'circle',
autoSendEnabled: false,
autoSendInterval: 5,
        moyuAutoGenerateEnabled: false,
        moyuAutoGenerateInterval: 60,
        moyuShowDetail: true,
        moyuDebugMode: false,
        moyuReportMinInterval: 10,
        moyuReportMaxInterval: 30,
        moyuReportMinUnit: 'minutes',
        moyuReportMaxUnit: 'minutes',
        partnerWithdrawChance: 0,
        // 查岗设置
        checkinPartnerActive: false,
        checkinNotify: true,
        checkinMinInterval: 10,
        checkinMaxInterval: 30,
        checkinMinUnit: 'minutes',
        checkinMaxUnit: 'minutes',
        // 信封投递设置
        envelopeAutoSendEnabled: false,
        envelopeAutoSendMinVal: 1,
        envelopeAutoSendMinUnit: 'hours',
        envelopeAutoSendMaxVal: 3,
        envelopeAutoSendMaxUnit: 'hours',
        envelopeCustomRuleEnabled: false,
        envelopeReplyMinVal: 10,
        envelopeReplyMinUnit: 'hours',
        envelopeReplyMaxVal: 24,
        envelopeReplyMaxUnit: 'hours',
        envelopeReplyMinSentences: 8,
        envelopeReplyMaxSentences: 12,
        // 主页绑定会话开关（默认开启）
        homeSessionBindEnabled: true,
        allowReadNoReply: false, 
        readNoReplyChance: 0.2,
        timeFormat: 'HH:mm',
        customSoundUrl: '',
        // 音效：两方分别可选（若对应 URL 为空则使用内置预设）
        mySendSoundPreset: 'tone_low',
        mySendCustomSoundUrl: '',
        partnerMessageSoundPreset: 'tone_low',
        partnerMessageCustomSoundUrl: '',
        myPokeSoundPreset: 'tone_low',
        myPokeCustomSoundUrl: '',
        partnerPokeSoundPreset: 'tone_low',
        partnerPokeCustomSoundUrl: '',
        partnerVoiceChance: 0,
        partnerVideoChance: 0,
        soundVolume: 0.15,
        bottomCollapseMode: false,
        emojiMixEnabled: true,
        kaomojiMixEnabled: true,
        enterKeySendEnabled: false
            };
        }


        function renderBackgroundGallery() {
            const list = document.getElementById('background-gallery-list');
            if (!list) return;

            list.innerHTML = '';

            
            const addBtn = document.createElement('div');
            addBtn.className = 'bg-item bg-add-btn';
            
            addBtn.innerHTML = '<i class="fas fa-plus"></i><span></span>';
            addBtn.onclick = () => document.getElementById('bg-gallery-input').click();
            list.appendChild(addBtn);

            const currentBg = safeGetItem(getStorageKey('chatBackground'));

            savedBackgrounds.forEach((bg, index) => {
                const item = document.createElement('div');
                let isActive = false;

                if (currentBg && currentBg === bg.value) isActive = true;

                item.className = `bg-item ${isActive ? 'active': ''}`;

                if (bg.type === 'image') {
                    item.innerHTML = `<img src="${bg.value}" loading="lazy" alt="bg">`;
                } else {
                    item.innerHTML = `<div class="bg-color-block" style="background: ${bg.value}"></div>`;
                }

                item.onclick = (e) => {
                    if (e.target.closest('.bg-delete-btn')) return;
                    applyBackground(bg.value);
                    safeSetItem(getStorageKey('chatBackground'), bg.value);
                    localforage.setItem(getStorageKey('chatBackground'), bg.value);
                    renderBackgroundGallery();
                    showNotification('背景已切换', 'success');
                };

                if (bg.id.startsWith('user-')) {
                    const delBtn = document.createElement('div');
                    delBtn.className = 'bg-delete-btn';
                    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    delBtn.title = "删除此背景";
                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm('确定删除这张背景图吗？')) {
                            savedBackgrounds.splice(index, 1);
                            saveBackgroundGallery();

                            if (isActive) {
                                removeBackground(); 
                                renderBackgroundGallery();
                            } else {
                                renderBackgroundGallery();
                            }
                        }
                    };
                    item.appendChild(delBtn);
                }

                list.appendChild(item);
            });
        }



        function saveBackgroundGallery() {
    localforage.setItem(getStorageKey('backgroundGallery'), savedBackgrounds);
}


        const applyBackground = (value) => {
            if (!value || typeof value !== 'string') return;
            try {
                let cssValue;
                if (value.startsWith('linear-gradient') || value.startsWith('#') || value.startsWith('rgb')) {
                    cssValue = value;
                    document.documentElement.style.setProperty('--chat-bg-image', value);
                } else {
                    cssValue = value.startsWith('url(') ? value : `url(${value})`;
                    document.documentElement.style.setProperty('--chat-bg-image', cssValue);
                }
                document.body.classList.add('with-background');
        // 不再同步到主页，各会话背景独立保存
    } catch (e) {
                if (typeof removeBackground === 'function') removeBackground();
            }
        };


const loadData = async () => {
    try {
        settings = getDefaultSettings();

        
        const results = await Promise.allSettled([
            localforage.getItem(getStorageKey('chatSettings')),
            localforage.getItem(getStorageKey('chatMessages')),
            localforage.getItem(getStorageKey('backgroundGallery')),
            localforage.getItem(getStorageKey('customReplies')),
            localforage.getItem(getStorageKey('customPokes')),
            localforage.getItem(getStorageKey('customStatuses')),
            localforage.getItem(getStorageKey('customMottos')),
            localforage.getItem(getStorageKey('customIntros')),
            localforage.getItem(getStorageKey('stickerLibrary')),
            localforage.getItem(`${APP_PREFIX}customThemes`),
            localforage.getItem(getStorageKey('chatBackground')),
            localforage.getItem(getStorageKey('partnerAvatar')),
            localforage.getItem(getStorageKey('myAvatar')),
            localforage.getItem(getStorageKey('partnerPersonas')), 
            localforage.getItem(getStorageKey('showPartnerNameInChat')),
            localforage.getItem(`${APP_PREFIX}themeSchemes`),
            localforage.getItem(getStorageKey('myStickerLibrary')),
            localforage.getItem(getStorageKey('customReplyGroups')),
            localforage.getItem(getStorageKey('customPokeGroups')),
            localforage.getItem(getStorageKey('customStatusGroups')),
            localforage.getItem(getStorageKey('kaomojiLibrary')),
            localforage.getItem(getStorageKey('kaomojiGroups')),
            localforage.getItem(getStorageKey('customStickerGroups')),
            localforage.getItem(getStorageKey('moyuRecords')),
            localforage.getItem(getStorageKey('moyuLocations')),
            localforage.getItem(getStorageKey('moyuActivities')),
            localforage.getItem(getStorageKey('currentMoyuRecord')),
            localforage.getItem(getStorageKey('moyuUnread')),
            localforage.getItem(getStorageKey('moyuWorkSession')),
            localforage.getItem(getStorageKey('transferData')),
            localforage.getItem(getStorageKey('checkinQuestions')),
            localforage.getItem(getStorageKey('checkinRecords')),
            localforage.getItem(getStorageKey('phoneStatusLibrary')),
            localforage.getItem(getStorageKey('phoneStatusGroups'))
        ]);
        const getVal = (index) => results[index].status === 'fulfilled' ? results[index].value : null;

        const savedSettings = getVal(0);
        const savedMessages = getVal(1);
        const savedBgGallery = getVal(2);
        const savedCustomReplies = getVal(3);
        const savedPokes = getVal(4);
        const savedStatuses = getVal(5);
        const savedMottos = getVal(6);
        const savedIntros = getVal(7);
        const savedStickers = getVal(8);
        const savedCustomThemes = getVal(9);
        const savedChatBg = getVal(10);
        // 头像优先从 localforage 读取，如果没有则从 localStorage 读取备份
        let partnerAvatarSrc = getVal(11);
        let myAvatarSrc = getVal(12);
        if (!partnerAvatarSrc && SESSION_ID) {
            try {
                partnerAvatarSrc = localStorage.getItem(`${APP_PREFIX}${SESSION_ID}_partnerAvatar`);
            } catch(e) {}
        }
        if (!myAvatarSrc && SESSION_ID) {
            try {
                myAvatarSrc = localStorage.getItem(`${APP_PREFIX}${SESSION_ID}_myAvatar`);
            } catch(e) {}
        }
        const savedPartnerPersonas = getVal(13);
        const savedShowNameConfig = getVal(14);
        const savedThemeSchemes = getVal(15);
        const savedMyStickers = getVal(16);
        const savedReplyGroups = getVal(17);
        const savedPokeGroups = getVal(18);
        const savedStatusGroups = getVal(19);
        const savedKaomojiLibrary = getVal(20);
        const savedKaomojiGroups = getVal(21);
        const savedStickerGroups = getVal(22);
        const savedMoyuRecords = getVal(23);
        const savedMoyuLocations = getVal(24);
        const savedMoyuActivities = getVal(25);
        const savedCurrentMoyuRecord = getVal(26);
        const savedMoyuUnread = getVal(27);
        const savedMoyuWorkSession = getVal(28);
        const savedTransferData = getVal(29);
        const savedCheckinQuestions = getVal(30);
        const savedCheckinRecords = getVal(31);
        const savedPhoneStatusLibrary = getVal(32);
        const savedPhoneStatusGroups = getVal(33);

        if (savedCheckinQuestions && Array.isArray(savedCheckinQuestions)) window.checkinQuestions = savedCheckinQuestions;
        if (savedCheckinRecords && Array.isArray(savedCheckinRecords)) window.checkinRecords = savedCheckinRecords;
        if (savedPhoneStatusLibrary) window.phoneStatusLibrary = savedPhoneStatusLibrary;
        if (savedPhoneStatusGroups) window.phoneStatusGroups = savedPhoneStatusGroups;

        if (savedPartnerPersonas) partnerPersonas = savedPartnerPersonas;

        if (savedSettings) Object.assign(settings, savedSettings);
        window.settings = settings; // 暴露到 window，供 home.js 等模块读取

        if (settings.showPartnerNameInChat !== undefined) {
            showPartnerNameInChat = settings.showPartnerNameInChat;
        } else if (savedShowNameConfig !== null) {
            showPartnerNameInChat = savedShowNameConfig;
        }
        document.body.classList.toggle('show-partner-name', showPartnerNameInChat);
        try {
            if (settings.customFontUrl) applyCustomFont(settings.customFontUrl);
            if (settings.customBubbleCss) applyCustomBubbleCss(settings.customBubbleCss);
            if (settings.customGlobalCss) applyGlobalThemeCss(settings.customGlobalCss);
        } catch(e) { console.warn("样式应用失败", e); }
        
        if (savedPokes) customPokes = savedPokes;
        else customPokes = [...CONSTANTS.POKE_ACTIONS];

        if (savedStatuses) customStatuses = savedStatuses;
        else customStatuses = [...CONSTANTS.PARTNER_STATUSES];

        if (savedMottos) customMottos = savedMottos;
        else customMottos = [...CONSTANTS.HEADER_MOTTOS];
        
        if (savedIntros) customIntros = savedIntros;
        else customIntros = CONSTANTS.WELCOME_ANIMATIONS.map(a => `${a.line1}|${a.line2}`);

        if (savedMessages && Array.isArray(savedMessages)) {
            messages = savedMessages.map(m => ({
                ...m, timestamp: new Date(m.timestamp)
            }));
        } else {
            const backup = _tryRecoverFromBackup();
            if (backup && Array.isArray(backup.messages) && backup.messages.length > 0) {
                const timeSince = Math.round((Date.now() - backup.ts) / 60000);
                console.warn(`[loadData] 主存储无消息，正在从备份恢复（备份时间：${timeSince} 分钟前）`);
                messages = backup.messages.map(m => ({
                    ...m, timestamp: new Date(m.timestamp)
                }));
                if (backup.settings) Object.assign(settings, backup.settings);
                setTimeout(() => saveData(), 1000);
                showNotification(
                    `已从备份恢复 ${messages.length} 条消息${backup._truncated ? '（备份为最近200条）' : ''}`,
                    'warning', 6000
                );
            } else {
                messages = [];
            }
        }

        if (savedBgGallery) {
            savedBackgrounds = savedBgGallery;
        } else {
            savedBackgrounds = [{ id: 'preset-1', type: 'color', value: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }];
        }

        if (savedCustomReplies) customReplies = savedCustomReplies;
        if (savedReplyGroups) window.customReplyGroups = savedReplyGroups;
        if (savedPokeGroups) window.customPokeGroups = savedPokeGroups;
        if (savedStatusGroups) window.customStatusGroups = savedStatusGroups;
        if (savedStickers) stickerLibrary = savedStickers;
        if (savedMyStickers) myStickerLibrary = savedMyStickers;
        if (savedCustomThemes) customThemes = savedCustomThemes;
        if (savedThemeSchemes) themeSchemes = savedThemeSchemes;
        if (savedKaomojiLibrary) kaomojiLibrary = savedKaomojiLibrary;
        if (savedKaomojiGroups) window.kaomojiGroups = savedKaomojiGroups;
        if (savedStickerGroups) window.customStickerGroups = savedStickerGroups;
        if (savedMoyuRecords) moyuRecords = savedMoyuRecords;
        if (savedMoyuLocations) moyuLocations = savedMoyuLocations;
        if (savedMoyuActivities) window.moyuActivities = savedMoyuActivities;
        if (savedCurrentMoyuRecord) currentMoyuRecord = savedCurrentMoyuRecord;
        if (savedMoyuUnread) {
            moyuUnread = true;
            // 延迟显示小红点（等待 DOM 加载）
            setTimeout(() => {
                if (typeof window.setMoyuUnread === 'function') window.setMoyuUnread();
            }, 1000);
        }
        if (savedMoyuWorkSession) {
            moyuWorkSession = savedMoyuWorkSession;
            // 恢复时检查是否需要结束会话
            const now = Date.now();
            if (now >= moyuWorkSession.endTime) {
                // 会话已结束，保存到记录列表
                if (!moyuRecords) moyuRecords = [];
                if (currentMoyuRecord) {
                    moyuRecords.push({...currentMoyuRecord});
                    localforage.setItem(getStorageKey('moyuRecords'), moyuRecords).catch(() => {});
                }
                currentMoyuRecord = null;
                moyuWorkSession = null;
                localforage.setItem(getStorageKey('currentMoyuRecord'), null).catch(() => {});
                localforage.setItem(getStorageKey('moyuWorkSession'), null).catch(() => {});
            } else {
                // 会话仍在进行中，设置结束检测
                scheduleWorkEndCheck();
            }
        }
        try { const ce = await localforage.getItem(getStorageKey('customEmojis')); if (ce && Array.isArray(ce)) customEmojis = ce; } catch(e) {}
        if (savedTransferData) transferData = savedTransferData;
        window._customReplies = customReplies;
        window._stickerLibrary = stickerLibrary;
        window._kaomojiLibrary = kaomojiLibrary;
        window._customEmojis = customEmojis;
        window._CONSTANTS = CONSTANTS;

        // 将头像数据保存到 settings，供 Home 页同步使用
        if (partnerAvatarSrc) settings.partnerAvatar = partnerAvatarSrc;
        if (myAvatarSrc) settings.myAvatar = myAvatarSrc;

        if (DOMElements && DOMElements.partner && DOMElements.me) {
            updateAvatar(DOMElements.partner.avatar, partnerAvatarSrc);
            updateAvatar(DOMElements.me.avatar, myAvatarSrc);
        }

        if (savedChatBg) {
            applyBackground(savedChatBg);
        } else {
            const lsBg = safeGetItem(getStorageKey('chatBackground'));
            if (lsBg) {
                applyBackground(lsBg);
                localforage.setItem(getStorageKey('chatBackground'), lsBg);
            }
        }

        try { await initMoodData(); } catch(e) { console.warn("心情数据加载失败", e); }
        try { await loadEnvelopeData(); } catch(e) { console.warn("信封数据加载失败", e); }
        
        displayedMessageCount = HISTORY_BATCH_SIZE;
        
        setTimeout(() => {
            if (typeof applyAllAvatarFrames === 'function') applyAllAvatarFrames();
            if (typeof manageAutoSendTimer === 'function') manageAutoSendTimer();
            if (typeof manageMoyuAutoGenerateTimer === 'function') manageMoyuAutoGenerateTimer();
            if (typeof manageEnvelopeAutoSendTimer === 'function') manageEnvelopeAutoSendTimer();
            if (typeof checkEnvelopeStatus === 'function') checkEnvelopeStatus();
            if (typeof updateUI === 'function') updateUI();
            if (settings.customBubbleCss) {
                try { applyCustomBubbleCss(settings.customBubbleCss); } catch(e) {}
            }
            // 同步数据到 Home 页
            if (typeof window.syncHomePageData === 'function') {
                window.syncHomePageData();
            }
            // 初始化 Home 页（加载设置等）
            if (typeof window.initHomePage === 'function') {
                window.initHomePage();
            }
        }, 100);

    } catch (e) {
        console.error("LoadData 内部致命错误:", e);
        settings = getDefaultSettings();
        messages = [];
        updateUI();
    }
};

const LIBRARY_CONFIG = {
    reply: {
        title: "回复库管理",
        tabs: [
            { id: 'custom', name: '主字卡', mode: 'list' },
            { id: 'kaomojis', name: '颜文字', mode: 'list' },
            { id: 'emojis', name: 'Emoji', mode: 'grid' },
            { id: 'stickers', name: '表情库', mode: 'grid' }
        ]
    },
    moyu: {
        title: "摸鱼管理",
        tabs: [
            { id: 'moyu', name: '摸鱼活动', mode: 'list' },
            { id: 'moyuLocations', name: '工作地点', mode: 'list' },
            { id: 'checkinQuestions', name: '查岗问题库', mode: 'list' },
            { id: 'mood', name: '心情库', mode: 'list' },
            { id: 'phoneStatus', name: '手机状态库', mode: 'list' }
        ]
    },
    atmosphere: {
        title: "氛围感配置",
        tabs: [
            { id: 'pokes', name: '拍一拍', mode: 'list' },
            { id: 'statuses', name: '对方状态', mode: 'list' },
            { id: 'mottos', name: '顶部格言', mode: 'list' },
            { id: 'intros', name: '开场动画', mode: 'list' }
        ]
    }
};
window.openMyStickerSettings = function() {
    const picker = document.getElementById('user-sticker-picker');
    if (picker) picker.classList.remove('active');
    if (typeof currentMajorTab !== 'undefined') {
        currentMajorTab = 'reply';
        currentSubTab = 'stickers';
    }
    var sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(function(b) { b.classList.toggle('active', b.dataset.major === 'reply'); });
    if (typeof renderReplyLibrary === 'function') renderReplyLibrary();
    var modal = document.getElementById('custom-replies-modal');
    if (modal && typeof showModal === 'function') showModal(modal);
};



const _BACKUP_PREFIX = 'BACKUP_V1_';
function _backupCriticalData() {
    if (window._skipBackup) return;
    try {
        const backupPayload = {
            ts: Date.now(),
            messages: messages,
            settings: settings,
            sessionId: SESSION_ID
        };

        let payloadToStore = backupPayload;
        const msgSizeEstimate = messages.length * 500; 
        if (msgSizeEstimate > 3 * 1024 * 1024) {
            payloadToStore = {
                ...backupPayload,
                messages: messages.slice(-200),
                _truncated: true
            };
        }

        const json = JSON.stringify(payloadToStore);

        if (json.length > 4.5 * 1024 * 1024) {
            const smallerPayload = {
                ...payloadToStore,
                messages: messages.slice(-50),
                _truncated: true
            };
            const smallerJson = JSON.stringify(smallerPayload);
            localStorage.setItem(_BACKUP_PREFIX + 'critical', smallerJson);
        } else {
            localStorage.setItem(_BACKUP_PREFIX + 'critical', json);
        }
        localStorage.setItem(_BACKUP_PREFIX + 'timestamp', String(Date.now()));
    } catch (e) {
        console.warn('localStorage 备份写入失败（可能存储已满）:', e);
    }
}

function _tryRecoverFromBackup() {
    try {
        const raw = localStorage.getItem(_BACKUP_PREFIX + 'critical');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

const saveData = async () => {
    if (!SESSION_ID) {
        console.warn('[saveData] SESSION_ID 尚未初始化，跳过保存以防数据写入临时 key');
        return;
    }

    const promises = [
        { key: 'chatSettings',           val: () => localforage.setItem(getStorageKey('chatSettings'), settings) },
        { key: 'customReplies',          val: () => localforage.setItem(getStorageKey('customReplies'), customReplies) },
        { key: 'customReplyGroups',      val: () => localforage.setItem(getStorageKey('customReplyGroups'), window.customReplyGroups || []) },
        { key: 'customPokeGroups',        val: () => localforage.setItem(getStorageKey('customPokeGroups'), window.customPokeGroups || []) },
        { key: 'customStatusGroups',      val: () => localforage.setItem(getStorageKey('customStatusGroups'), window.customStatusGroups || []) },
        { key: 'kaomojiGroups',           val: () => localforage.setItem(getStorageKey('kaomojiGroups'), window.kaomojiGroups || []) },
        { key: 'customStickerGroups',     val: () => local