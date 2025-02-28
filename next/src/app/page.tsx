"use client";
import { basePath } from '../utils/foundation';
import Image from 'next/image';

export default function Home() {
  //test
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center', paddingTop: '2rem' }}>
      <Image
        src="/icons/character-level01.jpg"
        alt="キャラクター"
        width={200}
        height={200}
        className="rounded-md object-cover"
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