// tsunami_script.js (改善案)

document.addEventListener('DOMContentLoaded', () => {
    const P2P_TSUNAMI_API_URL = "https://api.p2pquake.net/v2/jma/tsunami?limit=20&offset=0&order=-1";
    const tsunamiListContainer = document.getElementById('tsunami-list-container');

    fetchTsunamiInfo();

    async function fetchTsunamiInfo() {
        tsunamiListContainer.innerHTML = '<p class="loading-message">津波情報を読み込み中...</p>';

        try {
            const response = await fetch(P2P_TSUNAMI_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            tsunamiListContainer.innerHTML = '';

            if (data.length === 0) {
                tsunamiListContainer.innerHTML = '<p class="loading-message">現在、新しい津波情報はありません。</p>';
                return;
            }

            data.forEach(item => {
                const tsunamiItem = document.createElement('div');
                tsunamiItem.classList.add('info-item');

                const reportTime = new Date(item.time).toLocaleString('ja-JP', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                }).replace(/\//g, '/').replace(' ', ' ');

                let type = '不明な種類'; // デフォルト値を「不明な種類」に変更
                let mainTitle = '津波情報'; // 表示されるメインタイトル
                let areas = [];
                let heightDisplay = '不明';
                let detailText = '詳細情報はありません。'; // デフォルト値を設定

                // 津波情報の種類とタイトルを判定
                if (item.issue && item.issue.type) {
                    if (item.issue.type === '警報') {
                        type = '津波警報';
                        mainTitle = '【津波警報】';
                        tsunamiItem.classList.add('tsunami-warning');
                    } else if (item.issue.type === '津波情報') {
                        const isAdvisory = item.areas && item.areas.some(area => area.grade === '注意報');
                        if (isAdvisory) {
                            type = '津波注意報';
                            mainTitle = '【津波注意報】';
                            tsunamiItem.classList.add('tsunami-advisory');
                        } else {
                            type = '津波予報'; // その他の津波情報
                            mainTitle = '【津波予報】';
                            tsunamiItem.classList.add('tsunami-forecast');
                        }
                    } else {
                        // 未知のissue.typeの場合
                        type = item.issue.type;
                        mainTitle = `【${type}】`;
                        tsunamiItem.classList.add('tsunami-forecast'); // デフォルトで予報スタイルを適用
                    }
                } else {
                    tsunamiItem.classList.add('tsunami-forecast'); // デフォルトスタイル
                }


                // 影響を受ける地域と予想高さを抽出
                if (item.areas && item.areas.length > 0) {
                    item.areas.forEach(area => {
                        // 地域名とグレード（警報/注意報/予報）を結合
                        let areaDetail = area.name;
                        if (area.grade) {
                            areaDetail += ` (${area.grade})`;
                        }
                        areas.push(areaDetail);

                        // 各地域ごとの高さを判定し、最も高い、または明確なものを採用
                        if (area.height) {
                            if (area.height.isOver) {
                                heightDisplay = `${area.height.value}m以上`;
                            } else if (area.height.value) {
                                heightDisplay = `${area.height.value}m`;
                            } else if (area.height.kind === '調査中') {
                                heightDisplay = '調査中';
                            } else if (area.height.kind === '若干の海面変動') {
                                heightDisplay = '若干の海面変動';
                            }
                        }
                    });
                }
                
                // メインタイトルに地域を追加（地域が複数ある場合は先頭を代表として表示）
                let displayTitle = mainTitle;
                if (areas.length > 0) {
                    displayTitle += ` ${areas[0]}`; // 代表地域を表示
                    if (areas.length > 1) {
                         displayTitle += ` 他${areas.length - 1}地域`; // 他の地域数
                    }
                }

                // 津波の状況詳細
                if (item.comments) {
                    if (item.comments.forecastComment && item.comments.forecastComment.text) {
                        detailText = item.comments.forecastComment.text;
                    } else if (item.comments.free) {
                        detailText = item.comments.free;
                    }
                }

                tsunamiItem.innerHTML = `
                    <div class="info-item-content">
                        <h3>${displayTitle}</h3>
                        <div class="info-item-meta">
                            <span class="item-type">${type}</span> | 予想高さ: <span>${heightDisplay}</span> | <span>${reportTime} 発表</span>
                        </div>
                        <p>${detailText}</p>
                    </div>
                `;
                tsunamiListContainer.appendChild(tsunamiItem);
            });

        } catch (error) {
            tsunamiListContainer.innerHTML = '<p class="loading-message">津波情報の取得に失敗しました。</p>';
            console.error('津波情報の取得エラー:', error);
        }
        highlightCurrentPage();
    }

    function highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.main-nav a');

        navLinks.forEach(link => {
            const linkPath = link.href.split('/').pop();
            if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
});