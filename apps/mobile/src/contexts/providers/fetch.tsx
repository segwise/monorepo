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

const queryClient = new QueryClient();

function FetchProvider({ children }: React.PropsWithChildren) {
	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister: clientPersister,
			}}
		>
			{children}
		</PersistQueryClientProvider>
	);
}

export { FetchProvider };
