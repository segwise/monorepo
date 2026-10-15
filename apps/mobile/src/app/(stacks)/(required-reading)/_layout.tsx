import { Stack } from 'expo-router';
import { Header } from '@/containers/header';

function RequiredReadingLayout() {
	return (
		<Stack
			screenOptions={{
				title: 'Leitura Obrigatória',
				header: (props) => <Header {...props} titlePosition='center' />,
			}}
		>
			<Stack.Screen name='index' />
			<Stack.Screen name='[reading]' />
		</Stack>
	);
}

export default RequiredReadingLayout;
