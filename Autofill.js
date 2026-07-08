// ==UserScript==
// @name         Paratranz HOI4 Auto-Filler (IndexedDB)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Paratranz에서 HOI4 번역 시 사전 번역 데이터를 자동 입력합니다. (상하 접기 + 다국어 자동 감지 + 안정성 및 유지보수성 개선)
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
            modalDesc: 'YML 파일의 l_english 같은 언어 선언부나 :0 등의 숫자는 자동 무시됩니다.',
            placeholder: '여기에 JSON 또는 YML 데이터를 복사해서 붙여넣으세요...',
            btnCancel: '취소',
            btnSave: '저장 (IndexedDB)',
            confirmClear: '저장된 번역 데이터를 모두 삭제하시겠습니까?',
            alertCleared: '데이터가 모두 비워졌습니다.',
            alertNoData: '입력된 데이터가 없습니다.',
            alertParseError: '파싱된 데이터가 없습니다. 형식을 확인해주세요.',
            alertSaved: (count) => `총 ${count}개의 번역 데이터가 성공적으로 저장되었습니다.`,
            dbNotInit: '데이터베이스가 초기화되지 않았습니다. 잠시 후 다시 시도하거나 스크립트 설정을 확인해주세요.'
        },
        en: {
            btnLoad: '📂 Load Data',
            autoFill: 'Auto Fill',
            btnClear: '🗑️ Clear Data',
            collapse: '▲ Collapse Menu',
            expand: '▼ Expand Menu',
            modalTitle: 'Load Data (JSON / YML)',
            modalDesc: 'Language declarations like l_english or numbers like :0 in YML files are automatically ignored.',
            placeholder: 'Paste JSON or YML data here...',
            btnCancel: 'Cancel',
            btnSave: 'Save (IndexedDB)',
            confirmClear: 'Are you sure you want to delete all saved translation data?',
            alertCleared: 'All data has been cleared.',
            alertNoData: 'No data entered.',
            alertParseError: 'No data parsed. Please check the format.',
            alertSaved: (count) => `Successfully saved ${count} translation items.`,
            dbNotInit: 'Database not initialized. Please try again later or check script settings.'
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
        alert("오류: 번역 데이터베이스를 열 수 없습니다. 스크립트가 정상적으로 동작하지 않을 수 있습니다.");
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
            opacity: 0;
            padding: 0px 20px;
            overflow: hidden;
        }
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
        background: rgba(26, 37, 47, 0.5); color: #bdc3c7; font-size: 11px; font-weight: bold;
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
        btnTogglePanel.innerText = panel.classList.contains('collapsed') ? t.expand : t.collapse;
    };

    btnLoad.onclick = () => modal.style.display = 'flex';
    document.getElementById('btnCancel').onclick = () => modal.style.display = 'none';

    toggleAutoFill.onchange = (e) => {
        isAutoFillOn = e.target.checked;
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
            const lines = text.split('\\n');
            const ymlRegex = /^\s*([\w\-\.]+)(?:\:\d*)?\s*"(.*)"/;

            lines.forEach(line => {
                const match = line.match(ymlRegex);
                if (match) {
                    parsedData.push({ key: match[1].trim(), value: match[2] });
                }
            });
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

    // 6. 핵심 로직: Paratranz 화면 감지 및 자동 입력 (MutationObserver 사용)
    const handleTranslation = () => {
        if (!isAutoFillOn || !db) return;

        const keyElement = document.querySelector('.notranslate.text-monospace');
        const textarea = document.querySelector('textarea.translation.form-control');

        if (keyElement && textarea) {
            const rawText = keyElement.innerText.trim();
            const currentKey = rawText.split(':')[0].trim();

            if (currentKey && currentKey !== lastCheckedKey) {
                lastCheckedKey = currentKey;

                const tx = db.transaction("translations", "readonly");
                const store = tx.objectStore("translations");
                const getRequest = store.get(currentKey);

                getRequest.onerror = (e) => console.error("Read request error:", e.target.error);
                getRequest.onsuccess = () => {
                    if (getRequest.result && textarea.value === "") {
                        textarea.value = getRequest.result.value;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                };
                tx.onerror = (e) => console.error("Transaction error on read:", e.target.error);
            }
        } else {
            lastCheckedKey = "";
        }
    };

    // 페이지의 변경을 감지하여 번역창이 나타났을 때 핸들러를 호출합니다.
    const observer = new MutationObserver(handleTranslation);

    // document.body 전체의 자식요소 및 서브트리 변경사항을 감지하도록 설정합니다.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 스크립트가 로드된 시점에 이미 번역창이 있을 수 있으므로 초기에 한 번 실행합니다.
    handleTranslation();

})();
