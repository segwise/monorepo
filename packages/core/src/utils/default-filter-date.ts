import { endOfMonth, startOfToday } from 'date-fns';

const defaultFilterDate = {
	start: startOfToday(),
	end: endOfMonth(startOfToday()),
};

export { defaultFilterDate };
