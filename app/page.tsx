import Image from 'next/image';

export default function Home() {
    return (
        <main>
            <p>비디오 테스트</p>
            <video className="w-full h-[400px]" controls preload="metadata">
                <source src="/videos/video-pc.mp4" media="(max-width: 768px)" type="video/mp4" />

                <source src="/videos/video-pc.mp4" type="video/mp4" />

                <p>브라우저가 비디오 태그를 지원하지 않습니다.</p>
            </video>
        </main>
    );
}
