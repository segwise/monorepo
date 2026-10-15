import { SymbolView } from 'expo-symbols';
import {
	Linking,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { usefulContacts } from '@/configs/consts/useful-contacts';

function Item({ title, value }: (typeof usefulContacts)[0]) {
	function call() {
		Linking.openURL(`tel:${value}`);
	}

	return (
		<TouchableOpacity
			className='bg-background border border-border h-fit rounded-sm px-4 py-2.5 flex flex-row items-center justify-between gap-x-6'
			onPress={call}
		>
			<View>
				<Text
					allowFontScaling={false}
					accessible={false}
					className='text-base text-inherit uppercase font-semibold line-clamp-1 opacity-70'
				>
					{title}
				</Text>
				<Text
					allowFontScaling={false}
					accessible={false}
					className='text-xl text-inherit uppercase font-semibold line-clamp-1'
				>
					{value}
				</Text>
			</View>
			<SymbolView
				name={{
					ios: 'phone.fill.arrow.up.right',
					android: 'phone_in_talk',
				}}
				tintColor='#232323'
			/>
		</TouchableOpacity>
	);
}

function EmergencyScreen() {
	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View className='p-4 gap-y-3 pb-10'>
				{usefulContacts.map(({ title, value }, index) => (
					<Item key={index.toString()} title={title} value={value} />
				))}
			</View>
		</ScrollView>
	);
}

export default EmergencyScreen;
