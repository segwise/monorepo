import { Users2Icon } from 'lucide-react';
import { CardHeaderHome } from '../header-home';

function CardLeadsCaptured() {
	return (
		<CardHeaderHome
			isPending={false}
			icon={Users2Icon}
			title='Leads Captados'
			value='0'
			percent={0}
			before='0'
			type='year'
			setType={() => {}}
		/>
	);
}

export { CardLeadsCaptured };
