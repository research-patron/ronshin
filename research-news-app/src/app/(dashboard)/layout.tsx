'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Newspaper,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: Home },
  { name: '論文管理', href: '/dashboard/papers', icon: FileText },
  { name: '新聞作成', href: '/dashboard/newspapers', icon: Newspaper },
  { name: 'グループ管理', href: '/dashboard/groups', icon: Users },
  { name: 'アカウント設定', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, userData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h2 className="text-xl font-semibold">Research News</h2>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">{userData?.displayName}</p>
                <p className="text-xs text-gray-500">{userData?.email}</p>
                {userData?.membershipTier === 'premium' && (
                  <p className="flex items-center text-xs text-yellow-600 mt-1">
                    <Crown className="h-3 w-3 mr-1" />
                    プレミアム会員
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h2 className="text-xl font-semibold">Research News</h2>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">{userData?.displayName}</p>
                  <p className="text-xs text-gray-500">{userData?.email}</p>
                  {userData?.membershipTier === 'premium' && (
                    <p className="flex items-center text-xs text-yellow-600 mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      プレミアム会員
                    </p>
                  )}
                </div>
              </div>
              {userData?.membershipTier === 'free' && (
                <Link href="/dashboard/upgrade">
                  <Button variant="outline" size="sm" className="w-full mb-2">
                    <Crown className="h-4 w-4 mr-2" />
                    アップグレード
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 items-center bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900 ml-3 lg:ml-0">
              {navigation.find(item => item.href === pathname)?.name || 'ダッシュボード'}
            </h1>
            {userData?.membershipTier === 'free' && (
              <div className="text-sm text-gray-500">
                今月の生成回数: {userData.generatedCount}/3
              </div>
            )}
          </div>
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}