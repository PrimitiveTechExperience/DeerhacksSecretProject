import { NextResponse } from 'next/server';
import type { CoachResponse } from '@/lib/types';
import {
	generateGeminiContent,
	hasGeminiApiKey,
	parseGeminiJson,
	normalizeLatexContent,
} from '@/lib/ai/gemini';

const DEMO_RESPONSE: CoachResponse = {
	title: 'S-Bend Configuration Detected',
	what_changed: [
		'Segment 1 curves with moderate curvature (\u03BA\u2081 = 2.0) in the default direction',
		'Segment 2 mirrors with opposite bend direction (\u03C6\u2082 = 180\u00B0), creating an S-shape',
		'Both segments maintain equal length (L = 0.5 m) for a symmetric profile',
	],
	how_it_moves:
		'The robot forms a smooth S-curve in 3D space. Segment 1 bends in the positive direction while Segment 2 reverses, creating a sinusoidal path. This configuration is excellent for navigating around obstacles or reaching targets offset from the base axis.',
	math_deep_dive: `### Forward Kinematics

Each segment of a constant-curvature continuum robot traces a **circular arc** in 3D space. The transformation from configuration space to task space is given by:

$$
T_i = \\begin{bmatrix} \\cos\\phi_i(\\cos\\kappa_i L_i - 1) & -\\sin\\phi_i & \\cos\\phi_i \\sin\\kappa_i L_i & \\frac{\\cos\\phi_i(\\cos\\kappa_i L_i - 1)}{\\kappa_i} \\\\ \\sin\\phi_i(\\cos\\kappa_i L_i - 1) & \\cos\\phi_i & \\sin\\phi_i \\sin\\kappa_i L_i & \\frac{\\sin\\phi_i(\\cos\\kappa_i L_i - 1)}{\\kappa_i} \\\\ 0 & 0 & \\cos\\kappa_i L_i & \\frac{\\sin\\kappa_i L_i}{\\kappa_i} \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}
$$

For your current S-bend with $\\kappa_1 = 2.0$, $\\phi_1 = 0°$, $\\kappa_2 = 2.0$, $\\phi_2 = 180°$:

The **radius of curvature** for each segment is:

$$
r_i = \\frac{1}{\\kappa_i} = \\frac{1}{2.0} = 0.5 \\text{ m}
$$

The **arc angle** subtended by each segment:

$$
\\theta_i = \\kappa_i \\cdot L_i = 2.0 \\times 0.5 = 1.0 \\text{ rad} \\approx 57.3°
$$

### Why it makes an S-shape

Since $\\phi_2 = \\phi_1 + 180°$, the second segment bends in the **opposite direction** relative to the first. The total tip position is found by composing the transforms:

$$
T_{tip} = T_1 \\cdot T_2
$$

The vertical reach is *reduced* compared to a straight arm because the segments partially cancel, but the **lateral reach increases** --- ideal for obstacle avoidance.`,
	one_tip:
		'Try increasing \u03BA\u2081 while decreasing \u03BA\u2082 to create an asymmetric S-bend. This helps the tip reach further to one side while maintaining a compact profile near the base.',
	safety_note:
		'High curvature values (above 8.0) on both segments simultaneously can cause self-intersection. Monitor the visual carefully at extreme settings.',
	short_voice_script:
		'Your robot is in an S-bend configuration. Segment one curves forward while segment two curves back in the opposite direction, creating a smooth S-shape. This is great for navigating around obstacles. Try adjusting the curvature values asymmetrically for even more reach.',
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { kappa1, phi1, L1, kappa2, phi2, L2, voiceStyle } = body;

		if (!hasGeminiApiKey()) {
			// Return demo response when no API key is configured
			return NextResponse.json(DEMO_RESPONSE);
		}

		const prompt = `You are an expert continuum robotics tutor. A student is controlling a 2-segment continuum robot with these parameters:

Segment 1: curvature=${kappa1} (1/m), bend_direction=${phi1} (degrees), length=${L1} (m)
Segment 2: curvature=${kappa2} (1/m), bend_direction=${phi2} (degrees), length=${L2} (m)

Voice style: ${voiceStyle || 'friendly'}

Analyze this configuration and respond in JSON format with exactly these fields:
{
  "title": "A short descriptive title of the configuration",
  "what_changed": ["Array of 2-3 bullet points about what's notable in the current settings. You may use inline LaTeX like $\\kappa_1$ when useful."],
  "how_it_moves": "A paragraph explaining the robot's shape and motion in 3D space. Markdown + inline LaTeX allowed.",
  "math_deep_dive": "A markdown string with LaTeX equations (using $...$ for inline and $$...$$ for block math) explaining the forward kinematics, curvature math, and any relevant formulas for this specific configuration. Include the homogeneous transformation matrix, radius of curvature, arc angle, and tip position analysis. Use ### headings to organize sections.",
  "one_tip": "A practical tip for the student to try next. Markdown + inline LaTeX allowed.",
  "safety_note": "Optional safety warning if relevant, or null. Markdown + inline LaTeX allowed.",
  "short_voice_script": "A 2-3 sentence narration script suitable for text-to-speech"
}

Respond ONLY with valid JSON, no markdown or code fences. Make sure that the JSON is properly escaped and parsable. Focus on providing clear, concise insights that are specific to the given curvature and bend directions.`;

		const text = await generateGeminiContent({
			parts: [{ text: prompt }],
			temperature: 0.7,
			maxOutputTokens: 2048,
		});

		if (!text) {
			return NextResponse.json(DEMO_RESPONSE);
		}

		const parsed = parseGeminiJson<CoachResponse>(text);
		if (!parsed) {
			console.warn(
				'Gemini coach response was not valid JSON. Returning demo response.',
			);
			return NextResponse.json(DEMO_RESPONSE);
		}

		parsed.math_deep_dive =
			normalizeLatexContent(parsed.math_deep_dive) ?? parsed.math_deep_dive;

		return NextResponse.json(parsed);
	} catch (err) {
		console.error('Coach API error:', err);
		return NextResponse.json(DEMO_RESPONSE);
	}
}
