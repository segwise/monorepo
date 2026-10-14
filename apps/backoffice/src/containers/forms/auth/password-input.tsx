'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';

// Campo de senha com botão de mostrar/ocultar (sem entrar na ordem do Tab).
function PasswordInput({
	showLabel = 'Mostrar senha',
	hideLabel = 'Ocultar senha',
	...props
}: React.ComponentProps<typeof InputGroupInput> & {
	showLabel?: string;
	hideLabel?: string;
}) {
	const [show, setShow] = useState<boolean>(false);

	return (
		<InputGroup>
			<InputGroupInput {...props} type={show ? 'text' : 'password'} />
			<InputGroupAddon align='inline-end'>
				<InputGroupButton
					size='icon-xs'
					aria-label={show ? hideLabel : showLabel}
					onClick={() => setShow((value) => !value)}
					tabIndex={-1}
				>
					{show ? <EyeOffIcon /> : <EyeIcon />}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}

export { PasswordInput };
