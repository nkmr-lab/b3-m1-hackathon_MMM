"use client";
import React, { useState, useEffect } from 'react';
import { apiRoot } from "../../utils/foundation";
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image';

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
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // console.log(user?.uid || "guest");
    const user_uid = user?.uid || "guest"
    const fetchPosts = async () => {
      try {
        const response = await fetch(apiRoot + '/haiku-posts?user_uid=' + user_uid);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPosts(data);
        // console.log(data)
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPosts();
  }, [user]);

  const cardWidth = '350px';
  const cardHeight = '150px';

  return (
    posts && posts.length > 0 ? (
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
    ) : (
      !isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center', paddingTop: '2rem' }}>
          <Image
            src={'/icons/character-level01.jpg'}
            alt="キャラクター"
            width={200}
            height={200}
            className="rounded-md object-cover"
          />
          <span style={{ fontSize: '1.5rem', writingMode: 'vertical-rl', textOrientation: 'upright', marginLeft: '1rem' }}>
            まずは「詠む」ページから、写真を送ってね！
          </span>
        </div>
      )
    )
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
  const reversed_lines = post.haiku.split(',').reverse(); // なぜか表示が逆になるので逆転させる

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
        <Image
          unoptimized
          src={apiRoot + "/image/" + post.img_file_name}
          alt="写真"
          fill
          style={{
            objectFit: 'cover',
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
        {reversed_lines.map((line, index) => (
          <div
            key={index}
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              margin: '0 4px',
              alignSelf: index === 0 ? 'flex-end' : index === 1 ? 'center' : 'flex-start',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
