"use client";

import React, { useEffect, useState } from 'react';
import "./event.css"; // CSSファイルをインポート

/**
 * このコンポーネントはイベント紹介ページを表示します。
 * 
 * @returns {JSX.Element} イベント紹介ページのJSX要素
 */
export default function Event() {
    const [data, setData] = useState(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [text, setText] = useState(""); // ユーザー入力用のテキスト
    const [quality, setQuality] = useState(100); // ユーザー入力用のクオリティ
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBase64Image(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 送信ボタンを押した時の処理
    /*useEffect(() => {
        const fetchData = async () => {
            if (!base64Image || !text || quality <= 0) {
                setError("画像、テキスト、クオリティのすべてを入力してください。");
                return;
            }
    
            setIsLoading(true);
            setError(null); // エラーのリセット

            try {
                const response = await fetch('http://localhost:8080/openai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: base64Image,
                        text: text,
                        quality: quality
                    }),
                });

                if (!response.ok) {
                    console.error('Network response was not ok');
                    return;
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        fetchData();
    }, [base64Image]);
    */

    const handleSubmit = async () => {
        if (!base64Image || !text || quality <= 0) {
            setError("画像、テキスト、レベルのすべてを入力してください。");
            return;
        }

        setIsLoading(true);
        setError(null); // エラーのリセット
        
        try {
            const response = await fetch("http://localhost:8080/openai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: base64Image,
                    text: text,
                    quality: quality,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="title black-text">写真と感想を教えてください！</h1>

            {/* 画像アップロード */}
            <div className="input-group">
                <label className="label">📷 画像をアップロード</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className = "file-input"/>
            </div>

            {/* テキスト入力 */}
            <div className="input-group">
                <label className="label">✏️ 感想を入力</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="ここに感想を入力してください..."
                    rows={3} 
                    className="textarea"
                />
            </div>

            {/* クオリティ選択 */}
            <div className="input-group">
                <label className="label">⭐ レベル: {quality}</label>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="slider"
                />
            </div>

            {/* 送信ボタン */}
            <div className="input-group">
                <button onClick={handleSubmit} disabled={isLoading} className="button">
                    {isLoading ? "送信中..." : "送信"}
                </button>
            </div>

            {/* 結果の表示 */}
            {isLoading ? (
                <p>Loading...</p>
            ) : data ? (
                <pre className="response">{JSON.stringify(data, null, 2)}</pre>
            ) : (
                <p className="message">画像をアップロードし、感想とレベルを設定した後、送信してください。</p>
            )}
      </div>
    );
}