'use client';

import React from 'react';

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>印刷ページ</title>
        {/* 印刷に最適化したスタイル */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              margin: 0;
              padding: 0;
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
              background-color: white;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: auto;
              margin: 10mm;
            }
          }
          
          /* 縦書きレイアウト対応 */
          .vertical-rl {
            writing-mode: vertical-rl;
            text-orientation: mixed;
          }
          
          .vertical-lr {
            writing-mode: vertical-lr;
            text-orientation: mixed;
          }
          
          /* 数字の縦中横 */
          .tcy {
            text-combine-upright: all;
            text-orientation: upright;
          }
        `}} />
        {/* ゴシック体と明朝体のフォント読み込み */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@400;700&family=Shippori+Mincho:wght@400;700&display=swap" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}