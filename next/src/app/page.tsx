"use client";
import { basePath } from '../utils/foundation';

export default function Home() {
  //test
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
        ナカノのいろんなスポットをめぐろう！
      </span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', writingMode: 'vertical-rl', textOrientation: 'upright' }}>
        ナカノ
        <span style={{ writingMode: 'horizontal-tb', textOrientation: 'sideways' }}>
          DE
        </span>
        ハイクへ！
      </h1>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', writingMode: 'vertical-rl', textOrientation: 'upright' }}>
        ようこそ、
      </h1>
    </div>
  );
}