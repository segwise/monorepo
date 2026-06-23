import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input, InputError } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import { isCompany } from '@/configs/consts/company';
import { cn } from '@/libraries/classname';
import { useFinancingRegister } from '@/libraries/hooks/api/financing/register';
import { storage } from '@/libraries/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { maskCPF, maskPhone } from '@segwise/core/masks';
import { SchemaQuoteFinancingRegister } from '@segwise/core/schemas';
import type { QuoteFinancingRegister } from '@segwise/core/types';
import { Stack, useRouter } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { Fragment, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ActivityIndicator,
	Keyboard,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import {
	KeyboardAwareScrollView,
	type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface LabelProps {
	title: string;
	icon: SymbolViewProps['name'];
}

function Label({ title, icon }: LabelProps) {
	return (
		<View className='flex flex-row items-center justify-start gap-x-2'>
			<View
				className={cn(
					'bg-primary rounded-full size-9 flex flex-row items-center justify-center',
					isCompany && 'bg-primary-xcar',
				)}
			>
				<SymbolView name={icon} size={18} tintColor='#FFFFFF' />
			</View>
			<Text allowFontScaling={false} className='text-xl font-semibold'>
				{title}
			</Text>
		</View>
	);
}

function RequestQuoteFinancing() {
	const [openDialog, setOpenDialog] = useState<boolean>(false);

	const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);

	const { back } = useRouter();

	const { width } = useWindowDimensions();
	const { bottom } = useSafeAreaInsets();

	const { mutate, isPending } = useFinancingRegister();

	const referral = storage.getString('referral');

	const {
		control,
		handleSubmit,
		setFocus,
		formState: { isValid, isDirty },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaQuoteFinancingRegister),
		defaultValues: {
			referral,
			financed: {
				name: '',
				phone: '',
				cpf: '',
			},
		},
	});

	function onSubmit(props: QuoteFinancingRegister) {
		Keyboard.dismiss();

		mutate(props, {
			onSuccess() {
				setOpenDialog(true);
			},
			onError(error) {
				toast.error(error.message, {
					id: 'request-quote-financing',
				});
			},
		});
	}

	return (
		<Fragment>
			<Stack.Screen
				options={{
					title: 'Financiamento de Veículo',
				}}
			/>
			<KeyboardAwareScrollView
				ref={scrollViewRef}
				bottomOffset={bottom + 62}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps='always'
			>
				<View className='pt-4 pb-6 px-4 gap-6'>
					{/* ───────── DADOS DO VEÍCULO ───────── */}
					<View className='gap-y-5'>
						<Label
							title='Dados do Veículo'
							icon={{
								ios: 'car.fill',
								android: 'car_tag',
							}}
						/>

						<Controller
							control={control}
							name='vehicle.plate'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) =>
											field.onChange(value.toUpperCase())
										}
										label='Placa do Veículo ( Opcional )'
										placeholder='AAA-0000 ou AAA0A00'
										className='uppercase'
										keyboardAppearance='dark'
										autoCapitalize='characters'
										autoCorrect={false}
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || fieldState.invalid) return;
											setFocus('vehicle.model');
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						{/* Modelo */}
						<Controller
							control={control}
							name='vehicle.model'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) =>
											field.onChange(value.toUpperCase())
										}
										label='Modelo do Veículo'
										placeholder='Ex: CIVIC EXL, ONIX PLUS...'
										className='uppercase'
										keyboardAppearance='dark'
										autoCapitalize='characters'
										autoCorrect={false}
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || fieldState.invalid) return;
											setFocus('vehicle.year');
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>

						{/* Ano */}
						<Controller
							control={control}
							name='vehicle.year'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										// @ts-expect-error
										value={field.value || undefined}
										onChangeText={(value) =>
											field.onChange(value.replace(/\D/g, '').slice(0, 4))
										}
										label='Ano do Veículo'
										placeholder='Ex: 2023'
										keyboardAppearance='dark'
										keyboardType='number-pad'
										maxLength={4}
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || fieldState.invalid) return;
											// vehicleValue é CurrencyInput — foco manual não disponível
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>

						{/* Valor do Veículo */}
						<Controller
							control={control}
							name='vehicle.amount'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<CurrencyInput
										{...field}
										prefix='R$ '
										delimiter='.'
										separator=','
										precision={2}
										minValue={0}
										placeholder='R$ 0.000,00'
										keyboardAppearance='dark'
										maxLength={14}
										returnKeyType={
											!field.value || fieldState.invalid ? 'none' : 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onChangeValue={(value: number | null) =>
											field.onChange(value ?? null)
										}
										renderTextInput={(props: any) => (
											<Input {...props} label='Valor do Veículo' />
										)}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>

						{/* Valor de Entrada */}
						<Controller
							control={control}
							name='vehicle.downPayment'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<CurrencyInput
										{...field}
										prefix='R$ '
										delimiter='.'
										separator=','
										precision={2}
										minValue={0}
										placeholder='R$ 0.000,00'
										keyboardAppearance='dark'
										maxLength={14}
										returnKeyType={
											!field.value || fieldState.invalid ? 'none' : 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onChangeValue={(value: number | null) =>
											field.onChange(value ?? null)
										}
										renderTextInput={(props: any) => (
											<Input {...props} label='Valor de Entrada ( Opcional )' />
										)}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
					</View>

					<Separator />

					{/* ───────── DADOS DO FINANCIADO ───────── */}
					<View className='gap-y-5'>
						<Label
							title='Dados do Financiado'
							icon={{
								ios: 'person.fill',
								android: 'person_shield',
							}}
						/>

						{/* Nome */}
						<Controller
							control={control}
							name='financed.name'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) =>
											field.onChange(value.toUpperCase())
										}
										label='Nome'
										placeholder='Nome'
										className='uppercase'
										keyboardAppearance='dark'
										autoCapitalize='characters'
										autoComplete='off'
										autoCorrect={false}
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || fieldState.invalid) return;
											setFocus('financed.phone');
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>

						{/* Celular */}
						<Controller
							control={control}
							name='financed.phone'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) => field.onChange(maskPhone(value))}
										label='Celular'
										placeholder='(99) 99999-9999'
										keyboardAppearance='dark'
										keyboardType='phone-pad'
										autoCapitalize='none'
										autoCorrect={false}
										autoComplete='tel-device'
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'done'
										}
										returnKeyLabel='Concluir'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!isDirty || !isValid) return;
											setFocus('financed.cpf');
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Controller
							control={control}
							name='financed.cpf'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) => field.onChange(maskCPF(value))}
										label='CPF'
										placeholder='000.000.000-00'
										keyboardAppearance='dark'
										keyboardType='phone-pad'
										autoCapitalize='none'
										autoCorrect={false}
										autoComplete='tel-device'
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'done'
										}
										returnKeyLabel='Concluir'
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

					{/* ───────── BOTÃO DE ENVIO ───────── */}
					<Button
						size='lg'
						className='h-12 flex-row items-center'
						onPress={handleSubmit(onSubmit)}
						disabled={isPending || !isDirty || !isValid}
					>
						<Text className='text-base text-white font-semibold'>
							{isPending ? 'ENVIANDO SOLICITAÇÃO' : 'ENVIAR SOLICITAÇÃO'}
						</Text>
						<View
							className={cn('absolute right-10', width <= 400 && 'right-6')}
						>
							{isPending && <ActivityIndicator />}
							{!isPending && (
								<SymbolView
									name={{
										ios: 'paperplane',
										android: 'send',
									}}
									size={24}
									tintColor='#FFFFFF'
								/>
							)}
						</View>
					</Button>
				</View>

				<View style={{ height: bottom }} />

				{/* ───────── DIALOG DE SUCESSO ───────── */}
				<Dialog open={openDialog} onOpenChange={setOpenDialog}>
					<DialogContent showClose={false}>
						<DialogHeader className='gap-1'>
							<DialogTitle className='text-xl text-center font-bold leading-none uppercase'>
								Solicitação enviada com sucesso!
							</DialogTitle>
							<DialogDescription className='text-sm font-semibold text-center leading-none px-6 text-gray-500'>
								Sua solicitação de financiamento foi recebida e está sendo
								analisada.
							</DialogDescription>
							<View className='items-center justify-center my-4'>
								<Svg width={100} height={100} viewBox='0 0 76 76' fill='none'>
									<Path
										d='M69.6666 35.1046V38.018C69.6628 44.8466 67.4516 51.4912 63.3628 56.9603C59.2743 62.4298 53.5271 66.4309 46.9787 68.367C40.4301 70.3031 33.4314 70.0707 27.0258 67.7042C20.6203 65.3378 15.1514 60.964 11.4347 55.2355C7.71799 49.507 5.95264 42.7303 6.40196 35.9163C6.85125 29.1025 9.49114 22.6164 13.9279 17.4255C18.3646 12.2345 24.3605 8.61677 31.0212 7.11185C37.682 5.60692 44.6509 6.29545 50.8883 9.0747M69.6666 12.6666L38 44.3649L28.5 34.8649'
										stroke='#00B10F'
										strokeWidth={5}
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</Svg>
							</View>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-sm font-semibold text-center leading-none px-6 text-gray-500'
							>
								Aguarde até 24 horas para ter um retorno sobre a sua
								solicitação.
							</Text>
							<View className='mt-4 gap-y-2'>
								<Button
									variant='outline'
									className={cn(
										'border-primary h-fit',
										isCompany && 'border-primary',
									)}
									onPress={back}
								>
									<Text
										allowFontScaling={false}
										accessible={false}
										className='text-sm leading-tight font-semibold text-primary text-center'
									>
										FECHAR E IR PARA
										{'\n'}
										<Text
											allowFontScaling={false}
											accessible={false}
											className='font-extrabold'
										>
											INÍCIO
										</Text>
									</Text>
								</Button>
							</View>
						</DialogHeader>
					</DialogContent>
				</Dialog>
			</KeyboardAwareScrollView>
		</Fragment>
	);
}

export default RequestQuoteFinancing;
