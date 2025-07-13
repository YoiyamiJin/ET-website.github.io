// contact_script.js

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    // ★★★ここにあなたのGoogleフォームの「form action」URLを貼り付けてください★★★
    // Googleフォームの「送信」-> 「<>埋め込みHTML」で取得できるURLです。
    // 例: const FORM_ACTION_URL = "/https://docs.google.com/forms/d/e/1FAIpQLScMh1RHHGKLUMbRZWAEQO54wBLgZ2DWg-qgSzWacyu6KDDW0A/formResponse";
    const FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLScMh1RHHGKLUMbRZWAEQO54wBLgZ2DWg-qgSzWacyu6KDDW0A/formResponse";
    // ----------------------------------------------------------------------

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // フォームのデフォルト送信をキャンセル

        formMessage.textContent = '送信中...';
        formMessage.className = 'message'; // メッセージスタイルをリセット

        // FormDataオブジェクトを作成し、フォームのデータを取得
        // Googleフォームに直接送信するため、formのname属性をGoogleフォームのentry.xxxに合わせる必要があります
        const formData = new FormData(contactForm);

        try {
            const response = await fetch(FORM_ACTION_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' // Googleフォームへのクロスオリジンリクエストのため必須
            });

            // Googleフォームへの直接送信は、no-corsモードでは常にresponse.okがfalseになりますが、
            // エラーが発生しない限り、フォームは正常に送信されています。
            // そのため、ここでは明確なエラーがない限り成功とみなします。
            // より確実な方法はGASを介して処理することですが、今回は直接送信の要望なのでこの形式です。

            formMessage.textContent = 'お問い合わせを受け付けました。ありがとうございます！';
            formMessage.classList.add('success');
            contactForm.reset(); // フォームをリセット

        } catch (error) {
            console.error('フォーム送信エラー:', error);
            formMessage.textContent = '送信中にエラーが発生しました。もう一度お試しください。';
            formMessage.classList.add('error');
        }
    });

    // ナビゲーションのアクティブ状態をハイライトする関数（Admin.htmlと同じもの）
    function highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.main-nav a');

        navLinks.forEach(link => {
            const linkPath = link.href.split('/').pop();
            // currentPathが空の場合（ルートディレクトリのindex.htmlなど）も考慮
            if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    highlightCurrentPage(); // ページ読み込み時に実行
});