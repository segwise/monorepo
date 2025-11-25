import { ProviderFetch } from './fetch';

function Providers({ children }: React.PropsWithChildren) {
	return <ProviderFetch>{children}</ProviderFetch>;
}

export { Providers };
