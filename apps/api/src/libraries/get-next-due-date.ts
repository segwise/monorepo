import {
	addMonths,
	addYears,
	getDate,
	getMonth,
	getYear,
	lastDayOfMonth,
} from 'date-fns';

function getNextDueDate(startDate: Date, referenceDate?: Date): Date {
	const billingDay = getDate(startDate);

	const nextMonth = addMonths(referenceDate ?? startDate, 1);
	const lastDay = getDate(lastDayOfMonth(nextMonth));

	const clampedDay = Math.min(billingDay, lastDay);

	return new Date(getYear(nextMonth), getMonth(nextMonth), clampedDay);
}

function getNextDueDateYearly(startDate: Date, referenceDate?: Date): Date {
	const billingDay = getDate(startDate);
	const billingMonth = getMonth(startDate);

	const nextYear = getYear(addYears(referenceDate ?? startDate, 1));
	const lastDay = getDate(lastDayOfMonth(new Date(nextYear, billingMonth)));

	const clampedDay = Math.min(billingDay, lastDay);

	return new Date(nextYear, billingMonth, clampedDay);
}

export { getNextDueDate, getNextDueDateYearly };
