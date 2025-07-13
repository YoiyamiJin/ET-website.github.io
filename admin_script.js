// admin_script.js

document.addEventListener('DOMContentLoaded', () => {
    // ★★★ここにあなたの認証用Google Apps ScriptのウェブアプリURLを貼り付けてください★★★
    const GAS_AUTH_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw53Gbcp3HMxGuyC0iVSIikBrGLsr7NKpPjxr_eniz3EOn6ytw2J1sFwQQ7DeE01PnDTw/exec"; // 例
    // ★★★ここにあなたのお知らせ管理用Google Apps ScriptのウェブアプリURLを貼り付けてください★★★
    const GAS_NEWS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbymYXd08bv_RVcPYGutYflXnmIzsBcJES66nsF3oDh74uMBePk3kgZCaevE3xzl6DrwoQ/exec"; // 例

    // ※お問い合わせ関連のGAS URLは削除

    // ログイン関連のHTML要素
    const loginSection          = document.getElementById('login-section');
    const adminContent          = document.getElementById('admin-content');
    const usernameInput         = document.getElementById('username');
    const passwordInput         = document.getElementById('password');
    const loginButton           = document.getElementById('login-button');
    const logoutButton          = document.getElementById('logout-button');
    const loginMessage          = document.getElementById('login-message');

    // お知らせ管理関連のHTML要素
    const infoIdInput           = document.getElementById('info-id');
    const infoTypeSelect        = document.getElementById('info-type');
    const infoTitleInput        = document.getElementById('info-title');
    const infoContentInput      = document.getElementById('info-content');
    const addButton             = document.getElementById('add-button');
    const updateButton          = document.getElementById('update-button');
    const cancelEditButton      = document.getElementById('cancel-edit-button');
    const infoListContainer     = document.getElementById('info-list-container');
    
    // ※お問い合わせ管理関連のHTML要素は削除

    // パスワード変更関連のHTML要素
    const changeUsernameInput   = document.getElementById('change-username');
    const currentPasswordInput  = document.getElementById('current-password');
    const newPasswordInput      = document.getElementById('new-password');
    const confirmPasswordInput  = document.getElementById('confirm-password');
    const changePasswordButton  = document.getElementById('change-password-button');
    const changePasswordMessage = document.getElementById('change-password-message');

    // 初期処理：ログイン状態チェック
    checkLoginStatusAndDisplayContent();

    // --- イベントリスナー ---

    // ログインボタンのクリックイベント
    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) {
            loginMessage.textContent = 'ユーザー名とパスワードを入力してください。';
            return;
        }
        loginMessage.textContent = 'ログイン中...';
        const response = await sendAuthRequest('login', { username, password });
        if (response.status === 'success') {
            loginMessage.textContent = '';
            alert('ログイン成功！');
            localStorage.setItem('isLoggedIn', 'true'); // ログイン状態をLocal Storageに保存 (ヒントとして)
            toggleAdminContent(true); // 管理コンテンツ表示
            fetchInfo(); // お知らせリスト読み込み
            // ※お問い合わせリスト読み込みの呼び出しは削除
        } else {
            loginMessage.textContent = 'ログイン失敗: ' + response.message;
        }
    });

    // ログアウトボタンのクリックイベント
    logoutButton.addEventListener('click', async () => {
        if (confirm('ログアウトしますか？')) {
            const response = await sendAuthRequest('logout');
            if (response.status === 'success') {
                alert('ログアウトしました。');
                localStorage.removeItem('isLoggedIn'); // Local Storageからログイン状態を削除
                toggleAdminContent(false); // ログイン画面表示
                usernameInput.value = '';
                passwordInput.value = '';
                loginMessage.textContent = '';
            } else {
                alert('ログアウトに失敗しました: ' + response.message);
            }
        }
    });

    // お知らせ追加ボタンのクリックイベント
    addButton.addEventListener('click', async () => {
        const type    = infoTypeSelect.value;
        const title   = infoTitleInput.value.trim();
        const content = infoContentInput.value.trim();
        if (!title || !content) {
            alert('タイトルと内容を入力してください。');
            return;
        }
        const data = { Type:type, Title:title, Content:content };
        const response = await sendNewsRequest('add', data);
        if (response.success) {
            alert('情報が追加されました！');
            clearForm(); // フォームをクリア
            fetchInfo(); // リストを再読み込み
        } else {
            alert('情報の追加に失敗しました: ' + response.error);
        }
    });

    // お知らせ更新ボタンのクリックイベント
    updateButton.addEventListener('click', async () => {
        const id      = infoIdInput.value;
        const type    = infoTypeSelect.value;
        const title   = infoTitleInput.value.trim();
        const content = infoContentInput.value.trim();
        if (!id || !title || !content) {
            alert('タイトル、内容、またはIDが不正です。');
            return;
        }
        const data = { ID:parseInt(id), Type:type, Title:title, Content:content };
        const response = await sendNewsRequest('edit', data);
        if (response.success) {
            alert('情報が更新されました！');
            clearForm();
            fetchInfo();
            toggleEditMode(false); // 編集モードを終了
        } else {
            alert('情報の更新に失敗しました: ' + response.error);
        }
    });

    // 編集キャンセルボタンのクリックイベント
    cancelEditButton.addEventListener('click', () => {
        clearForm();
        toggleEditMode(false);
    });

    // パスワード変更ボタンのクリックイベント
    changePasswordButton.addEventListener('click', async () => {
        const username      = changeUsernameInput.value.trim();
        const oldPass       = currentPasswordInput.value.trim();
        const newPass       = newPasswordInput.value.trim();
        const confirmPass   = confirmPasswordInput.value.trim();
        if (!username || !oldPass || !newPass || !confirmPass) {
            changePasswordMessage.textContent = '全ての項目を入力してください。';
            return;
        }
        if (newPass !== confirmPass) {
            changePasswordMessage.textContent = '新しいパスワードが一致していません。';
            return;
        }
        changePasswordMessage.textContent = '処理中...';
        const response = await sendAuthRequest('changePassword', {
            username: username,
            oldPassword: oldPass,
            newPassword: newPass
        });
        if (response.status === 'success') {
            alert('パスワードが変更されました。');
            changePasswordMessage.textContent = '';
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } else {
            changePasswordMessage.textContent = response.message;
        }
    });

    // --- ヘルパー関数 ---

    /**
     * 認証GASウェブアプリへのリクエストを送信する
     * @param {string} action - 実行するアクション (login, logout, checkLoginStatus, changePassword)
     * @param {object} data - 送信するデータ
     * @returns {Promise<object>} GASからのレスポンス
     */
    async function sendAuthRequest(action, data = null) {
        const url = `${GAS_AUTH_WEB_APP_URL}`; // POSTなのでクエリパラメータは不要だが、GAS側でactionを処理するため含める
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, // GASがJSON.parseを期待するためtext/plainで送信
            body: JSON.stringify({ action, ...data }) // actionを含めて送信
        };
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('Auth Request Error:', e);
            // ネットワークエラーやJSONパースエラーの場合、セッションが無効になった可能性も考慮
            // ローカルストレージがTrueでも、GASからの通信エラーならログアウト状態にする
            if (action === 'checkLoginStatus' && localStorage.getItem('isLoggedIn') === 'true') {
                 localStorage.removeItem('isLoggedIn');
                 alert('セッション確認中にエラーが発生しました。再度ログインしてください。');
                 toggleAdminContent(false);
            }
            return { status: 'error', message: e.message };
        }
    }

    /**
     * お知らせ管理GASウェブアプリへのリクエストを送信する
     * @param {string} action - 実行するアクション (read, add, edit, delete)
     * @param {object} data - 送信するデータ (add, edit, deleteの場合)
     * @returns {Promise<object>} GASからのレスポンス
     */
    async function sendNewsRequest(action, data = null) {
        // News Web AppはGET/POSTをアクションで切り替えるため、URLにactionを含める
        const url = `${GAS_NEWS_WEB_APP_URL}?action=${action}`;
        const options = {
            method: action === 'read' ? 'GET' : 'POST',
            headers: {'Content-Type':'text/plain'} // GASがJSON.parseを期待するためtext/plainで送信
        };
        if (data) options.body = JSON.stringify(data);
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('News Request Error:', e);
            // お知らせ管理のリクエスト中に認証エラーが出たらログアウト
            if (e.message.includes('ログインしていません') || e.message.includes('セッションが無効')) { // GASからのメッセージをチェック
                localStorage.removeItem('isLoggedIn');
                alert('セッションが無効になりました。再度ログインしてください。');
                toggleAdminContent(false);
            }
            return { success: false, error: e.message };
        }
    }

    /**
     * ログイン状態をチェックし、コンテンツの表示を切り替える
     */
    async function checkLoginStatusAndDisplayContent() {
        const isLoggedInLocally = localStorage.getItem('isLoggedIn') === 'true';

        // Local Storageがtrueの場合でも、必ずGASに確認しに行く
        if (isLoggedInLocally) {
            // まずはローカルの情報に基づいてUIを表示（高速化）
            toggleAdminContent(true);
            fetchInfo(); // お知らせリストを読み込む
            // ※お問い合わせリスト読み込みの呼び出しは削除

            // その後、GASにも状態確認のリクエストを送り、整合性をチェック
            console.log("クライアント: GASにログイン状態確認中...");
            const res = await sendAuthRequest('checkLoginStatus'); // ここでGAS側からC列の状態も取得

            if (res.status === 'success' && res.loggedIn) {
                console.log("クライアント: GASもログイン状態と判断しました。");
                // GASもログイン状態と判断すれば何もしない (既に表示済み)
            } else {
                console.log("クライアント: GASがログイン状態でないと判断しました。");
                // GASがログイン状態でないと判断した場合、Local Storageをクリアし、ログイン画面に戻す
                localStorage.removeItem('isLoggedIn');
                alert('セッションが無効になりました。再度ログインしてください。');
                toggleAdminContent(false);
            }
        } else {
            // Local Storageにログイン情報がない場合、ログインセクションを表示
            console.log("クライアント: ローカルストレージにログイン情報がありません。ログイン画面を表示します。");
            toggleAdminContent(false);
        }
        highlightCurrentPage(); // ナビゲーションのハイライト
    }

    /**
     * ログイン状態に応じて管理セクションの表示を切り替える
     * @param {boolean} isLoggedIn - ログイン状態 (true:ログイン済み, false:未ログイン)
     */
    function toggleAdminContent(isLoggedIn) {
        loginSection.style.display = isLoggedIn ? 'none' : 'block';
        adminContent.style.display = isLoggedIn ? 'block' : 'none';
    }

    /**
     * スプレッドシートからお知らせ情報を取得してリストに表示する
     */
    async function fetchInfo() {
        infoListContainer.innerHTML = '<p class="loading-message">情報を読み込み中...</p>'; // ローディング表示
        const res = await sendNewsRequest('read'); // GASから情報を読み込む

        if (res.success && res.data) {
            infoListContainer.innerHTML = ''; // 既存のリストをクリア
            if (res.data.length === 0) {
                infoListContainer.innerHTML = '<p class="loading-message">登録されている情報はありません。</p>';
                return;
            }

            // 情報をループしてHTML要素を生成し、リストに追加
            res.data.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('info-item', item.Type); // 'info-item'クラスと、Typeに応じたクラスを追加
                div.dataset.id = item.ID; // データIDをdata属性として保存

                div.innerHTML = `
                    <div class="info-item-content">
                        <h3>${item.Title}</h3>
                        <div class="info-item-meta">
                            <span class="item-type">${getDisplayType(item.Type)}</span> | ID: ${item.ID}
                        </div>
                        <p>${item.Content}</p>
                    </div>
                    <div class="info-item-actions">
                        <button class="edit-btn">編集</button>
                        <button class="delete-btn">削除</button>
                    </div>
                `;
                infoListContainer.appendChild(div);
            });
            addEditDeleteListeners(); // 編集・削除ボタンにイベントリスナーを設定
        } else {
            infoListContainer.innerHTML = '<p class="loading-message">情報の読み込みに失敗しました。</p>';
            console.error('情報の読み込みエラー:', res.error);
        }
    }

    /**
     * 編集・削除ボタンにイベントリスナーを設定する
     */
    function addEditDeleteListeners() {
        // 編集ボタン
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const item = e.target.closest('.info-item'); // 親の.info-item要素を取得
                const id = item.dataset.id;
                const title = item.querySelector('h3').textContent;
                const content = item.querySelector('p').textContent;
                
                // .item-type スパン要素からテキストコンテンツを取得し、対応するタイプコードに変換
                const typeElement = item.querySelector('.item-type');
                const type = getTypeFromDisplay(typeElement ? typeElement.textContent : ''); // nullチェックを追加

                // フォームに情報をセットして編集モードに切り替える
                infoIdInput.value = id;
                infoTypeSelect.value = type;
                infoTitleInput.value = title;
                infoContentInput.value = content;
                toggleEditMode(true);
            });
        });
        // 削除ボタン
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.target.closest('.info-item').dataset.id;
                if (confirm(`ID: ${id} の情報を削除しますか？`)) {
                    const res = await sendNewsRequest('delete', {id: parseInt(id)});
                    if (res.success) {
                        alert('情報を削除しました');
                        fetchInfo(); // リストを再読み込み
                    } else {
                        alert('情報の削除に失敗しました: ' + res.error);
                    }
                }
            });
        });
    }

    /**
     * フォーム入力欄をクリアする
     */
    function clearForm() {
        infoIdInput.value = '';
        infoTypeSelect.value = 'earthquake'; // デフォルト値に戻す
        infoTitleInput.value = '';
        infoContentInput.value = '';
    }

    /**
     * 追加/更新/キャンセルボタンの表示を切り替えて、編集モードを制御する
     * @param {boolean} isEdit - 編集モードかどうか (true:編集モード, false:追加モード)
     */
    function toggleEditMode(isEdit) {
        addButton.style.display    = isEdit ? 'none' : 'inline-block';
        updateButton.style.display = isEdit ? 'inline-block' : 'none';
        cancelEditButton.style.display = isEdit ? 'inline-block' : 'none';
    }

    /**
     * タイプコード（例: 'earthquake'）を日本語表示に変換する
     * @param {string} code - タイプコード
     * @returns {string} 日本語表示
     */
    function getDisplayType(code) {
        switch(code) {
            case 'earthquake': return '地震速報';
            case 'weather':    return '気象情報';
            case 'traffic':    return '交通情報';
            case 'system':     return 'システム通知';
            default:           return code; // 未知のコードはそのまま返す
        }
    }

    /**
     * 日本語表示をタイプコードに変換する (編集時に使用)
     * @param {string} txt - 日本語表示
     * @returns {string} タイプコード
     */
    function getTypeFromDisplay(txt) {
        switch(txt) {
            case '地震速報': return 'earthquake';
            case '気象情報': return 'weather';
            case '交通情報': return 'traffic';
            case 'システム通知': return 'system';
            default:           return 'system'; // マッチしない場合はデフォルトで'system'
        }
    }

    /**
     * 現在のページのナビゲーションリンクをハイライトする
     */
    function highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop(); // 現在のHTMLファイル名を取得
        const navLinks = document.querySelectorAll('.main-nav a'); // ナビゲーションリンクをすべて取得

        navLinks.forEach(link => {
            const linkPath = link.href.split('/').pop(); // 各リンクのHTMLファイル名を取得
            // 現在のページがリンク先と一致するか、またはindex.html（デフォルトページ）の場合に'active'クラスを追加
            if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ※お問い合わせ管理機能の関連関数はすべて削除
});