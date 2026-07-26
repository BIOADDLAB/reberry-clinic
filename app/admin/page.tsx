// #LINK: /app/admin/page.tsx
// #ISSUE: 로그인 화면(=/admin 자체). 아이디는 형식상 필드, 실제 검증은 actions.ts 에서
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginAdmin } from './actions';
import { ADMIN_COOKIE_NAME, getAdminAuthToken } from './auth';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;
    const cookieStore = await cookies();
    const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === getAdminAuthToken();

    if (isAuthed) redirect('/admin/ba');

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F2EC] px-6">
            <div className="w-full max-w-sm rounded-2xl bg-white p-10 shadow-[0_2px_24px_rgba(69,54,45,0.08)]">
                <p className="font-display text-caption tracking-[0.2em] text-latte">RE:BERRY</p>
                <h1 className="mt-1 text-h2 font-bold text-cocoa">관리자 로그인</h1>

                <form action={loginAdmin} className="mt-8 flex flex-col gap-3">
                    <input
                        type="text"
                        name="id"
                        placeholder="아이디"
                        className="rounded-lg border border-cocoa/15 px-4 py-3 text-medium outline-none focus:border-cocoa/40"
                        required
                        autoFocus
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="비밀번호"
                        className="rounded-lg border border-cocoa/15 px-4 py-3 text-medium outline-none focus:border-cocoa/40"
                        required
                    />
                    {error && <p className="text-small text-red-500">아이디 또는 비밀번호가 올바르지 않습니다.</p>}
                    <button
                        type="submit"
                        className="mt-3 rounded-lg bg-cocoa py-3 text-medium font-semibold text-cream transition-colors hover:bg-deep"
                    >
                        로그인
                    </button>
                </form>
            </div>
        </div>
    );
}
