'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Newspaper } from '@/types';
import NewspaperViewer from '@/components/newspaper/NewspaperViewer';
import { Loader2 } from 'lucide-react';

export default function PrintNewspaperPage() {
  const params = useParams();
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewspaper();
  }, [params.id]);

  const fetchNewspaper = async () => {
    try {
      const newspaperDoc = await getDoc(doc(db, 'newspapers', params.id as string));
      if (newspaperDoc.exists()) {
        setNewspaper({ id: newspaperDoc.id, ...newspaperDoc.data() } as Newspaper);
      }
    } catch (error) {
      console.error('Error fetching newspaper:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && newspaper) {
      // Auto print after loading
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [loading, newspaper]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!newspaper) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">新聞が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="print-layout">
      <NewspaperViewer newspaper={newspaper} isPreview={false} />
      
      <style jsx global>{`
        @media print {
          @page {
            size: A3;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .print-layout {
            width: 297mm;
            height: 420mm;
            margin: 0;
            padding: 10mm;
          }
          
          /* Hide everything except the newspaper content */
          body > *:not(.print-layout) {
            display: none !important;
          }
          
          /* Optimize for print */
          .newspaper-container {
            font-size: 10pt;
          }
          
          .newspaper-headline {
            break-after: avoid;
          }
          
          .article-body {
            orphans: 3;
            widows: 3;
          }
          
          img {
            max-width: 100%;
            break-inside: avoid;
          }
        }
        
        @media screen {
          .print-layout {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </div>
  );
}