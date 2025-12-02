import { NuqsAdapter } from 'nuqs/adapters/next/app';

function QueryProvider({ children }: React.PropsWithChildren) {
	return <NuqsAdapter>{children}</NuqsAdapter>;
}

export { QueryProvider };
