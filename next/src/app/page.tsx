"use client";

import Image from 'next/image';
import { basePath } from '../utils/foundation';

export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center', paddingTop: '2rem' }}>
      <img
        src={`${basePath}/icons/character-level01.jpg`}
        alt="キャラクター"
        style={{
          width: '200px', // 幅を設定
          height: '200px', // 高さを設定
        }}
      />
      <span style={{ fontSize: '1.5rem', writingMode: 'vertical-rl', textOrientation: 'upright', marginLeft: '1rem' }}>
        あたちとまちをめぐって、いろんなスポットをおちえてね！
      </span>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', writingMode: 'vertical-rl', textOrientation: 'upright' }}>
        ナカノDEハイクにようこそ！
      </h1>
    </div>
  );
}