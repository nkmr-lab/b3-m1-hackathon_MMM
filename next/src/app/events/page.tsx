"use client";

import React, { useEffect, useState } from 'react';

/**
 * このコンポーネントはイベント紹介ページを表示します。
 * 
 * @returns {JSX.Element} イベント紹介ページのJSX要素
 */
export default function Event() {
    const [data, setData] = useState(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchData = async () => {
            if (!base64Image) return;

            try {
                const response = await fetch('http://localhost:8080/openai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: base64Image,
                        text: "example text",
                        quality: 100
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

    return (
        <>
            <h1>イベント紹介ページです．</h1>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {!data ? (
                <p>Loading...</p>
            ) : (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            )}
        </>
    );
}