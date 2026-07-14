(function(){
    'use strict';
    if (window.MusicBuddyApp && window.MusicBuddyApp.__inlineMusicBuddyEntry) return;
    let opening = false;

    function getPage() {
        return document.getElementById('music-buddy-page');
    }

    function hideOtherFullPages() {
        var home = document.getElementById('home-container');
        var chat = document.querySelector('.main-chat-area');
        var musicGame = document.getElementById('music-game-page');
        if (home) {
            home.classList.remove('active');
            home.style.display = 'none';
        }
        if (chat) chat.style.display = 'none';
        if (musicGame) musicGame.style.display = 'none';
        document.body.classList.add('music-buddy-open');
    }

    function restoreHome() {
        document.body.classList.remove('music-buddy-open');
        if (typeof window.showHomePage === 'function') {
            window.showHomePage();
            return;
        }
        var home = document.getElementById('home-container');
        if (home) {
            home.classList.add('active');
            home.style.display = 'flex';
        }
    }

    function open() {
        var page = getPage();
        if (!page) return false;
        if (opening) return false;
        opening = true;
        setTimeout(function(){ opening = false; }, 250);

        // First-time initialization of the inline music player app
        if (window.MusicBuddyApp && typeof window.MusicBuddyApp.init === 'function' && !window.MusicBuddyApp._initialized) {
            try {
                window.MusicBuddyApp.init();
            } catch(e) { console.error('[MusicBuddy] init error:', e); }
            window.MusicBuddyApp._initialized = true;
        }

        hideOtherFullPages();
        page.style.display = 'flex';
        // Hide global floating player when entering music buddy
        if (window.MusicBuddyApp && window.MusicBuddyApp.hideGlobalFloat) {
            window.MusicBuddyApp.hideGlobalFloat();
        }
        return false;
    }

    function openFromIcon(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        }
        open();
        return false;
    }

    function close() {
        var page = getPage();
        if (!page) return;
        page.style.display = 'none';
        restoreHome();
        // 在 restoreHome 之后显示全局悬浮，确保不被覆盖
        if (window.MusicBuddyApp && window.MusicBuddyApp.showGlobalFloat) {
            window.MusicBuddyApp.showGlobalFloat();
        }
        // 延迟再次调用，确保所有 DOM 更新完成后仍然可见
        setTimeout(function() {
            if (window.MusicBuddyApp && window.MusicBuddyApp.showGlobalFloat) {
                window.MusicBuddyApp.showGlobalFloat();
            }
        }, 100);
    }

    function reload() {
        // No iframe to reload; re-run the music player's init instead
        if (window.MusicBuddyApp && typeof window.MusicBuddyApp.init === 'function') {
            try {
                window.MusicBuddyApp.init();
            } catch(e) { console.error('[MusicBuddy] reload init error:', e); }
            window.MusicBuddyApp._initialized = true;
        }
    }

    document.addEventListener('click', function(e) {
        var icon = e.target.closest('.app-icon[data-app="music-buddy"]');
        var item = e.target.closest('.app-item');
        if (!icon && !(item && item.querySelector('.app-icon[data-app="music-buddy"]'))) return;
        openFromIcon(e);
    }, true);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var page = getPage();
            if (page && page.style.display !== 'none') close();
        }
    });

    window.MusicBuddyApp = {
        __inlineMusicBuddyEntry: true,
        open: open,
        openFromIcon: openFromIcon,
        close: close,
        reload: reload
    };
})();
