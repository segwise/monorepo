import { ShieldUserIcon } from 'lucide-react';
import { CardHeaderHome } from '../header-home';

function CardActiveInsurance() {
	return (
		<CardHeaderHome
			icon={ShieldUserIcon}
			title='Seguros Ativos'
			value='0'
			percent={0}
		/>
	);
}

export { CardActiveInsurance };
