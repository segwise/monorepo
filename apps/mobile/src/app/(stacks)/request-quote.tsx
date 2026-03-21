import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input, InputError } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import { cn } from '@/libraries/classname';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/api/insurance-companies/simple';
import { useQuoteIsPlate } from '@/libraries/hooks/api/quotes/plate';
import { useQuoteSimpleRegister } from '@/libraries/hooks/api/quotes/register/simple';
import { storage } from '@/libraries/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TriggerRef } from '@rn-primitives/select';
import {
	maskDateString,
	maskPhone,
	maskPlate,
	maskPostalCode,
} from '@segwise/core/masks';
import { SchemaQuoteSimpleRegister } from '@segwise/core/schemas';
import { translateVehicleUsage } from '@segwise/core/translate';
import type { QuoteSimpleRegister } from '@segwise/core/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ActivityIndicator,
	Keyboard,
	Text,
	TouchableOpacity,
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
			<View className='bg-primary rounded-full size-9 flex flex-row items-center justify-center'>
				<SymbolView name={icon} size={18} tintColor='#FFFFFF' />
			</View>
			<Text allowFontScaling={false} className='text-xl font-semibold'>
				{title}
			</Text>
		</View>
	);
}

function RequestQuote() {
	const [openDialog, setOpenDialog] = useState<boolean>(false);

	const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);

	const selectTriggerRefUse = useRef<TriggerRef>(null);
	const selectTriggerRefType = useRef<TriggerRef>(null);
	const selectTriggerRefInsuranceCompany = useRef<TriggerRef>(null);
	const selectTriggerRefInsuranceAssociationCompany = useRef<TriggerRef>(null);

	const { back, replace } = useRouter();

	const { width } = useWindowDimensions();
	const { bottom } = useSafeAreaInsets();

	const { mutate, isPending } = useQuoteSimpleRegister();

	const { data: insuranceCompanies } = useInsuranceCompaniesSimple();

	const searchParams = useLocalSearchParams();

	const iHaveInsurance = !!searchParams['i-have-insurance'];
	const firstInit = !!searchParams['first-init'];
	const storeFirstQuote = storage.getBoolean('first-quote');

	const {
		control,
		handleSubmit,
		watch,
		setFocus,
		formState: { isValid, isDirty, errors },
		getFieldState,
		clearErrors,
		setError,
		resetField,
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaQuoteSimpleRegister),
		defaultValues: {
			modality: 'car',
			vehicleWithLicensePlate: true,
		},
	});

	const plate = watch('plate') || null;

	const { data: quoteIsPlate } = useQuoteIsPlate(plate || '');

	const vehicleWithLicensePlate = watch('vehicleWithLicensePlate');

	// @ts-expect-error
	const type = watch('type')?.value || undefined;

	const isRenewal = type === 'renewal';

	function onSubmit(props: QuoteSimpleRegister) {
		Keyboard.dismiss();

		mutate(props, {
			async onSuccess(data, _variables, _mutate, ctx) {
				storage.set('first-quote', true);

				if (data.safe) {
					const keyStorage = 'filters:insurances:ids';

					const myFiltersIdsStorage = storage.getString(keyStorage);

					const myFiltersIds = myFiltersIdsStorage
						? (JSON.parse(myFiltersIdsStorage) as Array<string>)
						: [];

					myFiltersIds.push(data.safe);

					storage.set(keyStorage, JSON.stringify(myFiltersIds));

					await ctx.client.refetchQueries({
						queryKey: ['safes'],
					});
				}

				if (props.renewal) {
					setOpenDialog(true);
				} else {
					back();

					toast.success(
						'Aguarde até 24 horas para ter um retorno'.toUpperCase(),
					);
				}
			},
			onError(error) {
				toast.error(error.message, {
					id: 'request-quote',
				});
			},
		});
	}

	useEffect(() => {
		if (quoteIsPlate) {
			setTimeout(() => {
				setError('plate', {
					message: 'Veículo já está sendo cotado',
				});
			}, 100);
		}
	}, [quoteIsPlate, setError]);

	return (
		<Fragment>
			{(iHaveInsurance || !storeFirstQuote) && (
				<Stack.Screen
					options={{
						title: 'Inclua seus Dados',
					}}
				/>
			)}
			<KeyboardAwareScrollView
				ref={scrollViewRef}
				bottomOffset={bottom + 62}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps='handled'
			>
				<View className='pt-4 pb-6 px-4 gap-6'>
					<View className='gap-y-5'>
						<View className='gap-y-2'>
							<Label
								title='Dados do Veículo'
								icon={{
									ios: 'car.fill',
									android: 'car_tag',
								}}
							/>
							<View className='flex flex-row items-center justify-start gap-x-6'>
								<Controller
									control={control}
									name='vehicleWithLicensePlate'
									render={({ field }) => (
										<TouchableOpacity
											onPress={() => field.onChange(true)}
											className='flex flex-row items-center justify-start gap-x-2'
										>
											<Checkbox
												checked={field.value as boolean}
												onCheckedChange={() => {}}
												className='size-[1.1rem] pointer-events-none'
											/>
											<Text
												allowFontScaling={false}
												className='text-base font-medium'
											>
												Com Placa
											</Text>
										</TouchableOpacity>
									)}
								/>
								<Controller
									control={control}
									name='vehicleWithLicensePlate'
									render={({ field }) => (
										<TouchableOpacity
											onPress={() => {
												field.onChange(false);

												if (errors.plate) {
													resetField('plate');
													clearErrors('plate');
												}
											}}
											className='flex flex-row items-center justify-start gap-x-2'
										>
											<Checkbox
												checked={!field.value as boolean}
												onCheckedChange={() => {}}
												className='size-[1.1rem] pointer-events-none'
											/>
											<Text
												allowFontScaling={false}
												className='text-base font-medium'
											>
												Sem Placa
											</Text>
										</TouchableOpacity>
									)}
								/>
							</View>
						</View>
						{!!vehicleWithLicensePlate && (
							<Controller
								control={control}
								name='plate'
								render={({ field, fieldState }) => (
									<View>
										<Input
											{...field}
											value={field.value || undefined}
											onChangeText={(value) =>
												field.onChange(
													value ? maskPlate(value.toUpperCase()) : null,
												)
											}
											label='Placa'
											placeholder='AAA-0000 ou AAA0A00'
											className='uppercase'
											autoCapitalize='characters'
											autoComplete='off'
											autoCorrect={false}
											maxLength={
												field.value?.[4] && Number.isInteger(field.value?.[4])
													? 7
													: 8
											}
											keyboardAppearance='dark'
											returnKeyType={
												!field.value || field.value === '' || fieldState.invalid
													? 'none'
													: 'next'
											}
											returnKeyLabel='Próximo'
											enablesReturnKeyAutomatically
											onSubmitEditing={() => {
												if (!field.value || field.value === '') {
													return;
												}

												if (fieldState.invalid) {
													return;
												}

												const { invalid, isDirty } = getFieldState('usage');

												if (!isDirty || invalid) {
													selectTriggerRefUse.current?.open();
												}
											}}
										/>
										{fieldState.error?.message && (
											<InputError>{fieldState.error.message}</InputError>
										)}
									</View>
								)}
							/>
						)}
						<Controller
							control={control}
							name='usage'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-ignore */}
									<Select
										{...field}
										onOpenChange={() => Keyboard.dismiss()}
										onValueChange={(value) => {
											field.onChange(value);

											const { invalid, isDirty } = getFieldState('postalCode');

											if (!isDirty || invalid) {
												setFocus('postalCode');
											}
										}}
									>
										<SelectTrigger
											ref={selectTriggerRefUse}
											label='Uso do Veículo'
										>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent style={{ width: width - 32 }}>
											<SelectItem
												value='leisure_and_work'
												label={translateVehicleUsage(
													'leisure_and_work',
												).toUpperCase()}
											/>
											<SelectItem
												value='leisure'
												label={translateVehicleUsage('leisure').toUpperCase()}
											/>
											<SelectItem
												value='client_supplier_visits'
												label={translateVehicleUsage(
													'client_supplier_visits',
												).toUpperCase()}
											/>
											<SelectItem
												value='app_based_transport'
												label={translateVehicleUsage(
													'app_based_transport',
												).toUpperCase()}
											/>
											<SelectItem
												value='taxi'
												label={translateVehicleUsage('taxi').toUpperCase()}
											/>
											<SelectItem
												value='public_transportation'
												label={translateVehicleUsage(
													'public_transportation',
												).toUpperCase()}
											/>
											<SelectItem
												value='delivieries'
												label={translateVehicleUsage(
													'delivieries',
												).toUpperCase()}
											/>
											<SelectItem
												value='tourism'
												label={translateVehicleUsage('tourism').toUpperCase()}
											/>
										</SelectContent>
									</Select>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Controller
							control={control}
							name='postalCode'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										onChangeText={(value) =>
											field.onChange(maskPostalCode(value))
										}
										label='CEP de Pernoite'
										placeholder='00000-000'
										maxLength={9}
										keyboardAppearance='dark'
										keyboardType='number-pad'
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || field.value === '') {
												return;
											}

											if (fieldState.invalid) {
												return;
											}

											const { invalid, isDirty } =
												getFieldState('insured.name');

											if (!isDirty || invalid) {
												setFocus('insured.name');
											}
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
					</View>
					<View className='gap-y-5'>
						<Label
							title='Dados do Segurado'
							icon={{
								ios: 'person.fill',
								android: 'person_shield',
							}}
						/>
						<Controller
							control={control}
							name='insured.name'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) =>
											field.onChange(value.toUpperCase())
										}
										label='Nome e Sobrenome'
										placeholder='Nome e Sobrenome'
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
											if (!field.value || field.value === '') {
												return;
											}

											if (fieldState.invalid) {
												return;
											}

											const { invalid, isDirty } =
												getFieldState('insured.phone');

											if (!isDirty || invalid) {
												setFocus('insured.phone');
											}
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
							name='insured.phone'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										onChangeText={(value) => field.onChange(maskPhone(value))}
										label='Celular / Whatsapp'
										placeholder='(00) 00000-0000'
										keyboardAppearance='dark'
										maxLength={15}
										keyboardType='number-pad'
										returnKeyType={
											!field.value || field.value === '' || fieldState.invalid
												? 'none'
												: 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || field.value === '') {
												return;
											}

											if (fieldState.invalid) {
												return;
											}

											const { invalid, isDirty } = getFieldState('type.value');

											if (!isDirty || invalid) {
												selectTriggerRefType.current?.open();
											}
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Separator />
						<Controller
							control={control}
							name='type'
							render={({ field }) => (
								// @ts-expect-error
								<Select
									{...field}
									onOpenChange={() => Keyboard.dismiss()}
									onValueChange={(value) => {
										field.onChange(value);

										if (
											value?.value === 'renewal' ||
											value?.value === 'association'
										) {
											const { invalid, isDirty } =
												getFieldState('insuranceCompany');

											if (!isDirty || invalid) {
												setTimeout(() => {
													scrollViewRef.current?.scrollToEnd({
														animated: true,
													});
												}, 100);

												setTimeout(() => {
													if (value.value === 'renewal') {
														selectTriggerRefInsuranceCompany.current?.open();
													}

													if (value.value === 'association') {
														selectTriggerRefInsuranceAssociationCompany.current?.open();
													}
												}, 500);
											}
										}
									}}
								>
									<SelectTrigger
										ref={selectTriggerRefType}
										label='Tipo de Cotação'
									>
										<SelectValue placeholder='Selecionar' />
									</SelectTrigger>
									<SelectContent style={{ width: width - 32 }}>
										<SelectItem value='new' label='SEGURO NOVO' />
										<SelectItem value='renewal' label='RENOVAÇÃO' />
										<SelectItem value='association' label='ASSOCIAÇÃO' />
									</SelectContent>
								</Select>
							)}
						/>
						{isRenewal && (
							<Fragment>
								<Controller
									control={control}
									name='insuranceCompany'
									render={({ field, fieldState }) => (
										<View>
											<Select
												{...field}
												// @ts-expect-error
												value={field.value || undefined}
												onOpenChange={() => Keyboard.dismiss()}
												onValueChange={(value) => {
													field.onChange(value);

													const { invalid, isDirty } =
														getFieldState('expiration');

													if (!isDirty || invalid) {
														setFocus('expiration');
													}
												}}
											>
												<SelectTrigger
													ref={selectTriggerRefInsuranceCompany}
													label='Seguradora'
												>
													<SelectValue placeholder='Selecionar' />
												</SelectTrigger>
												<SelectContent style={{ width: width - 32 }}>
													{insuranceCompanies?.map(({ id, name, icon }) => (
														<SelectItem
															key={id}
															value={id}
															label={name.toUpperCase()}
															image={icon}
														/>
													))}
												</SelectContent>
											</Select>
											{fieldState.error?.message && (
												<InputError>{fieldState.error.message}</InputError>
											)}
										</View>
									)}
								/>
								<Controller
									control={control}
									name='expiration'
									render={({ field, fieldState }) => (
										<View>
											<Input
												{...field}
												// @ts-expect-error
												value={field.value || undefined}
												onChangeText={(value) =>
													field.onChange(maskDateString(value))
												}
												label='Final da Vigência'
												placeholder='00/00/0000'
												keyboardAppearance='dark'
												maxLength={10}
												keyboardType='number-pad'
												returnKeyType={
													!field.value ||
													field.value === '' ||
													fieldState.invalid
														? 'none'
														: 'next'
												}
												returnKeyLabel='Próximo'
												enablesReturnKeyAutomatically
												onSubmitEditing={() => {
													if (!field.value || field.value === '') {
														return;
													}

													if (fieldState.invalid) {
														return;
													}

													const { invalid, isDirty } =
														getFieldState('franchise');

													if (!isDirty || invalid) {
														setFocus('franchise');
													}
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
									name='franchise'
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
												maxLength={12}
												returnKeyType={
													!field.value ||
													field.value === '' ||
													fieldState.invalid
														? 'none'
														: 'done'
												}
												returnKeyLabel='Próximo'
												enablesReturnKeyAutomatically
												onChangeValue={(value) =>
													field.onChange(value ? value : null)
												}
												renderTextInput={(props) => (
													<Input {...props} label='Frânquia ( Opcional )' />
												)}
												onSubmitEditing={() => {
													if (!isDirty || !isValid) {
														return;
													}

													handleSubmit(onSubmit);
												}}
											/>
											{fieldState.error?.message && (
												<InputError>{fieldState.error.message}</InputError>
											)}
										</View>
									)}
								/>
							</Fragment>
						)}
					</View>
					<Button
						size='lg'
						className='h-12 flex-row items-center'
						onPress={handleSubmit(onSubmit)}
						disabled={isPending || !isDirty || !isValid}
					>
						<Text className='text-base text-white font-semibold'>
							{isPending
								? iHaveInsurance || !storeFirstQuote
									? 'INCLUINDO DADOS'
									: 'ENVIANDO SOLICITAÇÃO'
								: iHaveInsurance || !storeFirstQuote
									? 'INCLUIR DADOS'
									: 'ENVIAR SOLICITAÇÃO'}
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
				<View
					style={{
						height: bottom,
					}}
				/>
				<Dialog open={openDialog} onOpenChange={setOpenDialog}>
					<DialogContent showClose={false}>
						<DialogHeader className='gap-1'>
							<DialogTitle className='text-xl text-center font-bold leading-none uppercase'>
								Cotação enviada com sucesso!
							</DialogTitle>
							<DialogDescription className='text-sm font-semibold text-center leading-none px-6 text-gray-500'>
								O seguro que você enviou está vigente e foi adicionado ao
								aplicativo.
							</DialogDescription>
							<View className=' items-center justify-center my-4'>
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
								Agora ele fica armazenado aqui para facilitar o seu acesso
								sempre que precisar.
							</Text>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-sm font-semibold text-center leading-none px-6 text-gray-500 mt-4'
							>
								Você pode consultar todos os detalhes e informações importantes
								a qualquer momento na página{' '}
								<Text
									allowFontScaling={false}
									accessible={false}
									className='font-extrabold text-primary'
								>
									Meus Seguros
								</Text>
								.
							</Text>
							<View className='mt-4 gap-y-2'>
								<Button
									variant='outline'
									className='border-primary h-fit'
									onPress={() => {
										if (firstInit) {
											replace('/(stacks)/home');

											return;
										}

										back();
									}}
								>
									<Text
										allowFontScaling={false}
										accessible={false}
										className='text-sm leading-tight font-semibold text-primary text-center'
									>
										FECHAR E CLICAR EM
										{'\n'}
										<Text
											allowFontScaling={false}
											accessible={false}
											className='font-extrabold'
										>
											MEUS SEGUROS
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

export default RequestQuote;
