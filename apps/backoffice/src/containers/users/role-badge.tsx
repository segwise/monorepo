import type { StaffRole } from '@segwise/core';
import { translateStaffRole } from '@segwise/core/translate';
import { Badge } from '@/components/ui/badge';

const VARIANT: Record<StaffRole, 'active' | 'success' | 'default'> = {
	owner: 'active',
	admin: 'active',
	manager: 'success',
	broker: 'default',
	finance: 'default',
	counter: 'default',
};

function UserRoleBadge({ role }: { role: StaffRole }) {
	return (
		<Badge variant={VARIANT[role]} className='px-2'>
			{translateStaffRole(role)}
		</Badge>
	);
}

export { UserRoleBadge };
