'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { categoryLabel, treatments } from '@/components/lib/treatments';
import {
    createReservation,
    deleteReservation,
    RESERVATION_STATUSES,
    subscribeReservations,
    updateReservation,
    updateReservationStatus,
    type ReservationInput,
    type ReservationItem,
    type ReservationStatus,
} from '@/components/lib/reservations';
import { getReservationTimeSlots, isReservationTimeValid } from '@/components/lib/reservationSchedule';

const STATUS_LABELS: Record<ReservationStatus, string> = {
    pending: '접수',
    confirmed: '확정',
    completed: '완료',
    cancelled: '취소',
};

const STATUS_CLASSES: Record<ReservationStatus, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-50 text-red-600',
};

const inputClass =
    'block w-full min-w-0 rounded-xl border border-cocoa/15 bg-white px-3.5 py-2.5 text-small text-cocoa outline-none placeholder:text-latte/50 focus:border-cocoa/40 disabled:cursor-not-allowed disabled:bg-cocoa/[0.03]';
const labelClass = 'mb-1.5 block text-caption font-semibold text-cocoa';
const PAGE_SIZE = 20;

export default function ReservationManager() {
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | ReservationStatus>('all');
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ReservationItem | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(
        () =>
            subscribeReservations(
                (items) => {
                    setReservations(items);
                    setLoading(false);
                },
                (subscriptionError) => {
                    setError(subscriptionError.message || '예약 목록을 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [],
    );

    const visibleReservations = useMemo(
        () => (filter === 'all' ? reservations : reservations.filter((item) => item.status === filter)),
        [filter, reservations],
    );
    const totalPages = Math.max(1, Math.ceil(visibleReservations.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginatedReservations = visibleReservations.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );
    const counts = useMemo(
        () =>
            RESERVATION_STATUSES.reduce<Record<ReservationStatus, number>>(
                (result, status) => {
                    result[status] = reservations.filter((item) => item.status === status).length;
                    return result;
                },
                { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
            ),
        [reservations],
    );

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
    };

    const saveReservation = async (input: ReservationInput) => {
        setBusy(true);
        setError(null);
        try {
            if (editing) {
                await updateReservation(editing.docId, input);
            } else {
                await createReservation(input);
            }
            closeForm();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '예약 저장에 실패했습니다.');
        } finally {
            setBusy(false);
        }
    };

    const changeStatus = async (item: ReservationItem, status: ReservationStatus) => {
        if (item.status === status) return;
        setBusy(true);
        setError(null);
        try {
            await updateReservationStatus(item.docId, status);
        } catch (statusError) {
            setError(statusError instanceof Error ? statusError.message : '예약 상태 변경에 실패했습니다.');
        } finally {
            setBusy(false);
        }
    };

    const removeReservation = async (item: ReservationItem) => {
        if (!window.confirm(`${item.name}님의 예약을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
        setBusy(true);
        setError(null);
        try {
            await deleteReservation(item.docId);
            if (editing?.docId === item.docId) closeForm();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : '예약 삭제에 실패했습니다.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-h2 font-bold text-cocoa">예약 관리</h1>
                    <p className="mt-1 text-small text-latte">홈페이지와 전화로 접수된 예약을 확인하고 관리합니다.</p>
                </div>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                        setEditing(null);
                        setShowForm((current) => !current);
                    }}
                    className="rounded-full bg-cocoa px-5 py-2.5 text-small font-semibold text-cream hover:bg-deep disabled:opacity-40"
                >
                    {showForm ? '등록 취소' : '+ 예약 직접 등록'}
                </button>
            </div>

            {error ? (
                <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-caption text-red-700">
                    {error}
                </div>
            ) : null}

            {showForm || editing ? (
                <ReservationForm
                    key={editing?.docId ?? 'new'}
                    initial={editing ?? undefined}
                    saving={busy}
                    onSave={saveReservation}
                    onCancel={closeForm}
                />
            ) : null}

            <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lead font-bold text-cocoa">예약 신청 목록</h2>
                        <p className="mt-1 text-caption text-latte">상태를 선택하면 목록에 즉시 반영됩니다.</p>
                    </div>
                    <span className="rounded-full bg-[#F5F2EC] px-3 py-1 text-caption font-semibold text-latte">
                        총 {reservations.length}건
                    </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <FilterButton
                        active={filter === 'all'}
                        label={`전체 ${reservations.length}`}
                        onClick={() => {
                            setFilter('all');
                            setPage(1);
                        }}
                    />
                    {RESERVATION_STATUSES.map((status) => (
                        <FilterButton
                            key={status}
                            active={filter === status}
                            label={`${STATUS_LABELS[status]} ${counts[status]}`}
                            onClick={() => {
                                setFilter(status);
                                setPage(1);
                            }}
                        />
                    ))}
                </div>
            </section>

            {loading ? (
                <EmptyState message="예약 목록을 불러오는 중입니다." />
            ) : visibleReservations.length === 0 ? (
                <EmptyState message={filter === 'all' ? '접수된 예약이 없습니다.' : '해당 상태의 예약이 없습니다.'} />
            ) : (
                <div className="mt-5">
                    <div className="flex flex-col gap-2">
                    {paginatedReservations.map((item) => (
                        <article
                            key={item.docId}
                            className="rounded-xl bg-white px-4 py-3.5 shadow-[0_1px_8px_rgba(69,54,45,0.05)]"
                        >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-caption-sm font-semibold ${STATUS_CLASSES[item.status]}`}
                                        >
                                            {STATUS_LABELS[item.status]}
                                        </span>
                                        <strong className="text-small text-cocoa">
                                            {item.reservationDate || '날짜 없음'} {item.reservationTime}
                                        </strong>
                                        <span className="text-caption font-semibold text-cocoa">{item.name || '이름 없음'}</span>
                                        <a href={`tel:${item.phone.replace(/\D/g, '')}`} className="text-caption text-latte underline">
                                            {item.phone || '연락처 없음'}
                                        </a>
                                    </div>
                                    <p className="clamp-1 mt-1.5 text-caption text-latte">
                                        <span className="font-semibold text-cocoa">
                                            {item.treatmentName || '시술 미선택'}
                                        </span>
                                        {item.email ? ` · ${item.email}` : ''}
                                        {item.memo ? ` · ${item.memo}` : ''}
                                    </p>
                                    {item.selectedPriceItems.length > 0 ? (
                                        <div className="mt-2 rounded-lg bg-[#F8F5EF] px-3 py-2 text-caption text-latte">
                                            <span className="font-semibold text-cocoa">견적 선택: </span>
                                            {item.selectedPriceItems
                                                .map(
                                                    (selected) =>
                                                        `${selected.itemName} (${selected.optionLabel}) × ${selected.quantity}`,
                                                )
                                                .join(' · ')}
                                            <strong className="ml-2 text-cocoa">
                                                예상 {item.estimatedTotal.toLocaleString('ko-KR')}원
                                            </strong>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                    <select
                                        value={item.status}
                                        disabled={busy}
                                        aria-label={`${item.name} 예약 상태`}
                                        onChange={(event) =>
                                            void changeStatus(item, event.target.value as ReservationStatus)
                                        }
                                        className="rounded-lg border border-cocoa/15 bg-white px-2.5 py-1.5 text-caption font-semibold text-cocoa outline-none"
                                    >
                                        {RESERVATION_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {STATUS_LABELS[status]}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditing(item);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="rounded-lg border border-cocoa/20 px-2.5 py-1.5 text-caption font-semibold text-cocoa hover:bg-cocoa/5 disabled:opacity-40"
                                    >
                                        수정
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void removeReservation(item)}
                                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-caption font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                    </div>

                    {totalPages > 1 ? (
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setPage(Math.max(1, currentPage - 1))}
                                className="rounded-lg border border-cocoa/15 px-3 py-1.5 text-caption font-semibold text-cocoa hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                이전
                            </button>
                            <span className="text-caption font-semibold text-latte">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                className="rounded-lg border border-cocoa/15 px-3 py-1.5 text-caption font-semibold text-cocoa hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                다음
                            </button>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function ReservationForm({
    initial,
    saving,
    onSave,
    onCancel,
}: {
    initial?: ReservationItem;
    saving: boolean;
    onSave: (input: ReservationInput) => Promise<void>;
    onCancel: () => void;
}) {
    const initialTreatmentValue =
        initial?.treatmentCategory && initial.treatmentSlug
            ? `${initial.treatmentCategory}/${initial.treatmentSlug}`
            : '';
    const [treatmentValue, setTreatmentValue] = useState(initialTreatmentValue);
    const [name, setName] = useState(initial?.name ?? '');
    const [phone, setPhone] = useState(initial?.phone ?? '');
    const [email, setEmail] = useState(initial?.email ?? '');
    const [reservationDate, setReservationDate] = useState(initial?.reservationDate ?? '');
    const [reservationTime, setReservationTime] = useState(initial?.reservationTime ?? '');
    const [memo, setMemo] = useState(initial?.memo ?? '');
    const [status, setStatus] = useState<ReservationStatus>(initial?.status ?? 'pending');
    const availableTimes = getReservationTimeSlots(reservationDate);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const [treatmentCategory, treatmentSlug] = treatmentValue.split('/');
        const treatment = treatments.find(
            (item) => item.category === treatmentCategory && item.slug === treatmentSlug,
        );
        if (!isReservationTimeValid(reservationDate, reservationTime)) return;

        void onSave({
            treatmentCategory: treatment?.category ?? '',
            treatmentSlug: treatment?.slug ?? '',
            treatmentName: treatment?.name ?? '',
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            reservationDate,
            reservationTime,
            memo: memo.trim(),
            status,
            selectedPriceItems: initial?.selectedPriceItems ?? [],
            estimatedTotal: initial?.estimatedTotal ?? 0,
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7"
        >
            <h2 className="text-lead font-bold text-cocoa">{initial ? '예약 수정' : '예약 직접 등록'}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                    <span className={labelClass}>시술</span>
                    <select
                        value={treatmentValue}
                        disabled={saving}
                        onChange={(event) => setTreatmentValue(event.target.value)}
                        className={inputClass}
                    >
                        <option value="">
                            시술 미선택 (상담 후 결정)
                        </option>
                        {treatments.map((item) => (
                            <option key={`${item.category}-${item.slug}`} value={`${item.category}/${item.slug}`}>
                                {categoryLabel[item.category]} · {item.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className={labelClass}>이름 *</span>
                    <input
                        required
                        value={name}
                        disabled={saving}
                        onChange={(event) => setName(event.target.value)}
                        className={inputClass}
                    />
                </label>
                <label>
                    <span className={labelClass}>연락처 *</span>
                    <input
                        required
                        type="tel"
                        value={phone}
                        disabled={saving}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="010-0000-0000"
                        className={inputClass}
                    />
                </label>
                <label className="sm:col-span-2">
                    <span className={labelClass}>이메일</span>
                    <input
                        type="email"
                        value={email}
                        disabled={saving}
                        onChange={(event) => setEmail(event.target.value)}
                        className={inputClass}
                    />
                </label>
                <label>
                    <span className={labelClass}>예약일 *</span>
                    <input
                        required
                        type="date"
                        value={reservationDate}
                        disabled={saving}
                        onChange={(event) => {
                            setReservationDate(event.target.value);
                            setReservationTime('');
                        }}
                        className={inputClass}
                    />
                </label>
                <label>
                    <span className={labelClass}>예약 시간 *</span>
                    <select
                        required
                        value={reservationTime}
                        disabled={saving}
                        onChange={(event) => setReservationTime(event.target.value)}
                        className={inputClass}
                    >
                        <option value="" disabled>
                            {reservationDate ? '예약 시간을 선택하세요' : '예약일을 먼저 선택하세요'}
                        </option>
                        {availableTimes.map((time) => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className={labelClass}>상태</span>
                    <select
                        value={status}
                        disabled={saving}
                        onChange={(event) => setStatus(event.target.value as ReservationStatus)}
                        className={inputClass}
                    >
                        {RESERVATION_STATUSES.map((reservationStatus) => (
                            <option key={reservationStatus} value={reservationStatus}>
                                {STATUS_LABELS[reservationStatus]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="sm:col-span-2">
                    <span className={labelClass}>메모</span>
                    <textarea
                        rows={4}
                        value={memo}
                        disabled={saving}
                        onChange={(event) => setMemo(event.target.value)}
                        className={`${inputClass} resize-y`}
                    />
                </label>
            </div>
            <div className="mt-6 flex gap-2 border-t border-cocoa/10 pt-5">
                <button
                    type="submit"
                    disabled={
                        saving ||
                        !name.trim() ||
                        !phone.trim() ||
                        !reservationDate ||
                        !reservationTime
                    }
                    className="rounded-xl bg-cocoa px-5 py-2.5 text-small font-semibold text-cream hover:bg-deep disabled:opacity-40"
                >
                    {saving ? '저장 중…' : initial ? '수정 완료' : '예약 등록'}
                </button>
                <button
                    type="button"
                    disabled={saving}
                    onClick={onCancel}
                    className="rounded-xl border border-cocoa/20 px-5 py-2.5 text-small font-semibold text-cocoa hover:bg-cocoa/5 disabled:opacity-40"
                >
                    취소
                </button>
            </div>
        </form>
    );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-3.5 py-1.5 text-caption font-semibold transition-colors ${
                active ? 'bg-cocoa text-cream' : 'bg-[#F5F2EC] text-latte hover:text-cocoa'
            }`}
        >
            {label}
        </button>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="mt-5 rounded-2xl border border-dashed border-cocoa/15 bg-white px-6 py-20 text-center text-small text-latte">
            {message}
        </div>
    );
}
