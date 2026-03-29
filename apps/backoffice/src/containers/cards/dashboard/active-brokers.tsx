import { Building2Icon } from 'lucide-react';
import { CardHeaderHome } from '../header-home';

function CardActiveBrokers() {
	return (
		<CardHeaderHome
			icon={Building2Icon}
			title='Corretoras Ativas'
			value='0'
			percent={0}
		/>
	);
}

export { CardActiveBrokers };
