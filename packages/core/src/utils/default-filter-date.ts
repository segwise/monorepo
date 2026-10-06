import { endOfMonth, endOfToday, startOfToday } from 'date-fns';

// Valor calculado UMA vez, na carga do módulo: serve para exibir o filtro padrão
// no front (a página recarrega). Em processo de longa duração (backend) use
// `getDefaultFilterDate()`, senão o "hoje/mês atual" fica congelado na data em
// que o servidor subiu.
const defaultFilterDate = {
	start: startOfToday(),
	end: endOfMonth(endOfToday()),
};

const getDefaultFilterDate = () => ({
	start: startOfToday(),
	end: endOfMonth(endOfToday()),
});

export { defaultFilterDate, getDefaultFilterDate };
