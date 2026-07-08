# Paratranz Autofill Script

JS Link : https://raw.githubusercontent.com/Logite-c/Paratranz_AutoFill.js/refs/heads/main/Autofill.js

(한국어 설명은 문서 하단에 있습니다.)

This script is designed to support translation for Hearts of Iron IV (HOI4) on the Paratranz platform, and can also be used for other games or similar web applications.

## How to Use

The best way to use this script is with a browser extension.

### Browser Extension (e.g., Tampermonkey)

Using an extension like Tampermonkey (for Chrome, Edge, Firefox, etc.) allows you to easily add and manage the script.

1.  **Install Extension:** If you don't have Tampermonkey for your browser, install it first.
2.  **Create New Script:** Open the Tampermonkey dashboard and click 'Create a new script'.
3.  **Paste Content:** Delete all the default boilerplate code in the editor and paste the entire content of the `Autofill.js` file.
4.  **Check Settings:** Ensure that the `@match` part in the script's metadata (at the top of the file, e.g., `// @match https://paratranz.cn/projects/*`) is correctly set to your Paratranz project URL.
5.  **Save:** Save the script, and it will automatically run on the configured pages.

## Features

Once the script is running, a control panel will appear at the top of the screen.

*   **Load Data:**
    *   Click the button to open a window where you can paste your pre-prepared translation data (JSON or YML format).
    *   Clicking 'Save' will store the data in your browser, where it will persist even if you close the window.
*   **Auto Fill:**
    *   If this option is enabled, the translation field will automatically be filled if a key matching the original text of the item to be translated exists in the previously loaded data.
*   **Clear Data:**
    *   Deletes all stored translation data.
*   **Collapse/Expand Menu:**
    *   You can collapse or expand the control panel to use the screen more effectively.

---

# Paratranz 자동 완성 스크립트

이 스크립트는 Paratranz 번역 플랫폼에서 Hearts of Iron IV (HOI4) 번역 작업을 지원하기 위해 설계되었으며, 다른 게임이나 유사한 웹 애플리케이션에도 활용할 수 있습니다.

## 사용 방법

이 스크립트를 사용하기 가장 좋은 방법은 브라우저 확장 프로그램을 이용하는 것입니다.

### 브라우저 확장 프로그램 (예: Tampermonkey)

Tampermonkey (Chrome, Edge, Firefox 등) 같은 확장 프로그램을 사용하면 스크립트를 쉽게 추가하고 관리할 수 있습니다.

1.  **확장 프로그램 설치:** 브라우저에 Tampermonkey가 없다면 먼저 설치합니다.
2.  **새 스크립트 만들기:** Tampermonkey 대시보드에서 '새 스크립트 만들기'를 클릭합니다.
3.  **내용 붙여넣기:** 편집기에 있는 기본 코드를 모두 지우고 `Autofill.js` 파일의 전체 내용을 붙여넣습니다.
4.  **설정 확인:** 스크립트 상단의 메타데이터에서 `@match` 부분이 Paratranz 프로젝트 URL(예: `https://paratranz.cn/projects/*`)로 올바르게 설정되었는지 확인합니다.
5.  **저장:** 스크립트를 저장하면 설정된 페이지에서 자동으로 실행됩니다.

## 기능 설명

스크립트가 실행되면 화면 상단에 제어판이 나타납니다.

*   **데이터 불러오기:**
    *   버튼을 클릭해 미리 준비한 번역 데이터(JSON 또는 YML 형식)를 붙여넣는 창을 엽니다.
    *   '저장'을 누르면 데이터가 브라우저에 저장되어, 창을 닫아도 유지됩니다.
*   **자동 완성:**
    *   이 옵션을 활성화하면, 번역할 항목의 원문과 일치하는 키가 이전에 불러온 데이터에 있을 경우 번역 칸을 자동으로 채워줍니다.
*   **데이터 비우기:**
    *   저장된 모든 번역 데이터를 삭제합니다.
*   **메뉴 접기/펴기:**
    *   제어판을 접거나 펴서 화면을 넓게 사용할 수 있습니다.

---

*이 문서는 AI의 도움을 받아 작성 및 수정되었습니다.*
