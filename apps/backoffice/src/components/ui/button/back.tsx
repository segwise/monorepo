'use client';

import { Slot } from '@radix-ui/react-slot';
import { useRouter } from 'next/navigation';

const ButtonBack = ({ children }: React.PropsWithChildren) => {
	const { back } = useRouter();

	return <Slot onClick={back}>{children}</Slot>;
};
ButtonBack.displayName = 'ButtonBack';

export { ButtonBack };
