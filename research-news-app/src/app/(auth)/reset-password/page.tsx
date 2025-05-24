'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, ArrowLeft } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    try {
      setError('');
      setLoading(true);
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/user-not-found') {
          setError('このメールアドレスのユーザーは存在しません');
        } else if (errorCode === 'auth/invalid-email') {
          setError('メールアドレスが無効です');
        } else {
          setError('パスワードリセットメールの送信に失敗しました');
        }
      } else {
        setError('パスワードリセットメールの送信に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワードをリセット
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">
              パスワードリセットメールを送信しました。メールをご確認ください。
            </div>
            <div className="mt-4">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  ログインページに戻る
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                {...register('email')}
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  'リセットメールを送信'
                )}
              </Button>

              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  ログインに戻る
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}