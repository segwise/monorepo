import { Building2Icon } from 'lucide-react';
import { CardHeaderHome } from './header-home';

function CardPendingQuotes() {
	return (
		<CardHeaderHome
			icon={Building2Icon}
			title='Cotações Pendentes'
			value='0'
			percent={0}
		/>
	);
}

export { CardPendingQuotes };
