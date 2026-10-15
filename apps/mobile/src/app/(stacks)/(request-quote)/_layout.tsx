import { Stack } from 'expo-router';
import { Header } from '@/containers/header';

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
