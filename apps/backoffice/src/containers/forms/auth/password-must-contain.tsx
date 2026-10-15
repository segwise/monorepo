'use client';

import {
	SchemaPasswordIncludeNumber,
	SchemaPasswordIncludeSpecial,
	SchemaPasswordIncludeUppercase,
	SchemaPasswordLengthMin,
} from '@segwise/core/schemas';
import { CheckCircleIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils';

// Checklist de requisitos da senha nova: cada item fica verde quando atendido.
function PasswordMustContain({
	value,
	className,
}: {
	value: string;
	className?: string;
}) {
	const rules = [
		{
			label: 'Mínimo de 8 caracteres',
			ok: SchemaPasswordLengthMin.safeParse(value).success,
		},
		{
			label: 'Pelo menos uma letra maiúscula',
			ok: SchemaPasswordIncludeUppercase.safeParse(value).success,
		},
		{
			label: 'Pelo menos um número',
			ok: SchemaPasswordIncludeNumber.safeParse(value).success,
		},
		{
			label: 'Pelo menos um caractere especial',
			ok: SchemaPasswordIncludeSpecial.safeParse(value).success,
		},
	];

	return (
		<div className={cn('space-y-2', className)}>
			<Label className='mb-3'>Sua senha deve conter:</Label>
			<ul className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
				{rules.map((rule) => (
					<li
						key={rule.label}
						data-ok={rule.ok}
						className={cn(
							'flex items-center gap-1 text-xs text-muted-foreground',
							rule.ok && '[&_svg]:text-green-600 text-foreground',
						)}
					>
						<CheckCircleIcon className='size-3' />
						{rule.label}
					</li>
				))}
			</ul>
		</div>
	);
}

export { PasswordMustContain };
