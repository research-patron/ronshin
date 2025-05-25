'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowLeft, Send } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 実際の実装では、ここでバックエンドAPIを呼び出します
    // 現在はシミュレーションのみ
    setTimeout(() => {
      setSubmitMessage('お問い合わせを受け付けました。担当者より2営業日以内にご連絡いたします。');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ホームに戻る
            </Button>
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg px-6 py-8 sm:px-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">お問い合わせ</h1>
          
          <div className="mb-8">
            <p className="text-gray-600">
              Research Newsへのご質問、ご要望、不具合のご報告などをお受けしております。
              下記のフォームに必要事項をご記入の上、送信してください。
            </p>
          </div>

          {submitMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{submitMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">お名前 *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="subject">件名 *</Label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">選択してください</option>
                <option value="general">一般的なお問い合わせ</option>
                <option value="technical">技術的なサポート</option>
                <option value="billing">料金・支払いについて</option>
                <option value="feature">機能のご要望</option>
                <option value="bug">不具合のご報告</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <Label htmlFor="message">お問い合わせ内容 *</Label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                value={formData.message}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? '送信中...' : (
                  <>
                    送信する
                    <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">その他のお問い合わせ方法</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <p className="font-medium">メールでのお問い合わせ</p>
                <p>support@research-news.com</p>
              </div>
              <div>
                <p className="font-medium">営業時間</p>
                <p>平日 9:00 - 18:00（土日祝日を除く）</p>
              </div>
              <div>
                <p className="font-medium">返信について</p>
                <p>お問い合わせいただいた内容は、2営業日以内に返信いたします。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}