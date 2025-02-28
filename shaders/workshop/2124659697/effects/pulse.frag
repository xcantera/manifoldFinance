
// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":9}
// [COMBO] {"material":"ui_editor_properties_pulse_alpha","combo":"PULSEALPHA","type":"options","default":0}
// [COMBO] {"material":"ui_editor_properties_pulse_color","combo":"PULSECOLOR","type":"options","default":1}

#include "common_blending.h"

varying vec4 v_TexCoord;

#if AUDIOPROCESSING
varying float v_AudioPulse;
#endif

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"default":"util/noise","label":"ui_editor_properties_noise","material":"noise"}

#if MASK == 1
uniform sampler2D g_Texture2; // {"combo":"MASK","default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"0 0 0 1"}
#endif

uniform float g_Time;

uniform float g_PulseSpeed; // {"material":"speed","label":"ui_editor_properties_pulse_speed","default":3,"range":[0,10]}
uniform float g_PulsePhase; // {"material":"phase","label":"ui_editor_properties_pulse_phase","default":0,"range":[0,6.282]}
uniform float g_PulseAmount; // {"material":"amount","label":"ui_editor_properties_pulse_amount","default":1,"range":[0,2]}
uniform vec2 g_PulseThresholds; // {"default":"0 1","label":"ui_editor_properties_pulse_bounds","material":"bounds"}

uniform float g_NoiseSpeed; // {"material":"noisespeed","label":"ui_editor_properties_noise_speed","default":0.1,"range":[0,0.5]}
uniform float g_NoiseAmount; // {"material":"noiseamount","label":"ui_editor_properties_noise_amount","default":0,"range":[0,2]}

uniform float g_Power; // {"material":"power","label":"ui_editor_properties_power","default":1,"range":[0,4]}
uniform vec3 g_TintColor1; // {"default":"1 1 1","label":"ui_editor_properties_tint_low","material":"tintlow","type":"color"}
uniform vec3 g_TintColor2; // {"default":"1 1 1","label":"ui_editor_properties_tint_high","material":"tinthigh","type":"color"}

void main() {
	vec4 sample = texSample2D(g_Texture0, v_TexCoord.xy);
	vec4 albedo = sample;
	float pulse = 0.0;
	
#if AUDIOPROCESSING
	pulse = v_AudioPulse;
#else
	pulse = smoothstep(g_PulseThresholds.x, g_PulseThresholds.y, sin(g_Time * g_PulseSpeed + g_PulsePhase) * 0.5 + 0.5) * g_PulseAmount;
	float noise = texSample2D(g_Texture1, vec2(g_Time, g_Time * 0.333) * g_NoiseSpeed).r * g_NoiseAmount;
	
	pulse += noise;
	pulse = pow(pulse, g_Power);
#endif
	
#if PULSECOLOR
	albedo.rgb = ApplyBlending(BLENDMODE, albedo.rgb * g_TintColor1, albedo.rgb * g_TintColor2, pulse);
#endif

#if PULSEALPHA
	albedo.a *= pulse;
#endif

#if MASK == 1
	float mask = texSample2D(g_Texture2, v_TexCoord.zw).r;
	albedo = mix(sample, albedo, mask);
#endif

	gl_FragColor = saturate(albedo);
}
