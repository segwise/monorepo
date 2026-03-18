import CAR from '@/assets/images/car-insurances.png';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Text, TouchableOpacity, View } from 'react-native';

function InsurancesScreen() {
	const { push } = useRouter();
	return (
		<View>
			<View className='w-full h-[20rem] overflow-hidden -ml-3'>
				<Image
					source={CAR}
					style={{
						width: '100%',
						height: '100%',
						transform: [
							{
								scale: 1.5,
							},
						],
					}}
					contentFit='contain'
					contentPosition='center'
					priority='high'
					allowDownscaling={false}
					accessible={false}
				/>
			</View>

			<View className='px-4 gap-y-6'>
				<Text
					allowFontScaling={false}
					accessible={false}
					className='text-center text-xl font-bold leading-none -mb-2'
				>
					SOU CLIENTE DA CORRETORA
				</Text>
				<Input label='CPF' placeholder='000.000.000-00' />
				<Input label='DATA DE NASCIMENTO' placeholder='00/00/0000' />
				<TouchableOpacity className='py-3 bg-primary border border-primary rounded-sm'>
					<View className='flex-row text-center items-center justify-center'>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='text-xl text-white font-bold leading-none mr-1'
						>
							PESQUISAR
						</Text>
						<SymbolView
							name={{
								ios: 'magnifyingglass',
								android: 'search',
							}}
							tintColor='#FFFFFF'
						/>
					</View>
				</TouchableOpacity>
			</View>
			<View className='mx-4 my-6'>
				<Separator />
			</View>
			<View className='gap-y-6 mx-4'>
				<View>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='text-base font-medium leading-none mb-2 text-center'
					>
						Cliente de outra seguradora ou banco acesse:
					</Text>
					<TouchableOpacity
						className='py-2 bg-transparent border border-primary rounded-sm'
						onPress={() =>
							push('/(stacks)/request-quote?i-have-insurance=true')
						}
					>
						<View className='flex-row text-center items-center justify-center'>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-base font-bold leading-none mr-2'
							>
								JÁ TENHO SEGURO
							</Text>
							<SymbolView
								name={{
									ios: 'arrow.right',
									android: 'arrow_right',
								}}
								size={20}
								tintColor='#232323'
							/>
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

export default InsurancesScreen;
