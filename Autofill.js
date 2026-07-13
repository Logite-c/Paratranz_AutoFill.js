// ==UserScript==
// @name         Paratranz HOI4 Auto-Filler
// @namespace    http://tampermonkey.net/
// @version      1.11
// @downloadURL  https://raw.githubusercontent.com/Logite-c/Paratranz_AutoFill.js/refs/heads/main/Autofill.js
// @updateURL    https://raw.githubusercontent.com/Logite-c/Paratranz_AutoFill.js/refs/heads/main/Autofill.js
// @description  Paratranz에서 HOI4 번역 시 사전 번역 데이터를 자동 입력합니다. (토스트 알림, 수동입력 단축키 추가)
// @author       Logite_ With contributions from Gemini, Copilot, etc.
// @match        https://paratranz.cn/projects/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 0. 다국어(i18n) 설정: 브라우저 언어 감지
    const userLang = navigator.language.startsWith('ko') ? 'ko' : 'en';
    const i18n = {
        ko: {
            btnLoad: '📂 데이터 불러오기',
            autoFill: '자동 채우기',
            btnClear: '🗑️ 데이터 비우기',
            collapse: '▲ 메뉴 접기',
            expand: '▼ 메뉴 펴기',
            modalTitle: '데이터 불러오기 (JSON / YML)',
            modalDesc: 'YML 파일의 언어 선언부(예: l_english), 숫자(:0), 주석(#) 등은 자동 무시됩니다.',
            placeholder: '여기에 JSON 또는 YML 데이터를 복사해서 붙여넣으세요...',
            btnCancel: '취소',
            btnSave: '저장',
            confirmClear: '저장된 번역 데이터를 모두 삭제하시겠습니까?',
            alertCleared: '데이터가 모두 비워졌습니다.',
            alertNoData: '입력된 데이터가 없습니다.',
            alertParseError: '파싱된 데이터가 없습니다. 형식을 확인해주세요.',
            alertSaved: (count) => `총 ${count}개의 번역 데이터가 성공적으로 저장되었습니다.`,
            dbError: '오류: 번역 데이터 저장소를 열 수 없습니다. 스크립트가 정상적으로 동작하지 않을 수 있습니다.',
            dbNotInit: '데이터 저장소가 초기화되지 않았습니다. 잠시 후 다시 시도하거나 스크립트 설정을 확인해주세요.',
            toastManualSuccess: (key) => `수동으로 ${key} 번역을 불러왔습니다.`,
            toastManualFail: (key) => `자동채우기 데이터에 ${key} 키가 없습니다.`,
            toastAutoSuccess: (key) => `자동으로 ${key} 번역을 채웠습니다.`,
            toastAutoFail: (key) => `자동채우기 데이터에 ${key} 키가 없어 불러오지 못했습니다.`,
        },
        en: {
            btnLoad: '📂 Load Data',
            autoFill: 'Auto Fill',
            btnClear: '🗑️ Clear Data',
            collapse: '▲ Collapse Menu',
            expand: '▼ Expand Menu',
            modalTitle: 'Load Data (JSON / YML)',
            modalDesc: 'Language declarations (e.g., l_english), numbers (:0), and comments (#) in YML files are automatically ignored.',
            placeholder: 'Paste JSON or YML data here...',
            btnCancel: 'Cancel',
            btnSave: 'Save',
            confirmClear: 'Are you sure you want to delete all saved translation data?',
            alertCleared: 'All data has been cleared.',
            alertNoData: 'No data entered.',
            alertParseError: 'No data parsed. Please check the format.',
            alertSaved: (count) => `Successfully saved ${count} translation items.`,
            dbError: 'Error: Cannot open translation data storage. The script may not work correctly.',
            dbNotInit: 'Data storage not initialized. Please try again later or check script settings.',
            toastManualSuccess: (key) => `Manually loaded ${key} translation.`,
            toastManualFail: (key) => `Key ${key} not found in autofill data.`,
            toastAutoSuccess: (key) => `Automatically filled ${key} translation.`,
            toastAutoFail: (key) => `Could not load ${key} translation, key not found.`
        }
    };
    const t = i18n[userLang]; // 감지된 언어 텍스트 세트 할당

    // 전역 상태 변수
    let isAutoFillOn = false;
    let db;
    let lastCheckedKey = "";

    // 1. IndexedDB 초기화 및 오류 처리
    const request = indexedDB.open("HOI4_TranslationDB", 1);
    request.onerror = (e) => {
        console.error("IndexedDB error:", e.target.error);
        alert(t.dbError);
    };
    request.onupgradeneeded = (e) => {
        const dbInstance = e.target.result;
        if (!dbInstance.objectStoreNames.contains("translations")) {
            dbInstance.createObjectStore("translations", { keyPath: "key" });
        }
    };
    request.onsuccess = (e) => {
        db = e.target.result;
        console.log("IndexedDB Connected");
        db.onerror = (event) => {
            console.error(`Database error: ${event.target.errorCode}`);
        };
    };

    // 2. 메인 컨트롤 패널 UI 생성 및 스타일링
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .pt-button-group {
            display: flex;
            gap: 15px;
            align-items: center;
            padding: 12px 20px 8px 20px;
            transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
            max-height: 100px;
            opacity: 1;
        }
        .pt-autofill-panel.collapsed .pt-button-group {
            max-height: 0px;
            opacity: 0.2;
            padding: 0px 20px;
            overflow: hidden;
        }
        .toast-notification {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.5s, bottom 0.5s;
            font-size: 14px;
        }
        .toast-notification.show {
            opacity: 1;
            bottom: 30px;
        }
        .toast-notification.success { background-color: #2ecc71; }
        .toast-notification.error { background-color: #e74c3c; }
        .toast-notification.info { background-color: #3498db; }
    `;
    document.head.appendChild(styleSheet);

    const panel = document.createElement('div');
    panel.classList.add('pt-autofill-panel'); // CSS 클래스 추가
    panel.style.cssText = `
        position: fixed; top: 0; left: 50%; transform: translateX(-50%);
        background: #2c3e50; color: white; border-radius: 0 0 8px 8px;
        z-index: 9999; display: flex; flex-direction: column; align-items: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-family: sans-serif;
        transition: all 0.3s ease; overflow: hidden;
    `;

    // Create a function for showing toast notifications
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerText = message;
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100); // Short delay to allow CSS transition

        // Hide toast
        setTimeout(() => {
            toast.classList.remove('show');
            // Remove from DOM after transition
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 500);
        }, duration);
    }

    const buttonGroup = document.createElement('div');
    buttonGroup.classList.add('pt-button-group'); // CSS 클래스 추가
    // buttonGroup.style.cssText is removed, styles are now in the <style> block

    const btnLoad = document.createElement('button');
    btnLoad.innerText = t.btnLoad;
    btnLoad.style.cssText = 'padding: 6px 12px; cursor: pointer; border: none; border-radius: 4px; background: #3498db; color: white; font-weight: bold;';

    const toggleWrapper = document.createElement('label');
    toggleWrapper.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px;';
    const toggleAutoFill = document.createElement('input');
    toggleAutoFill.type = 'checkbox';
    toggleAutoFill.style.cursor = 'pointer';
    toggleWrapper.append(toggleAutoFill, t.autoFill);

    const btnClear = document.createElement('button');
    btnClear.innerText = t.btnClear;
    btnClear.style.cssText = 'padding: 6px 12px; cursor: pointer; border: none; border-radius: 4px; background: #e74c3c; color: white; font-weight: bold;';

    buttonGroup.append(btnLoad, toggleWrapper, btnClear);

    const btnTogglePanel = document.createElement('div');
    btnTogglePanel.innerText = t.collapse;
    btnTogglePanel.style.cssText = `
        width: 100%; text-align: center; padding: 4px 0; cursor: pointer;
        background: rgba(26, 37, 47, 0.2); color: #bdc3c7; font-size: 11px; font-weight: bold;
        letter-spacing: 1px; user-select: none; border-radius: 0 0 8px 8px;
    `;

    panel.append(buttonGroup, btnTogglePanel);
    document.body.appendChild(panel);

    // 3. 팝업(모달) UI 생성
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; padding: 20px; border-radius: 8px; box-shadow: 0 5px 25px rgba(0,0,0,0.5);
        z-index: 10000; display: none; flex-direction: column; gap: 10px; width: 500px; color: black;
    `;
    modal.innerHTML = `
        <h3 style="margin: 0;">${t.modalTitle}</h3>
        <p style="font-size: 12px; color: gray; margin: 0;">${t.modalDesc}</p>
        <textarea id="textInput" rows="15" placeholder="${t.placeholder}" style="width: 100%; resize: vertical; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="btnCancel" style="padding: 6px 15px; cursor: pointer; border: 1px solid #ccc; background: #f8f9fa; border-radius: 4px;">${t.btnCancel}</button>
            <button id="btnSave" style="padding: 6px 15px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">${t.btnSave}</button>
        </div>
    `;
    document.body.appendChild(modal);

    // 4. 이벤트 리스너 설정
    btnTogglePanel.onclick = () => {
        panel.classList.toggle('collapsed');
        const isCollapsed = panel.classList.contains('collapsed');
        btnTogglePanel.innerText = isCollapsed ? t.expand : t.collapse;
        panel.style.background = isCollapsed ? 'rgba(44, 62, 80, 0.8)' : 'rgba(44, 62, 80, 0.5)';
        localStorage.setItem('isPanelCollapsed', isCollapsed);
    };

    btnLoad.onclick = () => { modal.style.display = 'flex'; };
    document.getElementById('btnCancel').onclick = () => { modal.style.display = 'none'; };

    toggleAutoFill.onchange = (e) => {
        isAutoFillOn = e.target.checked;
        localStorage.setItem('isAutoFillOn', isAutoFillOn);
        if (!isAutoFillOn) lastCheckedKey = "";
    };

    btnClear.onclick = () => {
        if(confirm(t.confirmClear)) {
            if (!db) { return alert(t.dbNotInit); } // Using i18n
            const tx = db.transaction("translations", "readwrite");
            tx.objectStore("translations").clear();
            tx.oncomplete = () => alert(t.alertCleared);
            tx.onerror = (e) => console.error("Transaction error on clear:", e.target.error);
        }
    };

    // 5. 핵심 로직: 데이터 파싱 및 저장
    document.getElementById('btnSave').onclick = () => {
        const text = document.getElementById('textInput').value.trim();
        if (!text) {
            alert(t.alertNoData);
            return;
        }

        let parsedData = [];
        try {
            const jsonObj = JSON.parse(text);
            for (const [key, value] of Object.entries(jsonObj)) {
                parsedData.push({ key: key.trim(), value: value });
            }
        } catch (e) {
            // Improved YML parsing to handle multi-line values and escaped quotes
            let ymlText = text
                .replace(/^\s*l_\w+:/gm, '') // Remove language declarations (e.g., l_english:)
                .replace(/^\s*#.*$/gm, ''); // Remove full-line comments

            const ymlRegex = /^\s*([\w.-]+)\s*:\d*\s*"((?:\\.|[^"\\])*)"/gm;
            let match;
            while ((match = ymlRegex.exec(ymlText)) !== null) {
                if (match[1] && typeof match[2] !== 'undefined') {
                    // The regex correctly handles escaped quotes, so we just need to unescape them.
                    const finalValue = match[2].replace(/\\"/g, '"');
                    parsedData.push({ key: match[1].trim(), value: finalValue });
                }
            }
        }

        if (parsedData.length === 0) {
            alert(t.alertParseError);
            return;
        }
        
        if (!db) { return alert(t.dbNotInit); } // Using i18n
        const tx = db.transaction("translations", "readwrite");
        const store = tx.objectStore("translations");
        parsedData.forEach(item => store.put(item));

        tx.oncomplete = () => {
            alert(t.alertSaved(parsedData.length));
            document.getElementById('textInput').value = "";
            modal.style.display = 'none';
        };
        tx.onerror = (e) => console.error("Transaction error on save:", e.target.error);
    };

    // 6. 핵심 로직: DB에서 데이터 찾기
    const findInDB = (key) => {
        return new Promise((resolve, reject) => {
            if (!db) return reject(new Error(t.dbNotInit));
            const tx = db.transaction("translations", "readonly");
            const store = tx.objectStore("translations");
            const getRequest = store.get(key);
            getRequest.onerror = (e) => reject(e.target.error);
            getRequest.onsuccess = () => resolve(getRequest.result ? getRequest.result.value : null);
            tx.onerror = (e) => reject(e.target.error);
        });
    };

    // 7. 핵심 로직: 수동 및 자동 채우기
    const manualFill = async () => {
        const textarea = document.querySelector('textarea.translation.form-control');
        const keyElement = document.querySelector('.notranslate.text-monospace');
        if (!keyElement || !textarea) return;

        const currentKey = keyElement.innerText.trim().split(':')[0].trim();
        if (!currentKey) return;

        try {
            const value = await findInDB(currentKey);
            if (value !== null) {
                textarea.value = value;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                showToast(t.toastManualSuccess(currentKey), 'success');
            } else {
                showToast(t.toastManualFail(currentKey), 'error');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleTranslation = async () => {
        if (!isAutoFillOn || !db) return;
        const keyElement = document.querySelector('.notranslate.text-monospace');
        const textarea = document.querySelector('textarea.translation.form-control');

        if (keyElement && textarea) {
            const currentKey = keyElement.innerText.trim().split(':')[0].trim();

            if (currentKey && currentKey !== lastCheckedKey) {
                lastCheckedKey = currentKey;

                try {
                    const value = await findInDB(currentKey);
                    if (value !== null) {
                        // Key FOUND. Only fill if textarea is empty.
                        if (textarea.value === "") {
                            textarea.value = value;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            showToast(t.toastAutoSuccess(currentKey), 'success');
                        }
                    } else {
                        // Key NOT found. Show failure toast regardless of textarea content.
                        showToast(t.toastAutoFail(currentKey), 'info');
                    }
                } catch(error) {
                     console.error("Autofill DB Error:", error);
                }
            }
        } else {
            lastCheckedKey = "";
        }
    };

    // Keydown listener for manual fill
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'q') {
            e.preventDefault();
            manualFill();
        }
    });

    const observer = new MutationObserver(handleTranslation);
    observer.observe(document.body, { childList: true, subtree: true });

    // 7. 페이지 로드 시 설정 불러오기
    function loadSettings() {
        const savedCollapsed = localStorage.getItem('isPanelCollapsed') === 'true';
        const savedAutoFill = localStorage.getItem('isAutoFillOn') === 'true';

        // 패널 접힘 상태 적용
        if (savedCollapsed) {
            panel.classList.add('collapsed');
            btnTogglePanel.innerText = t.expand;
            panel.style.background = 'rgba(44, 62, 80, 0.8)';
        }

        // 자동 채우기 상태 적용
        isAutoFillOn = savedAutoFill;
        toggleAutoFill.checked = isAutoFillOn;
    }

    // 스크립트가 로드된 시점에 이미 번역창이 있을 수 있으므로 초기에 한 번 실행합니다.
    loadSettings();
    handleTranslation();

})();
