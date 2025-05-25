import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              本利用規約（以下、「本規約」）は、Research News（以下、「当サービス」）の利用条件を定めるものです。
              ユーザーの皆様には、本規約に同意いただいた上で、当サービスをご利用いただきます。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第1条（適用）</h2>
            <p className="text-gray-600 mb-6">
              本規約は、ユーザーと当サービス運営者との間の当サービスの利用に関わる一切の関係に適用されるものとします。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第2条（利用登録）</h2>
            <ol className="list-decimal pl-6 mb-6 text-gray-600">
              <li className="mb-2">
                登録希望者が当サービスの定める方法によって利用登録を申請し、当サービスがこれを承認することによって、利用登録が完了するものとします。
              </li>
              <li className="mb-2">
                当サービスは、以下の場合には登録申請を承認しないことがあります：
                <ul className="list-disc pl-6 mt-2">
                  <li>虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当サービスが利用登録を相当でないと判断した場合</li>
                </ul>
              </li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第3条（アカウントの管理）</h2>
            <ol className="list-decimal pl-6 mb-6 text-gray-600">
              <li className="mb-2">
                ユーザーは、自己の責任において、当サービスのアカウント情報を適切に管理するものとします。
              </li>
              <li className="mb-2">
                ユーザーは、いかなる場合にも、アカウント情報を第三者に譲渡または貸与することはできません。
              </li>
              <li className="mb-2">
                アカウント情報の不正使用による損害の責任は、ユーザーが負うものとします。
              </li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第4条（利用料金）</h2>
            <ol className="list-decimal pl-6 mb-6 text-gray-600">
              <li className="mb-2">
                ユーザーは、当サービスの利用にあたり、別途定める利用料金を支払うものとします。
              </li>
              <li className="mb-2">
                プレミアムプランの料金は月額800円（税込）とし、自動更新されます。
              </li>
              <li className="mb-2">
                ユーザーが利用料金の支払を遅滞した場合、年14.6％の割合による遅延損害金を支払うものとします。
              </li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第5条（禁止事項）</h2>
            <p className="text-gray-600 mb-4">ユーザーは、以下の行為をしてはなりません：</p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>当サービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>当サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第6条（知的財産権）</h2>
            <ol className="list-decimal pl-6 mb-6 text-gray-600">
              <li className="mb-2">
                ユーザーがアップロードした論文の著作権は、ユーザーに帰属します。
              </li>
              <li className="mb-2">
                当サービスが生成した新聞形式のコンテンツの利用権は、ユーザーに帰属します。
              </li>
              <li className="mb-2">
                当サービスのシステム、デザイン、ロゴ等の知的財産権は、当サービス運営者に帰属します。
              </li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第7条（サービスの提供の停止等）</h2>
            <ol className="list-decimal pl-6 mb-6 text-gray-600">
              <li className="mb-2">
                当サービスは、以下の場合には、事前告知なくサービスの提供を停止または中断することができます：
                <ul className="list-disc pl-6 mt-2">
                  <li>サービスの保守点検を行う場合</li>
                  <li>不可抗力により、サービスの提供が困難となった場合</li>
                  <li>その他、当サービスが停止または中断を必要と判断した場合</li>
                </ul>
              </li>
              <li className="mb-2">
                前項の停止・中断により、ユーザーに生じた損害について、当サービスは責任を負いません。
              </li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第8条（免責事項）</h2>
            <ol className="list-decimal pl-6 mb-6 text-gray-600">
              <li className="mb-2">
                当サービスは、AIによる論文解析の正確性を保証するものではありません。
              </li>
              <li className="mb-2">
                当サービスは、ユーザーに発生した損害について、一切の責任を負いません。
              </li>
              <li className="mb-2">
                当サービスは、ユーザー間のトラブルについて、一切の責任を負いません。
              </li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第9条（サービス内容の変更等）</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、ユーザーに通知することなく、サービスの内容を変更または提供を中止することができるものとし、
              これによってユーザーに生じた損害について一切の責任を負いません。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第10条（利用規約の変更）</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。
              変更後の利用規約は、当サービス内に掲示した時点から効力を生じるものとします。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第11条（個人情報の取扱い）</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、ユーザーの個人情報を別途定める「プライバシーポリシー」に従い、適切に取り扱うものとします。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第12条（準拠法・管轄裁判所）</h2>
            <ol className="list-decimal pl-6 mb-6 text-gray-600">
              <li className="mb-2">
                本規約の解釈にあたっては、日本法を準拠法とします。
              </li>
              <li className="mb-2">
                当サービスに関して紛争が生じた場合には、東京地方裁判所を専属的合意管轄とします。
              </li>
            </ol>

            <p className="text-gray-500 text-sm mt-8">
              制定日: 2024年1月1日
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}