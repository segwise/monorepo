import { Building2Icon } from 'lucide-react';
import { CardHeaderHome } from './header-home';

function CardLeadsCaptured() {
	return (
		<CardHeaderHome
			icon={Building2Icon}
			title='Leads Captados'
			value='0'
			percent={0}
		/>
	);
}

export { CardLeadsCaptured };
