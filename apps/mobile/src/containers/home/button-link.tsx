import { cn } from '@/libraries/classname';
import { openURL } from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

type ButtonLinkVariant =
	| { href: Href; onPress?: never }
	| { href?: never; onPress: () => void };

type ButtonLinkProps = {
	title: string;
	invert?: boolean;
	icon?: SymbolViewProps['name'];
} & ButtonLinkVariant;

function ButtonLink(props: ButtonLinkProps) {
	const { title, invert, icon, href, onPress: onClick } = props;

	const { push } = useRouter();

	function onPress() {
		if (onClick) {
			onClick();
		} else if (href) {
			const isUrl = z.url().safeParse(href.toString()).success;

			if (isUrl) {
				openURL(href.toString());

				return;
			}

			push(href);
		}
	}

	return (
		<TouchableOpacity
			onPress={onPress}
			className={cn(
				'rounded-sm border bg-background py-2 px-6 flex flex-row items-center justify-between',
				invert && 'bg-primary',
			)}
		>
			<View className='size-6' />
			<Text
				allowFontScaling={false}
				className={cn('text-lg font-semibold', invert && 'text-white')}
			>
				{title}
			</Text>
			{icon ? (
				<SymbolView name={icon} tintColor='#FFFFFF' size={24} />
			) : (
				<View className='size-6' />
			)}
		</TouchableOpacity>
	);
}

export { ButtonLink };
