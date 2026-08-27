import type { PropsWithChildren } from 'hono/jsx';

const ALLIANZ_LOGO = 'https://static.cdnlogo.com/logos/a/21/allianz-1.svg';
const SEGWISE_LOGO =
	'https://customer.segwise.com.br/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.2b0eddfb.png&w=1920&q=100';

const icons = {
	vehicle: (
		<svg
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="white"
			strokeWidth="1.8"
		>
			<title>vehicle</title>
			<path
				d="M5 17h14M5 17a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4zM3 17V9l2-5h14l2 5v8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
	motorcycle: (
		<svg
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="white"
			strokeWidth="1.8"
		>
			<title>motorcycle</title>
			<circle cx="5" cy="17" r="3" />
			<circle cx="19" cy="17" r="3" />
			<path
				d="M5 17l4-8h5l4 8M9 9h6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
	residencial: (
		<svg
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="white"
			strokeWidth="1.8"
		>
			<title>residencial</title>
			<path
				d="M3 11l9-7 9 7M5 10v10h14V10"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
	life: (
		<svg
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="white"
			strokeWidth="1.8"
		>
			<title>life</title>
			<path
				d="M20.5 8.5c0-2.5-2-4.5-4.5-4.5-1.5 0-2.8.7-3.5 1.8-.7-1.1-2-1.8-3.5-1.8-2.5 0-4.5 2-4.5 4.5 0 5 8 10.5 8 10.5s8-5.5 8-10.5z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
	travel: (
		<svg
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="white"
			strokeWidth="1.8"
		>
			<title>travel</title>
			<path
				d="M21 16v-2l-8-5V4a1.5 1.5 0 00-3 0v5l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L11 19v-5.5z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
};

function ProductBlock({
	icon,
	title,
	children,
}: PropsWithChildren<{ icon: keyof typeof icons; title: string }>) {
	return (
		<div className="flex items-start gap-2.5 mb-2 break-inside-avoid">
			<div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
				{icons[icon]}
			</div>
			<div>
				<p className="text-[11px] font-bold text-white m-0 mb-0.5">{title}</p>
				<p className="text-[10px] leading-[14px] text-[#DCE6F5] m-0">
					{children}
				</p>
			</div>
		</div>
	);
}

function TemplateWorksiteAllianz({ leadId }: { leadId?: string } = {}) {
	const urlMessage = new URL('https://segwise.com.br/worksite-allianz');

	if (leadId) {
		urlMessage.searchParams.set('leadId', leadId);
	}

	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Worksite Allianz — SEGWISE / XCAR CORRETORA</title>
				<script src="https://cdn.tailwindcss.com"></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							tailwind.config = {
								theme: {
									extend: {
										colors: {
											allianzBlue: '#141414',
											allianzBlueLight: '#F4F6FB',
											muted: '#6B7280',
										},
									},
								},
							};
						`,
					}}
				/>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
					rel="stylesheet"
				/>
				<style>{`
					body { font-family: 'Inter', Arial, sans-serif; }
					@media print {
						* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
					}
				`}</style>
			</head>
			<body className="bg-white m-0 pt-6">
				<div className="mx-auto max-w-[680px]">
					<div className="flex items-center justify-between px-10 py-3 break-inside-avoid">
						<img
							src={ALLIANZ_LOGO}
							alt="Allianz"
							width={95}
							height={24}
							className="object-contain"
						/>
						<img
							src={SEGWISE_LOGO}
							alt="SEGWISE"
							width={95}
							height={22}
							className="object-contain"
							style={{ filter: 'invert(1)' }}
						/>
					</div>
					<div className="px-10 mt-6">
						<h1 className="text-[16px] font-bold text-allianzBlue text-center leading-tight m-0 mb-3">
							Aumente o pacote de benefícios da sua empresa com o Worksite
							Allianz.
						</h1>
						<p className="text-[10.5px] leading-[15px] text-[#374151] m-0 mb-1.5">
							Olá! Tudo bem?
						</p>
						<p className="text-[10.5px] leading-[15px] text-[#374151] m-0 mb-1.5">
							Eu me chamo <b>Fernando Luiz Malheiros de Sena</b>, faço parte da{' '}
							<b>SEGWISE / XCAR CORRETORA</b> e tenho uma novidade para você
							oferecer como mais um benefício na sua empresa:{' '}
							<b>Worksite Allianz</b>. Os produtos da Allianz Seguros com mais
							desconto e vantagens exclusivas para colaboradores, extensivo a
							cônjuges, pais e filhos, em empresas com mais de 50 colaboradores.
						</p>
						<p className="text-[10.5px] leading-[15px] text-[#374151] m-0 mb-1">
							Aumente os benefícios que a sua empresa oferece para os
							colaboradores, sem custo de implementação.
						</p>
						<p className="text-[10.5px] leading-[15px] text-[#374151] m-0 mb-3">
							Seus colaboradores poderão contratar os seguintes seguros Allianz:{' '}
							<b>Auto, Moto, Residência, Vida e Viagem</b> e aproveitar a
							proteção e os benefícios exclusivos da Allianz Seguros.
						</p>
						<div className="rounded-lg overflow-hidden mb-3 mt-10 break-inside-avoid">
							<div className="bg-allianzBlueLight text-center px-6 py-3.5">
								<p className="text-[10.5px] leading-[15px] text-[#374151] m-0 mb-1">
									Parcelamento em até 10x sem juros no débito em conta corrente
									para os produtos de Auto e Moto.
								</p>
								<p className="text-[10.5px] leading-[15px] text-[#374151] m-0 mb-1">
									Para Residência, Vida e Viagem, consultar regras do Produto.
								</p>
								<p className="text-[10.5px] leading-[15px] text-[#374151] m-0">
									Temos condições especiais disponíveis.
								</p>
							</div>

							<div className="bg-allianzBlue px-6 py-4">
								<p className="text-[11px] font-bold text-white text-center uppercase tracking-wide m-0 mb-3">
									Contratando um ou mais seguros com Worksite Allianz, você
									conta com:
								</p>
								<ProductBlock icon="vehicle" title="Allianz Auto">
									Guincho com km limitada; Carro reserva com opção de voucher
									Uber; Socorro mecânico 24h no WhatsApp; Parcelamento em 10x
									sem juros (débito em conta ou cartão de crédito); E muito
									mais!
								</ProductBlock>
								<ProductBlock icon="motorcycle" title="Allianz Moto">
									Guincho com km ilimitada; Cobertura válida em todos os países
									da América do Sul; Cobertura para acessórios como baú,
									capacete e roupas especiais; Reparos residenciais gratuitos;
									Parcelamento em até 10x sem juros no cartão de crédito ou 6x
									no débito em conta; E muito mais!
								</ProductBlock>
								<ProductBlock icon="residencial" title="Allianz Residência">
									Para o segurado e seus dependentes: Assistências e coberturas
									para o segurado e extensivas a cônjuges, pais e filhos;
									Cobertura de Danos Elétricos; Indenização a valor de novo;
									Cobertura para roubo e furto; Cobertura para equipamentos
									eletrônicos; Cobertura adicional de Roubo Fora do Local
									Segurado;
								</ProductBlock>
								<ProductBlock icon="life" title="Allianz Vida">
									Seguro de Vida Individual Personalizado; Segunda opinião
									médica internacional; Descontos em medicamentos; Telemedicina;
									Reparos residenciais; Assistência pet; E muito mais!
								</ProductBlock>
								<ProductBlock icon="travel" title="Allianz Viagem">
									Vigência de até 180 dias; Modais cobertos: aéreo, marítimo e
									terrestre (ônibus rodoviário e veículo próprio) a partir de
									100km da origem; Possibilidade de estender a vigência, caso o
									segurado atenda aos requisitos; E muito mais!
								</ProductBlock>
							</div>
						</div>
						<p className="text-[11px] font-bold text-allianzBlue text-center m-0 mb-0.5">
							Com Worksite Allianz, é assim, são muito mais vantagens para seus
							colaboradores.
						</p>
						<p className="text-[10.5px] text-[#374151] text-center m-0 mb-2.5">
							Entre em contato e esclareça suas dúvidas.
						</p>
						<div className="text-center pb-3 break-inside-avoid">
							<p className="text-[10.5px] font-bold text-allianzBlue m-0">
								Fernando Luiz Malheiros de Sena
							</p>
							<p className="text-[10px] text-muted m-0">
								SEGWISE / XCAR CORRETORA &nbsp;·&nbsp; (81) 98696-1991
								&nbsp;·&nbsp; 3229-1728
							</p>
						</div>
					</div>
					<div className="bg-[#F4F6FB] px-10 py-3 border-t border-solid border-[#E5E7EB] mt-10">
						<p className="text-[10px] leading-[12px] text-muted m-0">
							Allianz Seguros S.A., CNPJ: 61.573.796/0001-66, Rua Eugênio de
							Medeiros nº 303, ands. 1-parte, 2 ao 9, 15 e 16, Pinheiros, São
							Paulo - CEP: 05425-000. Processos SUSEP nº 15414.002216/2004-57,
							15414.001289.2007-74, 15414.002283/2007-14. Consulte as Condições
							Gerais, assim como os planos de assistência 24h, serviços e
							abrangência do seguro no site www.allianz.com.br. O registro do
							produto é automático e não representa aprovação ou recomendação
							por parte da SUSEP. A aceitação do seguro está sujeita a análise
							do risco. Algumas coberturas e serviços possuem restrições,
							carência e limites diferenciados. Para saber todos os detalhes e
							conhecer a lista completa consulte o Manual do Segurado/Condições
							Gerais. Linha Direta Allianz Corretor: 4090 1120 (Capitais e
							Regiões Metropolitanas), 0800 777 8243 (demais regiões). SAC (24
							horas): 08000 115 215. Ouvidoria Allianz Seguros: 0800 771 3313.
							Atendimento à pessoa com deficiência auditiva ou de fala: 08000
							121 239. A Allianz Seguros respeita a sua privacidade e é contra o
							spam na rede. Para mais informações, acesse a Política de
							Privacidade de Dados da Allianz, disponível em:
							www.allianz.com.br/politica-de-privacidade.
						</p>
					</div>
				</div>
			</body>
		</html>
	);
}

export { TemplateWorksiteAllianz };
