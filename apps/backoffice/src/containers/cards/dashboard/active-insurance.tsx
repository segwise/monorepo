import { ShieldUserIcon } from 'lucide-react';
import { CardHeaderHome } from '../header-home';

function CardActiveInsurance() {
	return (
		<CardHeaderHome
			isPending={false}
			icon={ShieldUserIcon}
			title='Seguros Ativos'
			value='0'
			percent={0}
			before='0'
			type='year'
			setType={() => {}}
		/>
	);
}

export { CardActiveInsurance };
