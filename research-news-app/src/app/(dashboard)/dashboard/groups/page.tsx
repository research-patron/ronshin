'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Plus, Users, Settings, Trash2 } from 'lucide-react';

export default function GroupsPage() {
  const { userData } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder - will be implemented when groups functionality is added
    setLoading(false);
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">グループ管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            研究グループを作成して、論文や新聞を共有できます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規グループ作成
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-gray-900">
            読み込み中...
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">グループがありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            新規グループを作成して、メンバーと研究を共有しましょう
          </p>
          <div className="mt-6">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              最初のグループを作成
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Group cards will be rendered here */}
        </div>
      )}
    </div>
  );
}