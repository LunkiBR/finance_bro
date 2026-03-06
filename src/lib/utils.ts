const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Returns current month in app format: 'mar/26' */
export function getCurrentMonth(): string {
    const now = new Date();
    const y = String(now.getFullYear()).slice(2);
    return `${PT_MONTHS[now.getMonth()]}/${y}`;
}

/** Returns the previous month: 'fev/26' → 'jan/26', 'jan/26' → 'dez/25' */
export function getPrevMonth(month: string): string {
    const [m, y] = month.split('/');
    const mIdx = PT_MONTHS.indexOf(m);
    if (mIdx === 0) {
        return `dez/${String(parseInt(y) - 1).padStart(2, '0')}`;
    }
    return `${PT_MONTHS[mIdx - 1]}/${y}`;
}

/** Returns N months back from a given month */
export function getNMonthsBack(month: string, n: number): string {
    let result = month;
    for (let i = 0; i < n; i++) result = getPrevMonth(result);
    return result;
}

/**
 * Calculates percentage delta between current and previous values.
 * Returns undefined if prev is zero (no division by zero).
 */
export function calcDelta(current: number, prev: number): number | undefined {
    if (!prev || prev === 0) return undefined;
    return Math.round(((current - prev) / prev) * 100);
}

/** Converts month string to sortable number: 'jan/26' → 2601, 'dez/25' → 2512 */
export function monthToNum(month: string): number {
    const [m, y] = month.split('/');
    const mIdx = PT_MONTHS.indexOf(m) + 1;
    return parseInt(y) * 100 + mIdx;
}

/** Formats number as Brazilian currency string (without R$): '1.234,56' */
export function formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
