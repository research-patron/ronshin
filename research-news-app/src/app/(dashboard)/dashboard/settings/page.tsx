'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { 
  User, 
  Mail, 
  Key, 
  Bell, 
  Palette,
  CreditCard,
  Save,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const { userData, currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [notifications, setNotifications] = useState<boolean>(userData?.settings?.notifications ?? true);
  const [theme, setTheme] = useState<string>(userData?.settings?.theme || 'system');
  const [message, setMessage] = useState('');

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setMessage('');
      await updateUserProfile(displayName);
      setMessage('プロフィールを更新しました');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">アカウント設定</h1>

        {message && (
          <div className={`mb-4 p-4 rounded-md ${message.includes('失敗') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">プロフィール</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">表示名</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Key className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">セキュリティ</h2>
            </div>
            <div className="space-y-4">
              <Button variant="outline">
                パスワードを変更
              </Button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">通知設定</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  メール通知を受け取る
                </span>
              </label>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Palette className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">表示設定</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">テーマ</Label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="system">システム設定に従う</option>
                  <option value="light">ライトモード</option>
                  <option value="dark">ダークモード</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">サブスクリプション</h2>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-700">
                <p>現在のプラン: <span className="font-medium">{userData?.membershipTier === 'premium' ? 'プレミアム' : 'フリー'}</span></p>
                {userData?.membershipTier === 'free' && (
                  <p className="mt-2">今月の生成回数: {userData.generatedCount}/3</p>
                )}
              </div>
              {userData?.membershipTier === 'free' && (
                <Button variant="outline">
                  プレミアムにアップグレード
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}