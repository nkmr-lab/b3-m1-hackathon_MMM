"use client";

import React, { useEffect, useState } from 'react';
import "./event.css"; // CSSファイルをインポート
import EXIF from 'exif-js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

/**
 * このコンポーネントはイベント紹介ページを表示します。
 * 
 * @returns {JSX.Element} イベント紹介ページのJSX要素
 */
export default function Event() {
    const [data, setData] = useState(null);
    //const [base64Image, setBase64Image] = useState<string | null>(null);
    const [imageEncoded, setimageEncoded] = useState<string | null>(null);
    const [exifData, setExifData] = useState<any>(null);
    const [gpsData, setGpsData] = useState<{ latitude: number | null, longitude: number | null }>({ latitude: null, longitude: null });
    const [text, setText] = useState(""); // ユーザー入力用のテキスト
    const [quality, setQuality] = useState(2); // ユーザー入力用のクオリティ
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setimageEncoded(reader.result as string);
            };

            // EXIF情報を取得
            EXIF.getData(file as any, function (this: any) {
                const allExifData = EXIF.getAllTags(this);
                setExifData(allExifData);

                // GPSデータの有無を確認し、取得
                if (allExifData.GPSLatitude && allExifData.GPSLongitude && allExifData.GPSLatitudeRef && allExifData.GPSLongitudeRef) {
                    const convertDMSToDD = (degrees: number, minutes: number, seconds: number, direction: string) => {
                        let dd = degrees + minutes / 60 + seconds / 3600;
                        if (direction === 'S' || direction === 'W') {
                            dd = dd * -1;
                        }
                        return dd;
                    };

                    const latitude = convertDMSToDD(
                        allExifData.GPSLatitude[0], allExifData.GPSLatitude[1], allExifData.GPSLatitude[2], allExifData.GPSLatitudeRef
                    );
                    const longitude = convertDMSToDD(
                        allExifData.GPSLongitude[0], allExifData.GPSLongitude[1], allExifData.GPSLongitude[2], allExifData.GPSLongitudeRef
                    );
                    setGpsData({ latitude, longitude });
                } else {
                    setGpsData({ latitude: null, longitude: null });
                    setimageEncoded(null);
                    setExifData(null);
                    toast.error('画像のGPS情報が見つかりませんでした');
                }
            });
            reader.readAsDataURL(file);
        } else {
            setimageEncoded(null);
            setExifData(null);
            setGpsData({ latitude: null, longitude: null });
            toast.error('画像の読み込みに失敗しました');
        }
    };

    const handleSubmit = async () => {
        if (!exifData) {
            toast.error('画像が選択されていません');
            return;
        } else if (!text) {
            toast.error('コメントが入力されていません');
            return;
        } else if (gpsData.latitude === null || gpsData.longitude === null) {
            toast.error('画像のGPS情報が見つかりませんでした');
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
                    image: imageEncoded,
                    text: text,
                    quality: quality,
                }),
            });

            if (response.ok) {
                console.log("座標：" + gpsData.latitude + ", " + gpsData.longitude);
                toast.success('投稿しました');

                //window.location.href = '/events'; // feedページに遷移
            } else {
                toast.error('投稿に失敗しました');
            }

            const result = await response.json();

            console.log(user?.uid);


            const response2 = await fetch("http://localhost:8080/tweet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image_encoded: imageEncoded,
                    gps_lat: 80.019482,
                    gps_lon: 80.019482,
                    user_uid: "ihN4adZkkMcf17tdVmuAD3",
                    comment: "awfawf",
                    haiku: "haiku",
                }),
            });

            setText('');
            setExifData(null);
            setGpsData({ latitude: null, longitude: null });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // キャラクター画像をレベルごとに変更
    const getCharacterImage = () => {
        switch (quality) {
            case 1:
                return "/icons/character-speaking.png"; // 小学生向け
            case 2:
                return "/icons/character-speaking.jpg"; // 成人向け
            case 3:
                return "/icons/character-thinking.png"; // 詩人向け
            default:
                return "/icons/character-speaking.png"; // デフォルト
        }
    };

    return (
        <div className="container">

            {/* 俳句が表示されていないときのみ入力部分を表示 */}
            {!data && (
                <>

                    <h1 className="title black-text">写真と感想を教えてください！</h1>

                    {/* 画像アップロード */}
                    <div className="input-group">
                        <label className="label">📷 画像をアップロード</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
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
                            max="3"
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
                </>
            )}

            {/* 結果の表示 */}
            {isLoading ? (
                <p>考え中・・・</p>
            ) : data ? (

                <div className="haiku-display">
                    {/* 入力した画像を上に表示 */}
                    {imageEncoded && <img src={imageEncoded} alt="入力画像" className="input-image" />}

                    <div className="haiku-content">
                        {/* 俳句 */}
                        <div className="speech-bubble vertical-text haiku-left">
                            <h3 className="haiku-text">
                                {JSON.stringify(data)
                                    .replace(/^\["|"\]$/g, "")  // [""] を削除
                                    .split(",") // カンマで区切る
                                    .map((line, index) => (
                                        <span key={index} className={`haiku-line line-${index}`}>
                                            {line}
                                        </span>
                                    ))}
                            </h3>
                        </div>

                        {/* キャラクター（右下） */}
                        <img src={getCharacterImage()} alt="キャラクター" className="character character-large character-right" />
                    </div>
                </div>
            ) : (
                <p className="message">画像をアップロードし、感想とレベルを設定した後、送信してください。</p>
            )}
        </div>
    );
}