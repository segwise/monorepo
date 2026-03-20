import { useFetchSetup } from '@/libraries/hooks/useFetchSetup';
import { storage } from '@/libraries/storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import {
	type AsyncStorage,
	PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';

const clientStorage: AsyncStorage = {
	setItem: (key, value) => {
		storage.set(key, value);
	},
	getItem: (key) => {
		const value = storage.getString(key);
		return value === undefined ? null : value;
	},
	removeItem: (key) => {
		storage.remove(key);
	},
};

const clientPersister = createAsyncStoragePersister({
	storage: clientStorage,
});

function shouldDehydrateQuery(queryKey: string[]) {
	if (Array.isArray(queryKey)) {
		const firstPart = queryKey[0];

		if (['safes'].includes(firstPart as string)) {
			return true;
		}
	}

	return false;
}

const queryClient = new QueryClient();

function FetchProvider({ children }: React.PropsWithChildren) {
	useFetchSetup();

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister: clientPersister,
				dehydrateOptions: {
					shouldDehydrateQuery: (query) =>
						shouldDehydrateQuery(query.queryKey as string[]),
				},
			}}
		>
			{children}
		</PersistQueryClientProvider>
	);
}

export { FetchProvider };
