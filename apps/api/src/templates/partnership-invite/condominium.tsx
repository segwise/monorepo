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
		logo: 'https://mo4web.com.br/wp-content/uploads/2025/06/B.png',
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
		logo: 'https://cdn.prod.website-files.com/63bdbbd2c764e85f370a866e/65b0678c2788500d8aaf36ee_justons-new-black.svg',
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

// Título de seção: linha divisória + texto, sem numeração decorativa nem cor de destaque
function SectionTitle({ children }: PropsWithChildren) {
	return (
		<h2 className="text-[12px] font-bold text-primary tracking-wide uppercase m-0 mb-2 pb-1.5 border-b border-solid border-[#D1D5DB]">
			{children}
		</h2>
	);
}

// Bullet neutro — traço cinza, sem marcador colorido
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

function TemplatePartnershipInviteCondominium({
	leadId,
}: {
	leadId?: string;
} = {}) {
	const urlMessage = new URL('https://segwise.com.br/nova-parceria');
	if (leadId) urlMessage.searchParams.set('leadId', leadId);

	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>
					Parceria comercial — Administradora de condomínio | SEGWISE / XCAR
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
					{/* Cabeçalho — faixa preta compacta, só altura suficiente pro logo */}
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
						<h1 className="text-[18px] font-bold text-primary m-0 mb-0.5 leading-tight">
							Parceria comercial
						</h1>
						<p className="text-[12px] font-semibold text-[#4B5563] m-0 mb-3">
							Administradora de condomínio <br /> SEGWISE / XCAR Corretora de
							Seguros
						</p>

						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
							Somos da SEGWISE / XCAR CORRETORA DE SEGUROS, empresa com mais de
							12 anos no mercado segurador, e gostaria de convidar você para uma
							ação conjunta na proteção financeira e tranquilidade dos
							condôminos dos edifícios sob sua gestão.
						</p>
						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
							Com o programa – Gestão + Proteção, você levará descontos,
							conhecimento e benefícios aos condôminos sem qualquer custo nesta
							operação.
						</p>
						<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-3">
							Abaixo, nossa proposta:
						</p>

						{/* Seção 1 — texto corrido, sem card */}
						<div className="mb-3 break-inside-avoid">
							<SectionTitle>Benefícios para sua empresa</SectionTitle>
							<BulletItem>
								Comissionamento de <b>____%</b> do ganho da corretora decorrente
								da indicação de condôminos que resulte na efetiva contratação de
								seguros através da indicação.
							</BulletItem>
							<BulletItem>
								Comissionamento <b>vitalício</b>: mesmo que o condômino deixe
								seu escritório, por qualquer motivo, você continua sendo o
								beneficiário enquanto este cliente estiver segurado na SEGWISE /
								XCAR.
							</BulletItem>
							<BulletItem>
								O cliente, mesmo que no primeiro momento não faça adesão ao
								seguro, continuará recebendo ofertas com preços promocionais — e
								a qualquer época que faça a adesão, a administradora mantém o
								direito ao comissionamento vitalício de <b>___%</b> sobre o
								ganho trazido à corretora.
							</BulletItem>
							<BulletItem>
								A administradora do condomínio receberá todo o apoio necessário
								à divulgação da parceria, sem qualquer custo — apenas ganhos
								advindos dos seguros adquiridos pelos clientes da
								administradora.
							</BulletItem>
							<BulletItem>
								Demonstrativo em tempo real das adesões ao aplicativo
								disponibilizado aos condôminos. Uma vez cadastrado em nome da
								administradora, o cadastro permanece vinculado a quem o
								originou, mesmo sem vínculo posterior.
							</BulletItem>
							<BulletItem>
								Benefícios com parcerias que geram diminuição de custos para os
								condôminos e aumento de receita para a administradora.
							</BulletItem>
						</div>

						{/* Seção 2 */}
						<div className="mb-4 break-inside-avoid">
							<SectionTitle>Benefícios para os condôminos</SectionTitle>
							<p className="text-[11px] leading-[15px] text-[#374151] m-0 mb-1.5">
								Acesso ao aplicativo SEGWISE: um assistente de bolso que
								centraliza serviços e informações essenciais, como:
							</p>
							<BulletItem>
								Desconto exclusivo na aquisição ou renovação de seguros.
							</BulletItem>
							<BulletItem>Orçamentos grátis e sem compromisso.</BulletItem>
							<BulletItem>
								Orientação sobre qual ação tomar em cada tipo de sinistro.
							</BulletItem>
							<BulletItem>
								Como agir, para onde ligar e o que fazer em caso de vítima.
							</BulletItem>
						</div>

						{/* Contato + CTA — discreto, texto corrido com botão inline, sem caixa preta */}
						<div className="pt-20 border-t border-solid border-[#D1D5DB] break-inside-avoid">
							<p className="text-[11px] leading-[15px] text-[#374151] m-0">
								Fernando Luiz Malheiros de Sena — Diretor Geral
							</p>
							<p className="text-[11px] leading-[15px] text-muted m-0 mb-3">
								SEGWISE / XCAR Corretora de Seguros &nbsp;·&nbsp; (81)
								98696-1991 &nbsp;·&nbsp; 3229-1728
							</p>

							<p className="text-[9px] tracking-wide text-muted uppercase m-0 mb-1.5">
								Seguradoras parceiras
							</p>
							<InsurerLogoGrid />
						</div>
					</div>

					{/* Rodapé — linha só, sem bloco colorido */}
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

export { TemplatePartnershipInviteCondominium };
