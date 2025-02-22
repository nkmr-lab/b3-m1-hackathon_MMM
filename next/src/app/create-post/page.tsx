"use client";

/**
 * このコンポーネントはスポット制覇の実績を表示します。
 * 
 * @returns {JSX.Element} 投稿一覧ページのJSX要素
 */

import TextComment from "../../components/TextComment";
import Achievement from "../../components/Achievement";

export default function Post() {
    return (
        <>
            {/* <TextComment /> */}
            <Achievement />
        </>
    );
}