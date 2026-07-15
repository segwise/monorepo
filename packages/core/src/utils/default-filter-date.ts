import { endOfToday, startOfMonth, startOfToday } from 'date-fns';

const defaultFilterDate = {
	start: startOfMonth(startOfToday()),
	end: endOfToday(),
};

export { defaultFilterDate };
