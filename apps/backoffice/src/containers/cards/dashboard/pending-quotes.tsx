import { FileTextIcon } from 'lucide-react';
import { CardHeaderHome } from '../header-home';

function CardPendingQuotes() {
	return (
		<CardHeaderHome
			isPending={false}
			icon={FileTextIcon}
			title='Cotações Pendentes'
			value='0'
			percent={0}
			before='0'
			type='year'
			setType={() => {}}
		/>
	);
}

export { CardPendingQuotes };
