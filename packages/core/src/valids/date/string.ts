import { format, isValid, parse } from 'date-fns';

function isDateString(value: string) {
	if (!value || value.length !== 10) {
		return false;
	}

	const parsedDate = parse(value, 'dd/MM/yyyy', new Date());

	if (!isValid(parsedDate)) {
		return false;
	}

	return format(parsedDate, 'dd/MM/yyyy') === value;
}

export { isDateString };
