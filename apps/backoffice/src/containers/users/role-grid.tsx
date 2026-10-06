import type { StaffRole } from '@segwise/core';
import { describeStaffRole, translateStaffRole } from '@segwise/core/translate';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/libraries/utils';

// Perfis em grade de cards com checkbox e descrição. A escolha é única: marcar
// um desmarca o outro, e o marcado não se desmarca (o perfil é obrigatório).
// Só mostra os perfis que o backend aceitaria para quem está logado.
function UserRoleGrid({
	value,
	onChange,
	options,
	invalid,
}: {
	value?: string;
	onChange: (value: StaffRole) => void;
	options: Array<StaffRole>;
	invalid?: boolean;
}) {
	return (
		<div
			role='radiogroup'
			aria-invalid={invalid}
			className='grid grid-cols-1 sm:grid-cols-2 gap-2'
		>
			{options.map((role) => {
				const checked = value === role;

				return (
					<label
						key={role}
						htmlFor={`role-${role}`}
						className={cn(
							'flex flex-row items-start gap-x-3 rounded-md border p-3 cursor-pointer transition-colors hover:bg-muted/50',
							checked && 'border-active bg-active/5',
							invalid && !checked && 'border-destructive/40',
						)}
					>
						<Checkbox
							id={`role-${role}`}
							checked={checked}
							className='mt-0.5'
							onCheckedChange={() => onChange(role)}
						/>
						<span className='flex flex-col'>
							<span className='text-sm font-medium leading-tight'>
								{translateStaffRole(role)}
							</span>
							<span className='text-xs text-muted-foreground font-normal leading-snug mt-0.5'>
								{describeStaffRole(role)}
							</span>
						</span>
					</label>
				);
			})}
		</div>
	);
}

export { UserRoleGrid };
