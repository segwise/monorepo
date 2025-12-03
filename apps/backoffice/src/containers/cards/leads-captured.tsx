import { Users2Icon } from 'lucide-react';
import { CardHeaderHome } from './header-home';

function CardLeadsCaptured() {
	return (
		<CardHeaderHome
			icon={Users2Icon}
			title='Leads Captados'
			value='0'
			percent={0}
		/>
	);
}

export { CardLeadsCaptured };
