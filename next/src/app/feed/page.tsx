"use client";
import React, { useState, useEffect } from 'react';

/**
 * このコンポーネントは投稿一覧ページを表示します。。
 *
 * @returns {JSX.Element} 投稿一覧ページのJSX要素
 */

interface Post {
  img_file_name: string;
  haiku: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:8080/haiku-posts');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPosts();
  }, []);

  const cardWidth = '350px';
  const cardHeight = '150px';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center', // 中央揃え
        padding: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
          maxWidth: '800px', // 任意の最大幅を設定
          width: '100%',
        }}
      >
        {posts.map((post, index) => (
          <HoverCard key={index} post={post} cardWidth={cardWidth} cardHeight={cardHeight} />
        ))}
      </div>
    </div>
  );
}

/**
 * HoverCard コンポーネント
 * カードにマウスが乗ったときに拡大するホバーエフェクトを実装
 */
function HoverCard({
  post,
  cardWidth,
  cardHeight,
}: {
  post: { img_file_name: string; haiku: string };
  cardWidth: string;
  cardHeight: string;
}) {
  const [hovered, setHovered] = useState(false);
  const lines = post.haiku.split(',');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        width: cardWidth,
        height: cardHeight,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 8px 16px rgba(0, 0, 0, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
        backgroundColor: hovered ? '#c8e6c9' : '#ffffff',
      }}
    >
      {/* 左側：画像 */}
      <div
        style={{
          width: '50%',
          height: '100%',
          position: 'relative',
        }}
      >
        <img
          src={"http://localhost:8080/image/" + post.img_file_name}
          alt="写真"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
      {/* 右側：縦書きの俳句（各句を個別の縦書きブロックとして横並びに配置） */}
      <div
        style={{
          width: '50%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row', // 各句を横並びに配置
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#e0f7fa',
        }}
      >
        {lines.map((line, index) => {
          // 各句ごとに揃え方を指定
          let alignSelf: 'flex-start' | 'center' | 'flex-end' = 'center';
          if (index === 0) {
            alignSelf = 'flex-end';
          } else if (index === 2) {
            alignSelf = 'flex-start';
          }
          return (
            <div
              key={index}
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'upright' as any,
                margin: '0 4px',
                alignSelf: alignSelf,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
