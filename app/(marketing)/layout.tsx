import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingButtons from '@/components/layout/FloatingButtons';
import JsonLd from '@/components/seo/JsonLd';
import { siteGraph } from '@/components/lib/jsonLd';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd data={siteGraph()} />
            <Header />
            <main>{children}</main>
            <Footer />
            <FloatingButtons />
        </>
    );
}
