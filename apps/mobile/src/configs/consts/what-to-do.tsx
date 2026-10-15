import { Linking, Text, TouchableOpacity, View } from 'react-native';

function CollisionWithNoInjuriesAndTheVehicleIsFunctional() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight mb-1'
				style={{
					textDecorationLine: 'underline',
				}}
			>
				Retire os veículos da via.
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					Bloquear a passagem é uma contravenção média passível de multa (Artigo
					178).
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Não há a necessidade de chamar a fiscalização de trânsito,{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						podendo ser resolvido entre as partes envolvidas
					</Text>
					.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						Coletar:
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Hora e endereço do local da colisão;
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Placa e modelo dos veículos envolvidos;
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Se possível foto da CNH dos condutores;
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Além de registro do acidente por meio de imagens.
					</Text>
					{`\n\n`}
					<Text allowFontScaling={false} accessible={false}>
						Em seguida, comunique os{' '}
						<Text
							allowFontScaling={false}
							accessible={false}
							className='font-bold uppercase'
						>
							sinistro
						</Text>{' '}
						a sua corretora/seguradora em{' '}
						<Text
							allowFontScaling={false}
							accessible={false}
							className='font-bold'
							style={{
								textDecorationLine: 'underline',
							}}
						>
							horário comercial
						</Text>
						.
					</Text>
					{`\n\n`}
					<Text allowFontScaling={false} accessible={false}>
						O registro do{' '}
						<Text
							allowFontScaling={false}
							accessible={false}
							className='font-bold uppercase'
							style={{
								textDecorationLine: 'underline',
							}}
						>
							boletim de ocorrência
						</Text>{' '}
						pode ser feito pela internet, na delegacia online do seu estado.
					</Text>
				</Text>
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base font-bold mt-4 leading-tight'
			>
				O documento será a versão oficial do acidente e das ações tomadas pelos
				envolvidos, podendo proteger o condutor de eventuais problemas futuros.
			</Text>
		</View>
	);
}

function CollisionWithNoInjuriesAndTheVehicleIsNotWorking() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					Não havendo a possibilidade de retirar os veículos, sinalize a área,
					com o{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						triângulo luminoso
					</Text>{' '}
					para que a situação não piore ainda mais, e outros veículos se
					envolvam no acidente.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Não há necessidade de chamar a fiscalização de trânsito,{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						podendo ser resolvido entre as partes envolvidas
					</Text>
					.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						Coletar:
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Hora e endereço do local da colisão;
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Placa e modelo dos veículos envolvidos;
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Se possível foto da CNH dos condutores;
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Além de registro do acidente por meio de imagens.
					</Text>
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Solicite um{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						reboque
					</Text>{' '}
					na assistência 24 horas da sua seguradora.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Se necessário, solicite um transporte para retorno.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Em seguida, comunique os{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
					>
						sinistro
					</Text>{' '}
					a sua corretora/seguradora em{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						horário comercial
					</Text>
					.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Benefícios como carro reserva, cobertura de vidros, informações sobre
					o reparo ou indicações de oficinas são tratados somente junto a sua
					seguradora.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					O registro do{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						boletim de ocorrência
					</Text>{' '}
					pode ser feito pela internet, na delegacia online do seu estado.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					O documento será a versão oficial do acidente e das ações tomadas
					pelos envolvidos, podendo proteger o condutor de eventuais problemas
					futuros.
				</Text>
			</Text>
		</View>
	);
}

function CollisionWithVictim() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight mb-1'
			>
				Mantenha a calma,{' '}
				<Text
					allowFontScaling={false}
					accessible={false}
					className='font-bold uppercase'
					style={{
						textDecorationLine: 'underline',
					}}
				>
					sinalize com o pisca alerta!
				</Text>
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					É importante sinalizar a área, com o{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						triângulo luminoso
					</Text>{' '}
					para que a situação não piore ainda mais, e outros veículos se
					envolvam no acidente.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Não retire os veículos nem as vítimas do local.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Em acidente de trânsito, independentemente da gravidade, peça ajuda e
					acione imediatamente o serviço de emergência médica
				</Text>
				{`\n`}
				<TouchableOpacity onPress={() => Linking.openURL('tel:192')}>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase text-lg'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						SAMU 192.
					</Text>
				</TouchableOpacity>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Para o{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						boletim de ocorrência
					</Text>{' '}
					no local do acidente, deve ser chamado:
					{`\n\n`}
					<Text allowFontScaling={false} accessible={false}>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='font-bold uppercase'
						>
							- em rodovias urbanas:
						</Text>
						{`\n`}
						<Text allowFontScaling={false} accessible={false}>
							Autarquia de trânsito da cidade;
						</Text>
					</Text>
					{`\n\n`}
					<Text allowFontScaling={false} accessible={false}>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='font-bold uppercase'
						>
							- em rodovias estaduais - PE:
						</Text>
						{`\n`}
						<Text allowFontScaling={false} accessible={false}>
							Polícia rodoviária estadual{' '}
							<TouchableOpacity onPress={() => Linking.openURL('tel:198')}>
								<Text
									allowFontScaling={false}
									accessible={false}
									className='font-bold'
								>
									(198)
								</Text>
							</TouchableOpacity>
							;
						</Text>
					</Text>
					{`\n\n`}
					<Text allowFontScaling={false} accessible={false}>
						<Text
							allowFontScaling={false}
							accessible={false}
							className='font-bold uppercase'
						>
							- em rodovias federais - BR:
						</Text>
						{`\n`}
						<Text allowFontScaling={false} accessible={false}>
							Polícia rodoviária federal{' '}
							<TouchableOpacity onPress={() => Linking.openURL('tel:191')}>
								<Text
									allowFontScaling={false}
									accessible={false}
									className='font-bold'
								>
									(191)
								</Text>
							</TouchableOpacity>
							;
						</Text>
					</Text>
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					O documento será a versão oficial do acidente e das ações tomadas
					pelos envolvidos, podendo proteger o condutor de eventuais problemas
					futuros e para dar entrada no seguro DPVAT.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Vale lembrar que fugir fo local sem prestar socorro às vítimas é crime
					e infração de trânsito gravíssima. As consequências são várias:
					inquérito e processo penal, cassação da CNH e multa.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Após os procedimentos acima concluídos, solicite um{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						reboque
					</Text>{' '}
					na assistência 24 horas da sua seguradora.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Se necessário, solicite um transporte para retorno.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Em seguida, comunique o{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						sinistro
					</Text>{' '}
					a sua seguradora em{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							fontFamily: 'inter_bold',
						}}
					>
						horário comercial
					</Text>
					.
				</Text>
			</Text>
		</View>
	);
}

function RobberyOrTheft() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight mb-1'
			>
				Entre em contato com a polícia rodoviária federal através do número{' '}
				<TouchableOpacity onPress={() => Linking.openURL('tel:190')}>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase text-lg leading-tight'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						191
					</Text>
				</TouchableOpacity>{' '}
				e comunique o crime
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					Ligue para a assistência 24 horas da sua seguradora para solicitar um
					táxi para seu retorno.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Siga para delegacia física, para registro o{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
					>
						boletim de ocorrência (B.O)
					</Text>
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Nesta ocasião, lembre-se de solicitar a inclusão na BIN do alerta de
					roubo e furto do veículo.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Em seguida, comunique o{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						sinistro
					</Text>{' '}
					a sua seguradora em{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold uppercase'
						style={{
							textDecorationLine: 'underline',
						}}
					>
						horário comercial
					</Text>
					.
				</Text>
			</Text>
		</View>
	);
}

function RequiredDocumentation() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false} className='font-bold'>
					SINISTRO <Text style={{ fontSize: 10 }}>( INDENIZAÇÃO PARCIAL )</Text>
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Carteira de habilitação do condutor ( CNH )
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Boletim de ocorrência
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- CRLV ( Documento do veículo )
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Fotos do acidente
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false} className='font-bold'>
					SINISTRO <Text style={{ fontSize: 10 }}>( ROUBO E FURTO )</Text>
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Carteira de habilitação do condutor ( CNH )
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Boletim de ocorrência feito na delegacia mais próxima, com a
					solicitação da inclusão na BIN
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- CRLV ( Documento do veículo )
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false} className='font-bold'>
					SINISTRO{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						style={{ fontSize: 10 }}
					>
						( INDENIZAÇÃO INTEGRAL )
					</Text>
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Carteira de habilitação do condutor ( CNH )
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Boletim de ocorrência original
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- CRLV-e - Certificado de Registro e Licenciamento ( Pode ser impresso
					pelo aplicativo Carteira Digital )
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- ATPV ou DUT de transferência do veículo
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Comprovante de residência em nome do beneficiário da indenização
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Chaves do veículo - Original e/ou reserva
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Se financiado - Carta com saldo devedor e boleto bancário para
					quitação total do contrato de financiamento com o vencimento para 10
					dias úteis contados a partir da data do envio da documentação
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Cópia cartão bancário de conta corrente em nome do beneficiário da
					indenização
				</Text>
				{`\n`}
				<Text allowFontScaling={false} accessible={false}>
					- Formulário de indenização preenchido ( seguradora envia por e-mail )
				</Text>
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base text-center font-bold mt-4 leading-tight'
				style={{
					textDecorationLine: 'underline',
				}}
			>
				Dúvidas, fale com o seu corretor
			</Text>
		</View>
	);
}

const whatToDo = {
	'collision-with-no-injuries-and-the-vehicle-is-functional': {
		title: 'Colisão Sem Vítima e o Veículo Funciona',
		content: <CollisionWithNoInjuriesAndTheVehicleIsFunctional />,
	},
	'collision-with-no-injuries-and-the-vehicle-is-not-working': {
		title: 'Colisão Sem Vítima e o Veículo Não Funciona',
		content: <CollisionWithNoInjuriesAndTheVehicleIsNotWorking />,
	},
	'collision-with-victim': {
		title: 'Colisão Com Vítima',
		content: <CollisionWithVictim />,
	},
	'robbery-or-theft': {
		title: 'Roubo ou Furto',
		content: <RobberyOrTheft />,
	},
	'required-documentation': {
		title: 'Documentação Necessária',
		content: <RequiredDocumentation />,
	},
};

export { whatToDo };
