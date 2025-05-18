/**
 * エラー処理のためのユーティリティ関数
 */

/**
 * 様々なタイプのエラーからエラーメッセージを取得する
 * @param error - 処理するエラーオブジェクト
 * @returns エラーメッセージ文字列
 */
export function getErrorMessage(error: unknown): string {
  // Errorオブジェクト
  if (error instanceof Error) {
    return error.message;
  }
  
  // Firebaseエラー
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return `${(error as { code: string; message: string }).message} (${(error as { code: string; message: string }).code})`;
  }
  
  // 文字列の場合
  if (typeof error === 'string') {
    return error;
  }
  
  // Promiseリジェクション
  if (typeof error === 'object' && error !== null && 'reason' in error) {
    return getErrorMessage((error as { reason: unknown }).reason);
  }
  
  // それ以外
  return '不明なエラーが発生しました';
}

/**
 * Firebase認証エラーから日本語のメッセージを取得する
 * @param errorCode - Firebaseのエラーコード
 * @returns 日本語のエラーメッセージ
 */
export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています';
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません';
    case 'auth/user-disabled':
      return 'このユーザーアカウントは無効になっています';
    case 'auth/user-not-found':
      return 'メールアドレスまたはパスワードが正しくありません';
    case 'auth/wrong-password':
      return 'メールアドレスまたはパスワードが正しくありません';
    case 'auth/weak-password':
      return 'パスワードは6文字以上である必要があります';
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください';
    case 'auth/too-many-requests':
      return 'アクセスが一時的にブロックされました。しばらく時間をおいて再試行してください';
    case 'auth/requires-recent-login':
      return 'この操作を行うには再度ログインが必要です';
    case 'auth/popup-closed-by-user':
      return '認証ポップアップが閉じられました。もう一度お試しください';
    case 'auth/cancelled-popup-request':
      return '認証リクエストがキャンセルされました';
    default:
      return `認証エラーが発生しました: ${errorCode}`;
  }
}

/**
 * Firestore操作のエラーメッセージを取得する
 * @param errorCode - Firestoreのエラーコード
 * @returns 日本語のエラーメッセージ
 */
export function getFirestoreErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'permission-denied':
      return 'この操作を実行する権限がありません';
    case 'not-found':
      return '指定されたドキュメントが見つかりません';
    case 'already-exists':
      return '指定されたドキュメントは既に存在します';
    case 'resource-exhausted':
      return 'リソースの制限に達しました。しばらく時間をおいて再試行してください';
    case 'failed-precondition':
      return '前提条件が満たされていないため、操作を実行できません';
    case 'aborted':
      return '操作が中断されました。もう一度お試しください';
    case 'out-of-range':
      return '操作が範囲外です';
    case 'unimplemented':
      return 'この機能は実装されていません';
    case 'internal':
      return '内部エラーが発生しました';
    case 'unavailable':
      return 'サービスが一時的に利用できません。しばらく時間をおいて再試行してください';
    case 'data-loss':
      return 'データ損失エラーが発生しました';
    case 'unauthenticated':
      return '認証されていません。再度ログインしてください';
    default:
      return `データベースエラーが発生しました: ${errorCode}`;
  }
}