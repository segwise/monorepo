import { Button } from '@/components/ui/button';
import { Input, InputError } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { cn } from '@/libraries/classname';
import { useMarketplaceSignIn } from '@/libraries/hooks/api/marketplace/auth';
import { storage } from '@/libraries/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { maskCPF, maskDateString } from '@segwise/core/masks';
import { SchemaMarketplaceSignIn } from '@segwise/core/schemas';
import type { MarketplaceSignIn } from '@segwise/core/types';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ActivityIndicator,
	Keyboard,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import {
	KeyboardAwareScrollView,
	type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MarketplaceLoginScreen() {
	const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);

	const { replace } = useRouter();

	const { width } = useWindowDimensions();
	const { bottom } = useSafeAreaInsets();

	const { mutate, isPending } = useMarketplaceSignIn();

	const {
		control,
		handleSubmit,
		setFocus,
		formState: { isValid, isDirty },
		getFieldState,
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaMarketplaceSignIn),
		defaultValues: {
			cpf: '',
			birth: '',
		},
	});

	function onSubmit(props: MarketplaceSignIn) {
		Keyboard.dismiss();

		mutate(props, {
			onSuccess() {
				storage.set('buying-and-selling', props.cpf);

				replace('/(stacks)/marketplace/listining');
			},
			onError(error) {
				toast.error(error.message, {
					id: 'marketplace-login',
				});
			},
		});
	}

	return (
		<KeyboardAwareScrollView
			ref={scrollViewRef}
			bottomOffset={bottom + 62}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps='always'
			contentContainerStyle={{ flexGrow: 1 }}
		>
			<View className='flex-1 pt-16 pb-6 px-6 gap-10 justify-between'>
				{/* ───────── HEADER ───────── */}
				<View className='gap-y-3 items-center'>
					<View className='bg-primary rounded-full size-20 flex items-center justify-center mb-2'>
						<SymbolView
							name={{
								ios: 'car.2.fill',
								android: 'directions_car',
							}}
							size={38}
							tintColor='#FFFFFF'
						/>
					</View>
					<Text
						allowFontScaling={false}
						className='text-2xl font-bold text-center'
					>
						Compra e Venda de Veículos
					</Text>
					<Text
						allowFontScaling={false}
						className='text-sm text-gray-500 font-medium text-center leading-5'
					>
						Acesso exclusivo para clientes.{'\n'}
						Informe seus dados para continuar.
					</Text>
				</View>

				{/* ───────── FORMULÁRIO ───────── */}
				<View className='gap-y-5 flex-1 justify-center'>
					{/* CPF */}
					<Controller
						control={control}
						name='cpf'
						render={({ field, fieldState }) => (
							<View>
								<Input
									{...field}
									value={field.value || undefined}
									onChangeText={(value) => field.onChange(maskCPF(value))}
									label='CPF'
									placeholder='000.000.000-00'
									keyboardAppearance='dark'
									keyboardType='number-pad'
									maxLength={14}
									returnKeyType={
										!field.value || field.value === '' || fieldState.invalid
											? 'none'
											: 'next'
									}
									returnKeyLabel='Próximo'
									enablesReturnKeyAutomatically
									onSubmitEditing={() => {
										if (!field.value || fieldState.invalid) return;
										const { invalid, isDirty } = getFieldState('birth');
										if (!isDirty || invalid) {
											setFocus('birth');
										}
									}}
								/>
								{fieldState.error?.message && (
									<InputError>{fieldState.error.message}</InputError>
								)}
							</View>
						)}
					/>

					{/* Data de Nascimento */}
					<Controller
						control={control}
						name='birth'
						render={({ field, fieldState }) => (
							<View>
								<Input
									{...field}
									// @ts-expect-error
									value={field.value || undefined}
									onChangeText={(value) =>
										field.onChange(maskDateString(value))
									}
									label='Data de Nascimento'
									placeholder='00/00/0000'
									keyboardAppearance='dark'
									keyboardType='number-pad'
									maxLength={10}
									returnKeyType={
										!field.value || field.value === '' || fieldState.invalid
											? 'none'
											: 'done'
									}
									returnKeyLabel='Entrar'
									enablesReturnKeyAutomatically
									onSubmitEditing={() => {
										if (!isDirty || !isValid) return;
										handleSubmit(onSubmit)();
									}}
								/>
								{fieldState.error?.message && (
									<InputError>{fieldState.error.message}</InputError>
								)}
							</View>
						)}
					/>
				</View>

				{/* ───────── BOTÃO ───────── */}
				<View className='gap-y-4'>
					<Button
						size='lg'
						className='h-12 flex-row items-center'
						onPress={handleSubmit(onSubmit)}
						disabled={isPending || !isDirty || !isValid}
					>
						<Text className='text-base text-white font-semibold'>
							{isPending ? 'VERIFICANDO...' : 'ACESSAR MARKETPLACE'}
						</Text>
						<View
							className={cn('absolute right-10', width <= 400 && 'right-6')}
						>
							{isPending && <ActivityIndicator color='#FFFFFF' />}
							{!isPending && (
								<SymbolView
									name={{
										ios: 'arrow.right.circle.fill',
										android: 'arrow_forward',
									}}
									size={24}
									tintColor='#FFFFFF'
								/>
							)}
						</View>
					</Button>

					<Text
						allowFontScaling={false}
						className='text-xs text-gray-400 text-center'
					>
						Somente clientes cadastrados têm acesso ao marketplace.
					</Text>
				</View>
			</View>
			<View style={{ height: bottom }} />
		</KeyboardAwareScrollView>
	);
}

export default MarketplaceLoginScreen;
