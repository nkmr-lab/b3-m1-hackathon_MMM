"use client";

import React, { useState } from 'react';
import "./event.css"; // CSSファイルをインポート
import EXIF from 'exif-js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { apiRoot } from "../../utils/foundation";
import { basePath } from "../../utils/foundation";
import Image from 'next/image';

/**
 * このコンポーネントはイベント紹介ページを表示します。
 * 
 * @returns {JSX.Element} イベント紹介ページのJSX要素
 */

interface ExifData {
    GPSLatitude?: [number, number, number];
    GPSLongitude?: [number, number, number];
    GPSLatitudeRef?: 'N' | 'S';
    GPSLongitudeRef?: 'E' | 'W';
}

export default function Event() {
    const [haiku, setHaiku] = useState("");
    const [imageEncoded, setImageEncoded] = useState<string | null>(null);
    const [exifData, setExifData] = useState<ExifData | null>(null);
    const [gpsData, setGpsData] = useState<{ latitude: number | null, longitude: number | null }>({ latitude: null, longitude: null });
    const [text, setText] = useState(""); // ユーザー入力用のテキスト
    const [quality, setQuality] = useState(1); // 俳句のレベル
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    /**
     * 画像をリサイズしてData URLとして返す関数
     * @param dataUrl 読み込んだ画像のData URL
     * @param fileSize 元のファイルサイズ（バイト）
     * @param maxSize 最大ピクセル数
     */
    const resizeImage = (dataUrl: string, fileSize: number, maxSize: number): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.src = dataUrl;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(maxSize / img.width, maxSize / img.height);

                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // 圧縮率を動的に計算
                    const compressionQuality = fileSize > 1000000
                        ? Math.max(1000000 / fileSize, 0.5) // 1MB超の場合は動的に圧縮率を設定、最低でも50%に制限
                        : 1.0; // 1MB以下の場合は圧縮しない

                    resolve(canvas.toDataURL('image/jpeg', compressionQuality));
                }
            };
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                if (reader.result) {
                    resizeImage(reader.result as string, file.size, 1024).then((resizedDataUrl) => {
                        setImageEncoded(resizedDataUrl);
                    });
                }
            };

            // EXIF情報を取得
            EXIF.getData(file as unknown as string, function (this: ExifData) {
                const allExifData = EXIF.getAllTags(this) as ExifData;
                setExifData(allExifData);

                // GPSデータの有無を確認し、取得
                if (
                    allExifData.GPSLatitude &&
                    allExifData.GPSLongitude &&
                    allExifData.GPSLatitudeRef &&
                    allExifData.GPSLongitudeRef
                ) {
                    const convertDMSToDD = (
                        degrees: number,
                        minutes: number,
                        seconds: number,
                        direction: 'N' | 'S' | 'E' | 'W'
                    ): number => {
                        let dd = degrees + minutes / 60 + seconds / 3600;
                        if (direction === 'S' || direction === 'W') {
                            dd = dd * -1;
                        }
                        return dd;
                    };

                    const latitude = convertDMSToDD(
                        allExifData.GPSLatitude[0],
                        allExifData.GPSLatitude[1],
                        allExifData.GPSLatitude[2],
                        allExifData.GPSLatitudeRef
                    );

                    const longitude = convertDMSToDD(
                        allExifData.GPSLongitude[0],
                        allExifData.GPSLongitude[1],
                        allExifData.GPSLongitude[2],
                        allExifData.GPSLongitudeRef
                    );

                    // console.log("緯度：" + latitude + ",経度：" + longitude);
                    setGpsData({ latitude, longitude });
                } else {
                    setGpsData({ latitude: null, longitude: null });
                    // setImageEncoded(null);
                    setExifData(null);
                    toast('画像のGPS情報が見つかりません', {
                        icon: '🚨',
                    });
                }
            });
            reader.readAsDataURL(file);
        } else {
            // setImageEncoded(null);
            setExifData(null);
            setGpsData({ latitude: null, longitude: null });
            toast.error('画像の読み込みに失敗しました');
        }
    };

    const handleSubmit = async () => {
        if (exifData) {
            // toast.error('画像が選択されていません');
            // return;
        } else if (!text) {
            toast.error('コメントが入力されていません');
            return;
        } else if (gpsData.latitude === null || gpsData.longitude === null) {
            // toast.error('画像のGPS情報が見つかりません。');
            // return;
        }

        setIsLoading(true);

        const fetchHaiku = async () => {
            const response = await fetch(apiRoot + "/haiku", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image_encoded: imageEncoded,
                    gps_lat: gpsData.latitude ? parseFloat(gpsData.latitude.toFixed(6)) : 0,
                    gps_lon: gpsData.longitude ? parseFloat(gpsData.longitude.toFixed(6)) : 0,
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
                // console.log("Haiku Level 1 generated");
                return `${basePath}/icons/character-level01.jpg`; // 小学生向け
            case 2:
                // console.log("Haiku Level 2 generated");
                return `${basePath}/icons/character-level01.jpg`; // 成人向け
            case 3:
                // console.log("Haiku Level 3 generated");
                return `${basePath}/icons/character-level01.jpg`; // 詩人向け
            default:
                return `${basePath}/icons/character-level01.jpg`; // デフォルト
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
                    {imageEncoded && gpsData && (
                        <div style={{ position: 'relative', width: '100%', height: '400px', marginBottom: '1rem' }}>
                            <Image
                                src={imageEncoded}
                                alt="アップロードされた画像"
                                layout="fill"
                                objectFit="cover"
                            />
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
                <Image
                    src={getCharacterImage()}
                    alt="キャラクター"
                    width={200}
                    height={200}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: '25%',
                        objectFit: 'cover',
                        animation: 'moveLeftRight 2s infinite',
                    }}
                />
            ) : haiku ? (
                <div className="haiku-display">
                    <div className="haiku-content">
                        <Image
                            src={getCharacterImage()}
                            alt="キャラクター"
                            width={150}
                            height={150}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                            }}
                        />
                        {imageEncoded && 
                        <Image
                            src={imageEncoded}
                            alt="入力画像"
                            className="input-image pb-10"
                            width={600}
                            height={400}
                        />}
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
                <>
                    <p className="message">写真と感想を入力した後、送信してください</p>
                    <p className="message"><span className="text-red-500">写真は必ず「写真ライブラリ」から選択し、カメラは起動しないでください。</span></p>
                </>

            )}
            <style jsx>{`
    @keyframes moveLeftRight {
        0% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(40px);
        }
        100% {
            transform: translateX(0);
        }
    }
`}</style>
        </div>
    );
}