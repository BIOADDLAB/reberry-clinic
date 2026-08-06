const createTimeSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
    const slots: string[] = [];
    let minutes = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    while (minutes <= end) {
        slots.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
        minutes += 30;
    }
    return slots;
};

// 평일 10:30~20:30, 접수 마감 20:00. 휴게시간 14:00~15:00은 제외.
const WEEKDAY_SLOTS = createTimeSlots(10, 30, 20, 0).filter((time) => time !== '14:00' && time !== '14:30');

// 토요일 09:00~15:30, 접수 마감 15:00.
const SATURDAY_SLOTS = createTimeSlots(9, 0, 15, 0);

export function getReservationTimeSlots(dateKey: string): string[] {
    if (!dateKey) return [];
    const date = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime()) || date.getDay() === 0) return [];
    return date.getDay() === 6 ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
}

export function isReservationTimeValid(dateKey: string, time: string): boolean {
    return getReservationTimeSlots(dateKey).includes(time);
}
