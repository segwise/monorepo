import type { PropsWithChildren } from 'hono/jsx';

const LOGO_WHITE = 'https://cdn.segwise.com.br/images-public/Group%2077.svg';

const partnerInsurers = [
	{
		name: 'porto seguro',
		logo: 'https://seguros.ababas.com.br/wp-content/uploads/2023/05/porto-seguro-logo-1024x306.png',
	},
	{
		name: 'allianz',
		logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-QN2R1vV-4DFVXc4G20kUF11Rsocijhji7WDsk1vNLg&s=10',
	},
	{
		name: 'tokio marine',
		logo: 'https://brinfinite.com.br/wp-content/uploads/2022/11/logo-tokio-marine-seguradora-1024-copia.png',
	},
	{
		name: 'mapfre',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mapfre_logo.svg/500px-Mapfre_logo.svg.png?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=thumbnail',
	},
	{
		name: 'azul',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Logotipo_da_Azul_Seguros.svg?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original',
	},
	{
		name: 'bradesco seguros',
		logo: 'https://www.seguroauto.org/wp-content/themes/SA2023/images/logo_seguradora_bradesco_seguro.webp',
	},
	{
		name: 'hdi',
		logo: 'https://vamosescrever.com.br/assets/img/clients/hdi.png',
	},
	{
		name: 'itaú seguros',
		logo: 'https://vectorseek.com/wp-content/uploads/2023/09/Itau-Seguros-Logo-Vector.svg-.png',
	},
	{
		name: 'yelum',
		logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXpFdG03G9WEJl1azWKr9g_PrxNhlo6LbN7jNE7_3kBbFXXHn8WhjbOUA&s=10',
	},
	{
		name: 'suhai',
		logo: 'https://seguros.ababas.com.br/wp-content/uploads/2023/05/suhai.png',
	},
	{
		name: 'ezze seguros',
		logo: 'https://static.wixstatic.com/media/cba4e8_33d99b33ebab4ac2a8fffa1ec210240b~mv2.png/v1/fill/w_600,h_600,al_c/cba4e8_33d99b33ebab4ac2a8fffa1ec210240b~mv2.png',
	},
	{
		name: 'aliro seguro',
		logo: 'https://cdn.dealerspace.ai/lider/aquila-seguros/conteudo-online/seguradoras/aliro-seguro.png',
	},
	{
		name: 'mitsui sumitomo',
		logo: 'https://neonseguros.com.br/wp-content/uploads/2024/06/Logo-Mitsui-Sumitomo.png',
	},
	{
		name: 'novo seguros',
		logo: 'https://www.gruporesenderibeiro.com.br/logos/novo-seguros.png',
	},
	{
		name: 'usebens',
		logo: 'https://parceiro.usebens.com.br/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-usebens-login-filled.de22e6d8.png&w=750&q=75',
	},
	{
		name: 'justos seguros',
		logo: 'https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/7ba73aaa-3da9-4cf1-abf2-ccc85dea5875/uid_28112/Logos%20seguradoras-Mari%20%28site%29%20%20%20%287%29_3.png',
	},
];

function InsurerLogoGrid() {
	return (
		<div className="grid grid-cols-8 gap-1">
			{partnerInsurers.map((insurer) => (
				<div
					key={insurer.name}
					className="border border-solid border-[#E5E7EB] rounded py-1 px-1 flex items-center justify-center"
				>
					<img
						src={insurer.logo}
						alt={insurer.name}
						width={40}
						height={15}
						className="object-contain"
					/>
				</div>
			))}
		</div>
	);
}

function SectionTitle({ children }: PropsWithChildren) {
	return (
		<h2 className="text-[12px] font-bold text-primary tracking-wide uppercase m-0 mb-2 pb-1.5 border-b border-solid border-[#D1D5DB]">
			{children}
		</h2>
	);
}

function BulletItem({ children }: PropsWithChildren) {
	return (
		<div className="flex items-start gap-2 mb-0.5">
			<span className="text-[11px] text-[#9CA3AF] leading-[15px]">–</span>
			<p className="text-[11px] leading-[15px] text-[#374151] m-0">
				{children}
			</p>
		</div>
	);
}

function TemplatePartnershipInviteAccounting({
	leadId,
}: {
	leadId?: string;
} = {}) {
	const urlMessage = new URL('https://segwise.com.br/gestao-protecao');
	if (leadId) urlMessage.searchParams.set('leadId', leadId);

	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>
					Gestão + Proteção — Escritório de Contabilidade | SEGWISE / XCAR
				</title>
				<script src="https://cdn.tailwindcss.com"></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							tailwind.config = {
								theme: {
									extend: {
										colors: {
											primary: '#09090b',
											primaryDark: '#FF6900',
											surface: '#F4F6FB',
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
			<body className="bg-white m-0">
				<div className="mx-auto max-w-[680px]">
					<div className="flex items-center justify-between bg-primary px-10 py-4 break-inside-avoid">
						<img
							src={LOGO_WHITE}
							alt="SEGWISE / XCAR CORRETORA DE SEGUROS"
							width={120}
							height={27}
						/>
						<span className="text-[10px] tracking-wide text-[#9CA3AF] uppercase">
							Proposta de parceria comercial
						</span>
					</div>
					<div className="px-10 pt-5 pb-5">
						{/* Data e destinatário — formato carta, como no texto original */}
						<p className="text-[11px] text-[#374151] text-right m-0 mb-5">
							Recife, ______ de __________________ de 2026.
						</p>
						<p className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
							Ao Sr.(a) Responsável por novos negócios contadores/escritório de
							contabilidade
						</p>
						<p className="text-[11px] text-[#374151] m-0 mb-4">
							Prezado(a) Senhor(a),
						</p>

						<h1 className="text-[16px] font-bold text-primary m-0 mb-4 leading-tight">
							Uma ótima oportunidade de levar benefícios aos clientes sob Gestão
							de sua empresa
						</h1>

						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-3">
							Meu nome é <b>Fernando Luiz Malheiros de Sena</b>, diretor da{' '}
							<b>Xcar Corretora de Seguros</b> e gostaria, em parceria com sua
							empresa, oferecer o programa: <b>GESTÃO + PROTEÇÃO</b> – conheça
							os benefícios
						</p>

						<div className="mb-3 break-inside-avoid">
							<SectionTitle>1) Benefícios aos clientes</SectionTitle>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
								Acesso ao aplicativo - segwise
							</p>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
								Um aplicativo verdadeiramente relevante que vem para ampliar os
								benefícios que sua empresa já oferece, funcionando como um
								assistente de bolso, centralizando serviços e informações
								essências como os descritos abaixo:
							</p>
							<BulletItem>
								<b>EVITAR NEGATIVA DE SINISTRO</b> – orientações sobre temas
								como: Principal Condutor, CEP de pernoite, cobertura para
								conditores entre 18 a 25 anos de idade, deveres do segurado,
								recusa da apólice.........
							</BulletItem>
							<BulletItem>
								<b>CONSULTA VEICULAR</b> – Informações sobre: Valor médio da
								FIPE – multas – gravames – infrações – débitos – IPVA -
								licenciamentos – DPVAT – roubo – sinistros
							</BulletItem>
							<BulletItem>
								<b>ASSISTÊNCIAS</b> – telefones para solicitar um reboque, abrir
								um sinistro, solicitar substituição de vidros, faróis e
								lanternas, etc
							</BulletItem>
							<BulletItem>
								<b>ORIENTAÇÃO NO SINISTRO</b> – como agir, para onde ligar, o
								que fazer e se houver vítima...
							</BulletItem>
							<BulletItem>
								<b>DESCONTOS EXCLUSIVOS</b> – na aquisição ou renovação de
								seguros
							</BulletItem>
						</div>

						<div className="mb-4 break-inside-avoid">
							<SectionTitle>
								2) Benefícios ao escritório de contabilidade
							</SectionTitle>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
								Acesso ao aplicativo - parceiro
							</p>
							<BulletItem>
								Aplicativo dedicado a administradora, com demonstrativo do
								número de adesões e ao relatório financeiro decorrentes das
								indicações, e aos direitos conforme abaixo:
							</BulletItem>
							<BulletItem>
								<b>COMISSIONAMENTO VITALÍCIO</b> – percentual dos ganhos da
								corretora decorrente da indicação dos clientes que resulte na
								efetiva contratação de seguros.
							</BulletItem>
							<BulletItem>
								<b>CUSTO DE IMPLANTAÇÃO</b> – sem qualquer custo financeiro ou
								laboral
							</BulletItem>
						</div>

						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-4">
							Coloco-me à disposição para esclarecer eventuais dúvidas e
							apresentar mais detalhes sobre o programa.
						</p>

						{/* Fechamento — Atenciosamente + assinatura, como no texto original */}
						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-4">
							Atenciosamente,
						</p>

						<div className="pt-16 border-t border-solid border-[#D1D5DB] break-inside-avoid">
							<p className="text-[11px] leading-[15px] text-[#374151] m-0">
								Fernando Luiz Malheiros de Sena
							</p>
							<p className="text-[11px] leading-[15px] text-muted m-0">
								Diretor Geral
							</p>
							<p className="text-[11px] leading-[15px] text-muted m-0 mb-3">
								Fones: 81.98696.1991 &nbsp;-&nbsp; 81.3229.1728
							</p>
							<p className="text-[11px] leading-[15px] text-muted m-0 mb-3">
								XCAR Corretora de Seguros
							</p>
							<p className="text-[9px] tracking-wide text-muted uppercase m-0 mb-1.5">
								Seguradoras parceiras
							</p>
							<InsurerLogoGrid />
						</div>
					</div>
					<div className="px-10 py-4 border-t border-solid border-[#E5E7EB] flex items-center justify-between">
						<span className="text-[10px] text-muted">
							SEGWISE / XCAR CORRETORA DE SEGUROS
						</span>
						<span className="text-[10px] text-muted">segwise.com.br</span>
					</div>
				</div>
			</body>
		</html>
	);
}

export { TemplatePartnershipInviteAccounting };
