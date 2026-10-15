import { FetchProvider } from './fetch';

function Providers({ children }: React.PropsWithChildren) {
	return <FetchProvider>{children}</FetchProvider>;
}

export { Providers };
