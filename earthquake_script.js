document.addEventListener('DOMContentLoaded', () => {
    const earthquakeListContainer = document.getElementById('earthquake-list-container');

    // ★★★使用するP2P地震情報 APIのURLを設定★★★
    // v2/jma/quake から v2/history に変更し、code=551 で地震情報（震源・震度）にフィルタリング
    const EARTHQUAKE_API_URL = "https://api.p2pquake.net/v2/jma/quake?limit=20&offset=0&order=-1&quake_type=DetailScale&min_scale=10&max_scale=70";
    // ----------------------------------------------------------------------

    /**
     * P2P地震情報 APIからデータを取得して表示する
     */
    async function fetchAndDisplayEarthquakeInfo() {
        earthquakeListContainer.innerHTML = '<p class="loading-message">地震情報を読み込み中...</p>'; // ローディング表示

        try {
            const response = await fetch(EARTHQUAKE_API_URL);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                earthquakeListContainer.innerHTML = ''; // クリア

                // データの処理と表示
                let hasDisplayableEarthquake = false; // 表示すべき地震情報があるかどうかのフラグ
                data.forEach(eq => {
                    // curlコマンドの結果から、typeが '551' のものが地震情報
                    // また、issue.type は 'DetailScale' であることが確認できた
                    if (eq.code === 551 && eq.earthquake && eq.issue) {
                        // issue.typeが 'ScaleAndDestination' または 'DetailScale' の地震情報を表示
                        if (eq.issue.type === 'ScaleAndDestination' || eq.issue.type === 'DetailScale') { //
                            addEarthquakeItemToDisplay(eq);
                            hasDisplayableEarthquake = true;
                        }
                    }
                });

                if (!hasDisplayableEarthquake) {
                    // 表示すべき地震情報が一つもなかった場合
                    earthquakeListContainer.innerHTML = '<p class="loading-message">現在、震度1以上の地震情報はありません。</p>';
                }

            } else {
                earthquakeListContainer.innerHTML = '<p class="loading-message">現在、地震情報はありません。</p>';
            }
        } catch (error) {
            earthquakeListContainer.innerHTML = '<p class="loading-message">地震情報の取得中にエラーが発生しました。</p>';
            console.error('地震情報フェッチエラー:', error);
        }
        highlightCurrentPage(); // ナビゲーションのアクティブ状態を更新
    }

    /**
     * 地震情報セクションに新しい地震情報を追加するヘルパー関数
     * P2P地震情報APIのレスポンス形式に合わせてデータを整形します。
     * @param {object} eqData - 個別の地震情報オブジェクト (P2P地震情報APIのレスポンス)
     */
    function addEarthquakeItemToDisplay(eqData) {
        const infoItem = document.createElement('div');
        infoItem.classList.add('info-item', 'earthquake'); // 'earthquake' クラスを追加してCSSで色分け

        const earthquake = eqData.earthquake;
        // time プロパティは eqData.earthquake.time に存在する
        const time = earthquake.time ? new Date(earthquake.time).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) : '不明';

        const epicenter = earthquake.hypocenter && earthquake.hypocenter.name ? earthquake.hypocenter.name : '不明';
        const magnitude = earthquake.magnitudo ? `M${earthquake.magnitudo}` : '不明';
        
        let maxShindo = '不明';
        if (earthquake.maxScale !== undefined && earthquake.maxScale !== null) {
            maxShindo = convertScaleToShindo(earthquake.maxScale);
        }

        let detailContent = '';
        if (earthquake.hypocenter && earthquake.hypocenter.depth !== undefined && earthquake.hypocenter.depth !== null) {
            detailContent += `深さ: 約${earthquake.hypocenter.depth}km<br>`;
        }
        // curlコマンドの出力には earthquake.tide が見当たらず、eqData.issue.type が TsunamiWarning のケースも少なそうなので、
        // 現状は earthquake.tide のみにしておきますが、必要に応じて調整してください。
        if (earthquake.tide) { // earthquake.tideの存在確認
             detailContent += `津波: ${earthquake.tide}`;
        } else if (eqData.issue.type === 'TsunamiWarning') { // 津波警報の判定も残しておく
            detailContent += `津波予報: ${eqData.issue.type}`;
        }
        
        // 震度観測点の情報があれば追加
        if (eqData.points && Array.isArray(eqData.points) && eqData.points.length > 0) {
            const topShindoPoints = eqData.points
                .filter(point => point.scale === earthquake.maxScale)
                .map(point => point.addr)
                .slice(0, 3);
            
            if (topShindoPoints.length > 0) {
                detailContent += `<br>主な地域: ${topShindoPoints.join('、')}`;
            }
        }


        infoItem.innerHTML = `
            <h3>震源地: ${epicenter} (${magnitude})</h3>
            <span class="info-tag earthquake">地震速報</span>
            <span class="info-date">${time}</span>
            <p>最大震度: ${maxShindo}</p>
            <p>${detailContent}</p>
        `;
        
        earthquakeListContainer.appendChild(infoItem);
    }

    /**
     * P2P地震情報のmaxScale値を震度表記に変換するヘルパー関数
     * @param {number} scale - P2P地震情報のmaxScale値
     * @returns {string} 震度表記
     */
    function convertScaleToShindo(scale) {
        switch (scale) {
            case 10: return '震度1';
            case 20: return '震度2';
            case 30: return '震度3';
            case 40: return '震度4';
            case 45: return '震度5弱';
            case 50: return '震度5強';
            case 55: return '震度6弱';
            case 60: return '震度6強';
            case 70: return '震度7';
            default: return '不明';
        }
    }


    // ページロード時に地震情報を取得して表示
    fetchAndDisplayEarthquakeInfo();

    // 現在のページのアクティブ状態をハイライトする関数
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

    // 例: 1分ごとに情報を自動更新する場合 (P2P地震情報APIの利用規約を確認し、適切な頻度に設定してください)
    // 通常は60000ms (1分) 程度が良いでしょう。
    setInterval(fetchAndDisplayEarthquakeInfo, 60000); 
});