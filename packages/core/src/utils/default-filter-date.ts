import { endOfMonth, endOfToday, startOfToday } from 'date-fns';

const defaultFilterDate = {
	start: startOfToday(),
	end: endOfMonth(endOfToday()),
};

export { defaultFilterDate };
