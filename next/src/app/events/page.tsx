"use client";

import React, { useEffect, useState } from 'react';
import './Event.css';

/**
 * このコンポーネントはイベント紹介ページを表示します。
 * 
 * @returns {JSX.Element} イベント紹介ページのJSX要素
 */
export default function Event() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8080/kaiji')
            .then(response => response.json())
            .then(data => setData(data));
    }, []);

    let content;

    if (!data) { //データがまだロード(フェッチ)されていない場合
        content = <p className="black-text">Loading...</p>;
    } else {
        content = <pre className="black-text">{JSON.stringify(data, null, 2)}</pre>;
    }

    return (
        <>
            <h1 className="black-text">イベント紹介ページ</h1>
            {content}
        </>
    );
}