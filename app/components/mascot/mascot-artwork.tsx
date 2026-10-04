import Svg, {
	Circle,
	ClipPath,
	Defs,
	Ellipse,
	G,
	LinearGradient,
	Path,
	RadialGradient,
	Rect,
	Stop,
	Use,
} from 'react-native-svg';

import artwork from '@assets/images/mascot-artwork.json';

const BODY_PATH =
	'M256 90C326 90 382 126 390 200c6 62 6 122-8 162-16 42-62 58-126 58s-110-16-126-58c-14-40-14-100-8-162C130 126 186 90 256 90Z';
const MIRROR = 'matrix(-1 0 0 1 512 0)';

/** 마스코트 그림 컴포넌트 */
const MascotArtwork = () => {
	return (
		<Svg width="100%" height="100%" viewBox="0 0 512 512">
			<Defs>
				<ClipPath id="body-clip">
					<Path d={BODY_PATH} />
				</ClipPath>

				<RadialGradient id="body" cx="0.48" cy="0.18" r="0.9">
					<Stop offset="0" stopColor={artwork.body[0]} />
					<Stop offset="0.55" stopColor={artwork.body[1]} />
					<Stop offset="1" stopColor={artwork.body[2]} />
				</RadialGradient>
				<RadialGradient id="body-edge" cx="0.5" cy="0.42" r="0.62">
					<Stop offset="0.72" stopColor={artwork.bodyEdge} stopOpacity={0} />
					<Stop offset="1" stopColor={artwork.bodyEdge} stopOpacity={0.08} />
				</RadialGradient>
				<RadialGradient id="sheen" cx="0.5" cy="0.5" r="0.5">
					<Stop offset="0" stopColor={artwork.highlight} stopOpacity={0.06} />
					<Stop offset="1" stopColor={artwork.highlight} stopOpacity={0} />
				</RadialGradient>
				<LinearGradient id="wing" x1="0" y1="0.2" x2="1" y2="0.6">
					<Stop offset="0" stopColor={artwork.wing[0]} />
					<Stop offset="0.6" stopColor={artwork.wing[1]} />
					<Stop offset="1" stopColor={artwork.wing[2]} />
				</LinearGradient>
				<LinearGradient id="belly" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={artwork.belly[0]} />
					<Stop offset="0.5" stopColor={artwork.belly[1]} />
					<Stop offset="1" stopColor={artwork.belly[2]} />
				</LinearGradient>

				<LinearGradient id="band" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={artwork.band[0]} />
					<Stop offset="1" stopColor={artwork.band[1]} />
				</LinearGradient>
				<LinearGradient id="shell" x1="0" y1="0" x2="1" y2="0">
					<Stop offset="0" stopColor={artwork.shell[0]} />
					<Stop offset="0.5" stopColor={artwork.shell[1]} />
					<Stop offset="1" stopColor={artwork.shell[2]} />
				</LinearGradient>
				<LinearGradient id="cushion" x1="0" y1="0" x2="1" y2="0">
					<Stop offset="0" stopColor={artwork.cushion[0]} />
					<Stop offset="0.45" stopColor={artwork.cushion[1]} />
					<Stop offset="1" stopColor={artwork.cushion[2]} />
				</LinearGradient>
				<RadialGradient id="contact" cx="0.5" cy="0.5" r="0.5">
					<Stop offset="0" stopColor={artwork.contact} stopOpacity={0.18} />
					<Stop offset="1" stopColor={artwork.contact} stopOpacity={0} />
				</RadialGradient>

				<RadialGradient id="eye" cx="0.45" cy="0.4" r="0.62">
					<Stop offset="0.6" stopColor={artwork.eye[0]} />
					<Stop offset="1" stopColor={artwork.eye[1]} />
				</RadialGradient>
				<RadialGradient id="pupil" cx="0.4" cy="0.3" r="0.8">
					<Stop offset="0" stopColor={artwork.pupil[0]} />
					<Stop offset="1" stopColor={artwork.pupil[1]} />
				</RadialGradient>

				<RadialGradient id="beak" cx="0.42" cy="0.22" r="0.85">
					<Stop offset="0" stopColor={artwork.beak[0]} />
					<Stop offset="0.55" stopColor={artwork.beak[1]} />
					<Stop offset="1" stopColor={artwork.beak[2]} />
				</RadialGradient>
				<LinearGradient id="tongue" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={artwork.tongue[0]} />
					<Stop offset="1" stopColor={artwork.tongue[1]} />
				</LinearGradient>

				<RadialGradient id="toe" cx="0.4" cy="0.32" r="0.72">
					<Stop offset="0" stopColor={artwork.toe[0]} />
					<Stop offset="0.65" stopColor={artwork.toe[1]} />
					<Stop offset="1" stopColor={artwork.toe[2]} />
				</RadialGradient>
				<RadialGradient id="toe-front" cx="0.34" cy="0.3" r="0.82">
					<Stop offset="0" stopColor={artwork.toeFront[0]} />
					<Stop offset="0.55" stopColor={artwork.toeFront[1]} />
					<Stop offset="1" stopColor={artwork.toeFront[2]} />
				</RadialGradient>
				<LinearGradient id="leg" x1="0" y1="0" x2="1" y2="0">
					<Stop offset="0" stopColor={artwork.leg[0]} />
					<Stop offset="0.45" stopColor={artwork.leg[1]} />
					<Stop offset="1" stopColor={artwork.leg[2]} />
				</LinearGradient>
				<LinearGradient id="leg-shade" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={artwork.legShade} stopOpacity={0.22} />
					<Stop offset="0.6" stopColor={artwork.legShade} stopOpacity={0} />
				</LinearGradient>
				<RadialGradient id="toe-shade" cx="0.5" cy="0.5" r="0.5">
					<Stop offset="0" stopColor={artwork.toeShade} stopOpacity={0.2} />
					<Stop offset="1" stopColor={artwork.toeShade} stopOpacity={0} />
				</RadialGradient>
			</Defs>

			{/*헤드폰 머리띠*/}
			<Path
				d="M124 168C122 102 182 69 256 69s134 33 132 99"
				fill="none"
				stroke="url(#band)"
				strokeWidth={16}
				strokeLinecap="round"
			/>
			<Path
				d="M129 150C136 98 190 64 256 64s120 34 127 86"
				fill="none"
				stroke={artwork.highlight}
				strokeOpacity={0.04}
				strokeWidth={3}
				strokeLinecap="round"
			/>

			{/*발*/}
			<G id="foot-left">
				<Rect x={191} y={404} width={28} height={30} fill="url(#leg)" />
				<Rect x={191} y={404} width={28} height={30} fill="url(#leg-shade)" />
				<Ellipse cx={205} cy={432} rx={15} ry={5} fill="url(#toe-shade)" />
				<Ellipse cx={184} cy={436.5} rx={14.5} ry={10} transform="rotate(-10 184 436.5)" fill="url(#toe)" />
				<Ellipse cx={194} cy={437} rx={5} ry={6} fill="url(#toe-shade)" />
				<Ellipse cx={207} cy={439} rx={14.5} ry={10} transform="rotate(-8 207 439)" fill="url(#toe-front)" />
			</G>
			<Use href="#foot-left" transform={MIRROR} />

			{/*몸과 배*/}
			<Path d={BODY_PATH} fill="url(#body)" />
			<Path
				d="M132 398C140 340 200 310 256 310s116 30 124 88v42H132Z"
				fill="url(#belly)"
				clipPath="url(#body-clip)"
			/>
			<Path d={BODY_PATH} fill="url(#body-edge)" />
			<Ellipse cx={240} cy={122} rx={70} ry={30} fill="url(#sheen)" />

			{/*이어컵이 머리에 닿는 자리의 그림자*/}
			<Ellipse cx={154} cy={192} rx={12} ry={46} fill="url(#contact)" />
			<Ellipse cx={358} cy={192} rx={12} ry={46} fill="url(#contact)" />

			{/*날개*/}
			<G id="wing-left">
				<Ellipse cx={110} cy={288} rx={24} ry={60} transform="rotate(24 110 288)" fill="url(#wing)" />
			</G>
			<Use href="#wing-left" transform={MIRROR} />

			{/*헤드폰 이어컵*/}
			<G id="cup-left">
				<Rect x={116} y={145} width={33} height={90} rx={15} fill="url(#cushion)" />
				<Rect x={100} y={150} width={27} height={80} rx={13} fill="url(#shell)" />
				<Path
					d="M127 158v64"
					stroke={artwork.cupSeam}
					strokeOpacity={0.35}
					strokeWidth={2}
					strokeLinecap="round"
				/>
				<Rect x={105} y={158} width={5} height={44} rx={2.5} fill={artwork.highlight} fillOpacity={0.04} />
			</G>
			<Use href="#cup-left" transform={MIRROR} />

			{/*눈*/}
			<Ellipse cx={198.5} cy={192.5} rx={33.5} ry={46} fill="url(#eye)" />
			<Ellipse cx={313} cy={192.5} rx={33.5} ry={46} fill="url(#eye)" />
			<Ellipse cx={204.5} cy={198} rx={16} ry={23} fill="url(#pupil)" />
			<Ellipse cx={307} cy={198} rx={16} ry={23} fill="url(#pupil)" />
			<Circle cx={209.5} cy={187.5} r={6.5} fill={artwork.highlight} />
			<Circle cx={311.5} cy={187.5} r={6.5} fill={artwork.highlight} />

			{/*부리와 입*/}
			<Ellipse cx={257} cy={298} rx={30} ry={13} fill="url(#contact)" />
			<Path
				d="M256 198c24 0 40 16 40 40 0 24-20 50-40 63-20-13-40-39-40-63 0-24 16-40 40-40Z"
				fill="url(#beak)"
			/>
			<Ellipse cx={246} cy={216} rx={16} ry={8} fill={artwork.highlight} fillOpacity={0.03} />
			<Path d="M234 258c12-4 32-4 44 0 2 16-8 29-22 35-14-6-24-19-22-35Z" fill={artwork.mouth} />
			<Path d="M238 266c8-4 28-4 36 0 0 13-8 22-18 25-10-3-18-12-18-25Z" fill="url(#tongue)" />
			<Path
				d="M256 268v14"
				stroke={artwork.tongueLine}
				strokeOpacity={0.6}
				strokeWidth={1.6}
				strokeLinecap="round"
			/>
		</Svg>
	);
};

export default MascotArtwork;
