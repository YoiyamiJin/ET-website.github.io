// script.js (トップページなどで最新速報情報を表示するためのJavaScript)

document.addEventListener('DOMContentLoaded', () => {
    const latestInfoContainer = document.getElementById('latest-info-container');

    // ★★★ここをあなたのお知らせ管理用Google Apps ScriptのウェブアプリURLに貼り付けてください★★★
    const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbymYXd08bv_RVcPYGutYflXnmIzsBcJES66nsF3oDh74uMBePk3kgZCaevE3xzl6DrwoQ/exec"; 
    // ----------------------------------------------------------------------

    /**
     * Google Apps Scriptから最新情報を取得して表示する
     */
    async function fetchAndDisplayLatestInfo() {
        latestInfoContainer.innerHTML = '<p class="loading-message">情報を読み込み中...</p>'; // ローディング表示

        try {
            const response = await fetch(`${GAS_WEB_APP_URL}?action=read`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success && data.data) {
                latestInfoContainer.innerHTML = ''; // クリア
                if (data.data.length === 0) {
                    latestInfoContainer.innerHTML = '<p class="loading-message">登録されている情報はありません。</p>';
                    return;
                }

                // 日付（`Date`プロパティ）で降順にソート (新しいものが上に来るように)
                data.data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

                // 最新の5件のみ表示（必要に応じて数を調整）
                const displayCount = Math.min(data.data.length, 5); 
                for (let i = 0; i < displayCount; i++) {
                    const item = data.data[i];
                    // addInfoItemToDisplay 関数は日付を引数に持ちますが、内部で表示はしません
                    addInfoItemToDisplay(item.Type, item.Title, item.Content, item.Date); 
                }
            } else {
                latestInfoContainer.innerHTML = '<p class="loading-message">情報の読み込みに失敗しました。</p>';
                console.error('情報の読み込みエラー:', data.error);
            }
        } catch (error) {
            latestInfoContainer.innerHTML = '<p class="loading-message">情報の取得中にエラーが発生しました。</p>';
            console.error('フェッチエラー:', error);
        }
        highlightCurrentPage(); // ナビゲーションのアクティブ状態を更新
    }

    /**
     * 最新情報セクションに新しい情報を追加するヘルパー関数
     * @param {string} type - 情報の種類 ('earthquake', 'weather', 'traffic', 'system')
     * @param {string} title - 情報のタイトル
     * @param {string} content - 情報の内容
     * @param {string} date - 情報の日付と時刻 (表示には使用しませんが、引数として残しておきます)
     */
    function addInfoItemToDisplay(type, title, content, date) {
        const infoItem = document.createElement('div');
        infoItem.classList.add('info-item', type); // 'info-item'クラスと、Typeに応じたクラスを追加

        // 情報タグのテキストを設定
        let tagText = '';
        switch (type) {
            case 'earthquake':
                tagText = '地震速報';
                break;
            case 'weather':
                tagText = '気象情報';
                break;
            case 'traffic':
                tagText = '交通情報';
                break;
            case 'system':
                tagText = 'システム通知';
                break;
            default:
                tagText = '情報'; // 未知のTypeの場合
        }

        infoItem.innerHTML = `
            <h3>${title}</h3>
            <span class="info-tag ${type}">${tagText}</span>
            <p>${content}</p>
        `;
        
        latestInfoContainer.appendChild(infoItem);
    }

    // ページロード時に最新情報を取得して表示
    fetchAndDisplayLatestInfo();

    /**
     * 現在のページのアクティブ状態をナビゲーションでハイライトする関数
     */
    function highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.main-nav a');

        navLinks.forEach(link => {
            const linkPath = link.href.split('/').pop();
            // index.htmlの特殊対応（パスが空の場合もindex.htmlとみなす）
            if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) { 
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // 例: 30秒ごとに情報を自動更新する場合 (必要に応じてコメント解除)
    // setInterval(fetchAndDisplayLatestInfo, 30000); 
});