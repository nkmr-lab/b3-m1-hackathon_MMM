"use client";

import React, { useEffect, useState } from 'react';
import "./event.css"; // CSSファイルをインポート
import EXIF from 'exif-js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';

/**
 * このコンポーネントはイベント紹介ページを表示します。
 * 
 * @returns {JSX.Element} イベント紹介ページのJSX要素
 */
export default function Event() {
    const [haiku, setHaiku] = useState("");
    const [imageEncoded, setimageEncoded] = useState<string | null>(null);
    const [exifData, setExifData] = useState<any>(null);
    const [gpsData, setGpsData] = useState<{ latitude: number | null, longitude: number | null }>({ latitude: null, longitude: null });
    const [text, setText] = useState(""); // ユーザー入力用のテキスト
    const [quality, setQuality] = useState(1); // 俳句のレベル
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

        const fetchHaiku = async () => {
            const response = await fetch("http://localhost:8080/haiku", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image_encoded: imageEncoded,
                    gps_lat: gpsData.latitude ? parseFloat(gpsData.latitude.toFixed(6)) : null,
                    gps_lon: gpsData.longitude ? parseFloat(gpsData.longitude.toFixed(6)) : null,
                    user_uid: user?.uid || "guest",
                    comment: text,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text(); // エラーメッセージを取得
                throw new Error(errorText);
            }

            const result = await response.json();
            const haiku = result.haiku.replace(/,/g, "¥n");

            console.log(haiku);

            setText('');
            setExifData(null);
            setGpsData({ latitude: null, longitude: null });
            setHaiku(haiku);
            setQuality(result.level);

            return result;
        };

        toast.promise(
            fetchHaiku(),
            {
                loading: 'いちごちゃんが考え中...',
                success: 'ここで一句！',
                error: '俳句が思いつかなかった...',
            }
        ).finally(() => {
            setIsLoading(false);
        });
    };

    // キャラクター画像をレベルごとに変更
    const getCharacterImage = () => {
        switch (quality) {
            case 1:
                console.log("Haiku Level 1 generated");
                return "/icons/character-level01.jpg"; // 小学生向け
            case 2:
                console.log("Haiku Level 2 generated");
                return "/icons/character-level01.jpg"; // 成人向け
            case 3:
                console.log("Haiku Level 3 generated");
                return "/icons/character-level01.jpg"; // 詩人向け
            default:
                return "/icons/character-level01.jpg"; // デフォルト
        }
    };

    return (
        <div className="container">
            {!haiku && (
                <>
                    <div className="input-group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="imageInput"
                        />
                        <Button onClick={() => document.getElementById('imageInput')?.click()} style={{ width: "100%" }}>
                            📷 画像をアップロード
                        </Button>
                    </div>
                    {imageEncoded && (
                        <div style={{ marginTop: '1rem' }}>
                            <img src={imageEncoded} alt="アップロードされた画像" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
                        </div>
                    )}
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="ここに感想を入力してください..."
                        rows={3}
                        className="textarea"
                        style={{ marginBottom: '1rem' }} // マージンを追加
                    />
                    <div className="input-group" style={{ width: "100%" }}>
                        <Button onClick={handleSubmit} disabled={isLoading} style={{ width: "100%" }}>
                            {isLoading ? "送信中..." : "送信"}
                        </Button>
                    </div>
                </>
            )}

            {/* 結果の表示 */}
            {isLoading ? (
                <img
                    src={getCharacterImage()}
                    alt="キャラクター"
                    className="character character-large character-right"
                    style={{
                        animation: "moveLeftRight 2s infinite",
                    }}
                />
            ) : haiku ? (
                <div className="haiku-display">
                    <div className="haiku-content">
                        <img
                            src={getCharacterImage()}
                            alt="キャラクター"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: '150px', // 幅を設定
                                height: '150px', // 高さを設定
                            }}
                        />
                        {imageEncoded && <img src={imageEncoded} alt="入力画像" className="input-image" />}
                        <div className="speech-bubble vertical-text haiku-left">
                            <h3 className="haiku-text">
                                {haiku
                                    .replace(/^\["|"\]$/g, "")  // [""] を削除
                                    .split("¥n") // 改行で区切る
                                    .map((line, index) => (
                                        <span key={index} className={`haiku-line line-${index}`}>
                                            {line}
                                        </span>
                                    ))}
                            </h3>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="message">画像と感想を入力した後、送信してください</p>
            )}
            <style jsx>{`
    @keyframes moveLeftRight {
        0% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(20px);
        }
        100% {
            transform: translateX(0);
        }
    }
`}</style>
        </div>
    );
}