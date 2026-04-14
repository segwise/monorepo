import { createMMKV, useMMKVBoolean, useMMKVString } from 'react-native-mmkv';

const storage = createMMKV();

const useStorageString = (name: string) => useMMKVString(name);
const useStorageBoolean = (name: string) => useMMKVBoolean(name);

export { storage, useStorageBoolean, useStorageString };
