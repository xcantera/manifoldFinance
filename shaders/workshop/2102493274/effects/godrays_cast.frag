
// [COMBO] {"material":"ui_editor_properties_cast_type","combo":"CASTER","type":"options","default":0,"options":{"Radial":0,"Directional":1}}
// [COMBO] {"material":"ui_editor_properties_quality","combo":"SAMPLES","type":"options","default":0,"options":{"30":0,"50":1}}

#include "common.h"

varying vec2 v_TexCoord;

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}

uniform float g_Length; // {"material":"raylength","label":"ui_editor_properties_ray_length","default":0.5,"range":[0.01, 1]}
uniform float g_Intensity; // {"material":"rayintensity","label":"ui_editor_properties_ray_intensity","default":1,"range":[0.01, 2.0]}
uniform vec3 g_ColorRays; // {"default":"1 1 1","label":"ui_editor_properties_color","material":"color","type":"color"}

#if CASTER == 0
uniform vec2 g_Center; // {"default":"0.5 0.5","label":"ui_editor_properties_center","material":"center","position":true}
#else
uniform float g_Direction; // {"material":"direction","label":"ui_editor_properties_direction","default":0,"range":[0,6.28]}
#endif

void main() {

	vec2 texCoords = v_TexCoord;
	vec4 albedo = CAST4(0.0);
	
#if CASTER == 0
	vec2 direction = g_Center - texCoords;
#else
	vec2 direction = rotateVec2(vec2(0, -0.5), g_Direction);
#endif
	
	float dist = length(direction);
	direction /= dist;
	
	dist *= g_Length;
	texCoords += direction * dist;
	
#if SAMPLES == 0
	const int sampleCount = 30;
	const float sampleIntensity = 0.1;
#endif
#if SAMPLES == 1
	const int sampleCount = 50;
	const float sampleIntensity = 0.1 * (30 / 50.0);
#endif
	const float sampleDrop = sampleCount - 1;
	
	direction = direction * dist / sampleDrop;
	for (int i = 0; i < sampleCount; ++i)
	{
		vec4 sample = texSample2D(g_Texture0, texCoords);
		texCoords -= direction;
		albedo += sample * (i / sampleDrop);
	}
	
	albedo.rgb *= g_ColorRays;
	gl_FragColor = g_Intensity * sampleIntensity * albedo;
}
