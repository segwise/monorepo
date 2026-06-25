import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input, InputError } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { isCompany } from '@/configs/consts/company';
import { cn } from '@/libraries/classname';
import { useQuoteSimpleCustomRegister } from '@/libraries/hooks/api/quotes/register/simple';
import { storage } from '@/libraries/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone } from '@segwise/core/masks';
import { SchemaQuoteSimpleCustomRegister } from '@segwise/core/schemas';
import type { Modality, QuoteSimpleCustomRegister } from '@segwise/core/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState } from 'react';
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

function RequestQuoteVehicle() {
	const { type } = useLocalSearchParams<{
		type: Modality;
	}>();

	const [openDialog, setOpenDialog] = useState<boolean>(false);

	const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);

	const { back, replace } = useRouter();

	const { width } = useWindowDimensions();
	const { bottom } = useSafeAreaInsets();

	const { mutate, isPending } = useQuoteSimpleCustomRegister();

	const searchParams = useLocalSearchParams();

	const iHaveInsurance = !!searchParams['i-have-insurance'];
	const firstInit = !!searchParams['first-init'];
	const storeFirstQuote = storage.getBoolean('first-quote');

	const referral = storage.getString('referral');

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
		resolver: zodResolver(SchemaQuoteSimpleCustomRegister),
		defaultValues: {
			referral,
			// @ts-expect-error
			type,
			insured: {
				name: '',
				phone: '',
			},
		},
	});

	function onSubmit(props: QuoteSimpleCustomRegister) {
		Keyboard.dismiss();

		mutate(props, {
			async onSuccess() {
				storage.set('first-quote', true);

				replace('/(stacks)/home');

				toast.success('Aguarde até 24 horas para ter um retorno'.toUpperCase());
			},
			onError(error) {
				toast.error(error.message, {
					id: 'request-quote-custom',
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
		>
			<View className='pt-4 pb-6 px-4 gap-6'>
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
									onChangeText={(value) => field.onChange(value.toUpperCase())}
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

										const { invalid, isDirty } = getFieldState('insured.phone');

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
									}}
								/>
								{fieldState.error?.message && (
									<InputError>{fieldState.error.message}</InputError>
								)}
							</View>
						)}
					/>
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
					<View className={cn('absolute right-10', width <= 400 && 'right-6')}>
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
							Agora ele fica armazenado aqui para facilitar o seu acesso sempre
							que precisar.
						</Text>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='text-sm font-semibold text-center leading-none px-6 text-gray-500 mt-4'
						>
							Você pode consultar todos os detalhes e informações importantes a
							qualquer momento na página{' '}
							<Text
								allowFontScaling={false}
								accessible={false}
								className={cn(
									'font-extrabold text-primary',
									isCompany && 'text-primary-xcar',
								)}
							>
								Meus Seguros
							</Text>
							.
						</Text>
						<View className='mt-4 gap-y-2'>
							<Button
								variant='outline'
								className={cn(
									'border-primary h-fit',
									isCompany && 'border-primary-xcar',
								)}
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
									className={cn(
										'text-sm leading-tight font-semibold text-primary text-center',
										isCompany && 'text-primary-xcar',
									)}
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
	);
}

export default RequestQuoteVehicle;
