"use client";

import Image from 'next/image';
import { basePath } from '../utils/foundation';

export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center', paddingTop: '2rem' }}>
      <Image src={`${basePath}/icons/character-level01.jpg`} alt="キャラクター" width={200} height={200} style={{ marginLeft: '1rem' }} />
      <span style={{ fontSize: '1.5rem', writingMode: 'vertical-rl', textOrientation: 'upright', marginLeft: '1rem' }}>
        あたちとまちをめぐって、いろんなスポットをおちえてね！
      </span>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', writingMode: 'vertical-rl', textOrientation: 'upright' }}>
        ナカノDEハイクにようこそ！
      </h1>
    </div>
  );
}