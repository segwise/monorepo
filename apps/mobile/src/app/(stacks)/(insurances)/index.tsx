import CAR from '@/assets/images/car-insurances.png';
import { Input, InputError } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import { useSafesRegistration } from '@/libraries/hooks/api/safe';
import { storage } from '@/libraries/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { maskCPF, maskDateString } from '@segwise/core/masks';
import { SchemaSearchQueriesSafeRegistration } from '@segwise/core/schemas';
import type { SafeRegistration } from '@segwise/core/types';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function InsurancesScreen() {
	const { bottom } = useSafeAreaInsets();

	const queryClient = useQueryClient();

	const { push, replace } = useRouter();

	const { mutate, isPending } = useSafesRegistration();

	const { control, setFocus, handleSubmit } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaSearchQueriesSafeRegistration),
		defaultValues: {
			registration: '',
			birth: '',
		},
	});

	function onSubmit(props: SafeRegistration) {
		mutate(props, {
			async onSuccess() {
				const keyStorage = 'filters:insurances:registrations';

				const myFiltersRegistrationResponse = storage.getString(keyStorage);

				const myFiltersRegistration = myFiltersRegistrationResponse
					? (JSON.parse(myFiltersRegistrationResponse) as Array<string>)
					: [];

				myFiltersRegistration.push(props.registration);

				storage.set(keyStorage, JSON.stringify(myFiltersRegistration));

				await queryClient.refetchQueries({
					queryKey: ['safes'],
				});

				replace('/(stacks)/(insurances)/listining');
			},
			onError(error) {
				toast.error(error.message, {
					id: 'my-insurances',
				});

				setFocus('registration');
			},
		});
	}

	return (
		<KeyboardAwareScrollView
			bottomOffset={bottom + 62 * 3}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps='handled'
		>
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
				<Controller
					control={control}
					name='registration'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								label='CPF'
								placeholder='000.000.000-00'
								onChangeText={(value) => field.onChange(maskCPF(value))}
								keyboardAppearance='dark'
							/>
							{fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<Controller
					control={control}
					name='birth'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								label='DATA DE NASCIMENTO'
								placeholder='00/00/0000'
								onChangeText={(value) => field.onChange(maskDateString(value))}
								keyboardAppearance='dark'
							/>
							{fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<TouchableOpacity
					className='py-3 bg-primary border border-primary rounded-sm'
					onPress={handleSubmit(onSubmit)}
				>
					<View className='flex-row text-center items-center justify-center'>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='text-xl text-white font-bold leading-none mr-2'
						>
							{!isPending && 'PESQUISAR'}
							{isPending && 'PESQUISANDO'}
						</Text>
						{!isPending && (
							<SymbolView
								name={{
									ios: 'magnifyingglass',
									android: 'search',
								}}
								size={24}
								tintColor='#FFFFFF'
							/>
						)}
						{isPending && <ActivityIndicator size={24} color='#FFFFFF' />}
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
		</KeyboardAwareScrollView>
	);
}

export default InsurancesScreen;
