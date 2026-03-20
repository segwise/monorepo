import IMAGE from '@/assets/images/image-request-code.png';
import { Button } from '@/components/ui/button';
import { Input, InputError } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useReferral } from '@/libraries/hooks/api/referral';
import { storage } from '@/libraries/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { SchemaProducerReferral } from '@segwise/core/schemas';
import type { ProducerReferral } from '@segwise/core/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Keyboard, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function RequestReferralScreen() {
	const { bottom } = useSafeAreaInsets();

	const { replace } = useRouter();

	const { mutate, isPending } = useReferral();

	const { control, handleSubmit } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerReferral),
		defaultValues: {
			referral: '',
		},
	});

	function onSubmit(props: ProducerReferral) {
		Keyboard.dismiss();

		mutate(props, {
			onSuccess(_, { referral }) {
				storage.set('referral', referral);

				replace('/(stacks)/request-quote?first-init=true');
			},
			onError(error) {
				toast.error(error.message, {
					id: 'request-referral',
				});
			},
		});
	}

	return (
		<KeyboardAwareScrollView
			keyboardShouldPersistTaps='handled'
			bottomOffset={bottom + 62}
			showsVerticalScrollIndicator={false}
		>
			<View className='pt-16'>
				<View>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='text-3xl font-extrabold text-center px-10 leading-none'
					>
						ATIVE SEU CÓDIGO DE DESCONTO
					</Text>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='text-base text-foreground/80 px-8 text-center leading-tight font-medium mt-4 mb-10'
					>
						Insira o código que você recebeu e garanta seu cashback
					</Text>
					<Image
						source={IMAGE}
						style={{
							width: 'auto',
							height: 220,
						}}
						contentFit='contain'
						contentPosition='center'
						priority='high'
						cachePolicy='memory-disk'
						allowDownscaling={false}
						accessible={false}
					/>
					<View className='px-6'>
						<Controller
							control={control}
							name='referral'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										onChangeText={(value) =>
											field.onChange(value.toUpperCase().trim())
										}
										label='Código de Desconto'
										placeholder='Digite o código aqui'
										className='h-14 placeholder:text-lg placeholder:leading-tight'
										autoCapitalize='characters'
										autoComplete='off'
										autoCorrect={false}
										returnKeyLabel='Enviar'
										returnKeyType='send'
										enablesReturnKeyAutomatically
										keyboardAppearance='dark'
										enterKeyHint='send'
										maxLength={10}
										onSubmitEditing={handleSubmit(onSubmit)}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Button
							variant='default'
							size='lg'
							className='w-full mt-4 h-14'
							onPress={handleSubmit(onSubmit)}
							disabled={isPending}
						>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-white text-lg font-semibold'
							>
								{!isPending ? 'GARANTA SEUS BENEFÍCIOS' : 'ENVIANDO'}
							</Text>
							{!isPending && (
								<SymbolView
									name={{
										ios: 'link',
										android: 'link',
									}}
									size={20}
									tintColor='#FFFFFF'
								/>
							)}
							{isPending && <ActivityIndicator color='#FFFFFF' />}
						</Button>
					</View>
				</View>
			</View>
		</KeyboardAwareScrollView>
	);
}

export default RequestReferralScreen;
