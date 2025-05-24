'use client';

import React from 'react';
import Image from 'next/image';
import { Newspaper } from '@/types';

interface NewspaperViewerProps {
  newspaper: Newspaper;
  isPreview?: boolean;
}

export default function NewspaperViewer({ newspaper, isPreview = false }: NewspaperViewerProps) {
  const { content, customSettings } = newspaper;

  // コンテンツが存在しない場合の処理
  if (!content) {
    return (
      <div className="newspaper-container mx-auto bg-white p-8 text-center" style={{ maxWidth: '1200px' }}>
        <h2 className="text-xl font-semibold text-gray-600">新聞を生成中...</h2>
        <p className="text-gray-500 mt-2">コンテンツが準備でき次第表示されます。</p>
      </div>
    );
  }

  // 縦書きテキスト変換
  const convertToVerticalText = (text: string) => {
    // 半角数字を全角に変換（縦書きで読みやすくするため）
    return text.replace(/[0-9]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) + 0xFEE0);
    });
  };

  return (
    <div className="newspaper-container mx-auto bg-white" style={{ maxWidth: '1200px' }}>
      {/* 新聞ヘッダー */}
      <header className="newspaper-header border-b-4 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="text-sm">
            <div className="font-bold">{content.header.issueNumber}</div>
          </div>
          <div className="text-center flex-1">
            <h1 className="text-6xl font-newspaper font-black tracking-wider mb-2">
              {content.header.newspaperName}
            </h1>
            <div className="text-lg">{content.header.date}</div>
          </div>
          <div className="text-sm text-right">
            {customSettings.logoUrl && (
              <Image 
                src={customSettings.logoUrl} 
                alt="Logo" 
                width={48}
                height={48}
                className="h-12 ml-auto mb-2"
              />
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="newspaper-content grid grid-cols-12 gap-4">
        {/* メイン記事（左側大きく） */}
        <div className="col-span-8">
          <article className="main-article">
            <h2 className="text-5xl font-newspaper font-black mb-2 leading-tight">
              {content.mainArticle.headline}
            </h2>
            <h3 className="text-2xl font-newspaper mb-4 text-gray-700">
              {content.mainArticle.subheadline}
            </h3>
            
            {content.mainArticle.imageUrl && (
              <figure className="mb-4">
                <Image 
                  src={content.mainArticle.imageUrl} 
                  alt="Main article" 
                  width={800}
                  height={256}
                  className="w-full h-64 object-cover border border-gray-300"
                />
              </figure>
            )}

            <div className="article-body newspaper-column text-justify leading-relaxed">
              <p className="font-newspaper text-base first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-2">
                {content.mainArticle.content}
              </p>
            </div>
          </article>
        </div>

        {/* サイドバー（右側） */}
        <div className="col-span-4 space-y-4">
          {/* サブ記事 */}
          {content.subArticles.slice(0, 2).map((article, index) => (
            <article key={index} className="sub-article border-b border-gray-300 pb-4">
              <h3 className="text-xl font-newspaper font-bold mb-2">
                {article.headline}
              </h3>
              {article.imageUrl && (
                <Image 
                  src={article.imageUrl} 
                  alt={`Sub article ${index + 1}`} 
                  width={400}
                  height={128}
                  className="w-full h-32 object-cover mb-2"
                />
              )}
              <p className="text-sm font-newspaper leading-relaxed text-justify">
                {article.content}
              </p>
            </article>
          ))}

          {/* サイドバーコンテンツ */}
          {content.sidebarContent && (
            <div className="sidebar-content bg-gray-100 p-4 rounded">
              <h4 className="font-bold mb-2">関連情報</h4>
              <div className="text-sm writing-vertical-rl h-64">
                {convertToVerticalText(content.sidebarContent)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 下部記事 */}
      <div className="newspaper-bottom grid grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-black">
        {content.subArticles.slice(2).map((article, index) => (
          <article key={index + 2} className="bottom-article">
            <h3 className="text-lg font-newspaper font-bold mb-2 border-b border-gray-400 pb-1">
              {article.headline}
            </h3>
            <p className="text-sm font-newspaper leading-relaxed text-justify">
              {article.content}
            </p>
          </article>
        ))}

        {/* コラム */}
        {content.columnContent && (
          <div className="column bg-gray-50 p-4 rounded">
            <h4 className="font-bold mb-2 text-center">コラム</h4>
            <p className="text-sm font-newspaper leading-relaxed">
              {content.columnContent}
            </p>
          </div>
        )}
      </div>

      {/* 広告（無料会員のみ） */}
      {content.adContent && (
        <div className="advertisement mt-6 p-4 border-2 border-dashed border-gray-400 text-center">
          <p className="text-gray-500 text-sm">広告スペース</p>
          <p className="mt-2">{content.adContent}</p>
        </div>
      )}

      {/* フッター */}
      <footer className="newspaper-footer mt-8 pt-4 border-t border-gray-400 text-xs text-gray-600">
        <p className="text-center">{content.footer}</p>
      </footer>

      {/* プレビューモードのウォーターマーク */}
      {isPreview && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center z-50">
          <div className="text-gray-300 text-9xl font-bold opacity-20 transform rotate-45">
            PREVIEW
          </div>
        </div>
      )}
    </div>
  );
}