import { Header } from '@/containers/header';
import { Stack } from 'expo-router';

function RequestQuoteLayout() {
	return (
		<Stack
			screenOptions={{
				title: 'Faça sua Cotação',
				header: (props) => <Header {...props} />,
			}}
		>
			<Stack.Screen
				name='index'
				options={{
					title: 'Categorias de Seguros',
				}}
			/>
			<Stack.Screen name='vehicle' />
			<Stack.Screen name='[type]' />
		</Stack>
	);
}

export default RequestQuoteLayout;
