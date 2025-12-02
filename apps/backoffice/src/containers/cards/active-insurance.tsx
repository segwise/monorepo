import { Building2Icon } from 'lucide-react';
import { CardHeaderHome } from './header-home';

function CardActiveInsurance() {
	return (
		<CardHeaderHome
			icon={Building2Icon}
			title='Seguros Ativos'
			value='0'
			percent={0}
		/>
	);
}

export { CardActiveInsurance };
