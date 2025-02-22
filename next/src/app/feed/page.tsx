"use client";
import React, { useState } from 'react';

/**
 * このコンポーネントは投稿一覧ページを表示します。。
 *
 * @returns {JSX.Element} 投稿一覧ページのJSX要素
 */
export default function Feed() {
  const posts = [
    {
      id: 1,
      image: 'https://picsum.photos/id/237/800/600',
      haiku: '朝露に\n咲く一輪の\n花の色'
    },
    {
      id: 2,
      image: 'https://picsum.photos/id/238/800/600',
      haiku: '夕焼けに\n影ひとつ落ちる\n山の端'
    },
    {
      id: 3,
      image: 'https://picsum.photos/id/239/800/600',
      haiku: '風そよぐ\n夏のひととき\n木陰にて'
    },
    {
      id: 4,
      image: 'https://picsum.photos/id/240/800/600',
      haiku: '秋の月\n静かに照らす\n夜の空'
    },
    {
      id: 5,
      image: 'https://picsum.photos/id/241/800/600',
      haiku: '雪舞う\n静けさの中\n白き世界'
    },
    {
      id: 6,
      image: 'https://picsum.photos/id/242/800/600',
      haiku: '春風に\n揺れる花々\n命輝く'
    },
    {
      id: 7,
      image: 'https://picsum.photos/id/243/800/600',
      haiku: '水面に\n映る青空\n夢のよう'
    },
    {
      id: 8,
      image: 'https://picsum.photos/id/244/800/600',
      haiku: '星降る夜\n願い込めたる\n光の道'
    },
    {
      id: 9,
      image: 'https://picsum.photos/id/2/800/600',
      haiku: '遠い記憶\n風に流され\n時は過ぎ'
    },
    {
      id: 10,
      image: 'https://picsum.photos/id/26/800/600',
      haiku: '花散る\n儚さ感じる\n春の終わり'
    },
  ];

  const cardWidth = '350px';
  const cardHeight = '150px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      {posts.map((post) => (
        <HoverCard key={post.id} post={post} cardWidth={cardWidth} cardHeight={cardHeight} />
      ))}
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
  post: { id: number; image: string; haiku: string };
  cardWidth: string;
  cardHeight: string;
}) {
  const [hovered, setHovered] = useState(false);
  const lines = post.haiku.split('\n');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        width: cardWidth,
        height: cardHeight,
        border: '1px solid #ddd',
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
          src={"http://localhost:8080/image/7e82d568-68c0-4c7e-a5dc-5aeff4d68d50.png"}
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
