import { FileTextIcon } from 'lucide-react';
import { CardHeaderHome } from '../header-home';

function CardPendingQuotes() {
	return (
		<CardHeaderHome
			icon={FileTextIcon}
			title='Cotações Pendentes'
			value='0'
			percent={0}
		/>
	);
}

export { CardPendingQuotes };
