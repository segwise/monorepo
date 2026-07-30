import { addYears, endOfMonth, startOfToday } from 'date-fns';

const defaultFilterDate = {
	start: addYears(startOfToday(), 1),
	end: endOfMonth(addYears(startOfToday(), 1)),
};

export { defaultFilterDate };
