import { cn } from '@/components/lib/cn';

/* 로딩 자리표시자 — 연한 샌드색 박스가 은은하게 깜빡임.
   스타일 본체는 globals.css 의 .skeleton (색/애니메이션 한 곳에서만 관리)

   두 가지 쓰임:
   1) 데이터 로딩 중 카드 통째로   → <Skeleton className="h-[439px] w-[244px] rounded-[10px]" />
   2) 이미지 로딩 중 자리만        → 부모 div 에 skeleton 클래스를 직접 붙이면 next/image 가 위에 그려지면서 자연히 가려짐 */
export default function Skeleton({ className }: { className?: string }) {
    return <div className={cn('skeleton', className)} aria-hidden />;
}
