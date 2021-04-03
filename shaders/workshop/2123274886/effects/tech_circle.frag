#define M_PI 3.1415926535897932384626433832795

#define CARTESIAN 0
#define POLAR 1

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform vec4 g_Texture0Resolution;
uniform float g_Time;
varying vec4 v_TexCoord;

// [COMBO] {"material": "Coordinate System", "combo":"COORD_SYS","type":"options","default":1, "options":{"Cartesian":0,"Polar":1}}
// [COMBO] {"material":"Ring Segments","combo":"RING_SEGMENTS","type":"options","default":0, "options":{"No Segmentation":0, "Segmentation": 1}}
// [COMBO] {"material":"Sector Segments","combo":"SECTOR_SEGMENTS","type":"options","default":0,"options":{"None":0,"Cartesian Rectangles":1,"Polar Rectangles":2}}
// [COMBO] {"material":"Ratio Correction","combo":"RATIO_CORRECTION","type":"options","default":0}

uniform vec3 color;		// {"default":"1 1 1","label":"Color","material":"ui_editor_properties_1_color","order":"1","type":"color"}
uniform float alpha;	// {"default":"1.0","label":"Alpha","material":"ui_editor_properties_2_alpha","order":"2","range":[0.0,1.0]}
uniform float speed;	// {"default":"0.1","label":"Speed","material":"ui_editor_properties_3_speed","range":[-3.0,3.0]}
uniform float skew;		// {"default":"0.0","label":"Skew","material":"ui_editor_properties_6_skew","range":[-1.0,1.0]}

uniform float ringRadius;		// {"default":"0.5","label":"Ring Radius","material":"ui_editor_properties_4_ring_1_radius","range":[0.0,1.0]}
uniform float ringWidth;		// {"default":"0.2","label":"Ring Thickness","material":"ui_editor_properties_4_ring_1_width","range":[0.0,1.0]}
uniform float ringSegmentCount;	// {"default":"2","int":true,"label":"Ring Segment Count","material":"ui_editor_properties_4_ring_2_segment_count","range":[2,100]}
uniform float ringSegmentWidth;	// {"default":"0.25","label":"Ring Segment Width","material":"ui_editor_properties_4_ring_2_segment_width","range":[0.0,1.0]}

uniform float sectorOffset;			// {"default":"0.0","label":"Sector Offset","material":"ui_editor_properties_5_sector_1_offset","range":[0.0,1.0]}
uniform float sectorWidth;			// {"default":"0.3","label":"Sector Width","material":"ui_editor_properties_5_sector_1_width","range":[0.0,1.0]}
uniform float sectorSegmentCount;	// {"default":"5","int":true,"label":"Sector Segment Count","material":"ui_editor_properties_5_sector_segment_count","range":[2,100]}
uniform float sectorSegmentWidth;	// {"default":"0.75","label":"Sector Segment Width","material":"ui_editor_properties_5_sector_segment_width","range":[0.0,1.0]}

float mod(float x, float y) {
    return x - y * floor(x/y);
}

float linstep(float x0, float x1, float xn)
{
	return max(min((xn - x0) / (x1 - x0), 1.), 0.);
}

float saw(float x) {
    return abs(mod(x * 2. + 1., 2.) - 1.);
}

float simpleStripes(float c, float thresh, float x) {
    float t = 1.- thresh;
    
    return step(t, saw(x * c)) * float(x >= 0.) * float(x <= 1.);
}

float slopedStripes(float c, float t, float slopeStr, float x) {
    float s = slopeStr * t * 2.;
    t = 1. - t;
    
    return linstep(t - s / 2., t + s / 2., saw(x * c));
}




float ring(float dist, float width, float stripeCount, float stripeThresh, vec2 puv) {
    return simpleStripes(stripeCount, stripeThresh, (puv.x - dist + width/2) / width);//*/
}

float sector(float pos, float width, float stripeCount, float stripeThresh, vec2 puv) {
	float sector = frac(puv.y - frac(pos - width / 2.));
	return simpleStripes(stripeCount, stripeThresh, sector / width);
}

void main() {

	vec4 background = texSample2D(g_Texture0, v_TexCoord.xy);

		#if COORD_SYS == CARTESIAN
		vec2 uv = v_TexCoord.xy;
        #if RATIO_CORRECTION == 1
            uv /= vec2(1, g_Texture0Resolution.x / g_Texture0Resolution.y);
        #endif
	#endif
	#if COORD_SYS == POLAR
		vec2 uv = (v_TexCoord.xy - 0.5);
        #if RATIO_CORRECTION == 1
            uv /= vec2(1, g_Texture0Resolution.x / g_Texture0Resolution.y);
        #endif
		uv = vec2(length(uv) * 2, atan2(uv.x, uv.y) / (M_PI * 2) + 0.5);
	#endif

	// skew calculations
	float centerPerimeter = ringRadius * 2 * M_PI;
	float currentPerimeter = uv.x * 2 * M_PI;
	float pRatio = currentPerimeter / centerPerimeter;
	uv.y += ((uv.x - ringRadius) / ringWidth / pRatio) * skew;

	float t = g_Time;


	#if RING_SEGMENTS == 1
		float r = ring(ringRadius, ringWidth, ringSegmentCount, ringSegmentWidth, uv);
	#else
		float r = ring(ringRadius, ringWidth, 1, 1, uv);
	#endif

	float sectorPos = sectorOffset + t * speed;
	#if SECTOR_SEGMENTS == 0
		float s = sector(sectorPos, sectorWidth, 1, 1, uv);
	#endif
	#if SECTOR_SEGMENTS == 1
		float s = sector(sectorPos, sectorWidth, sectorSegmentCount, sectorSegmentWidth, uv);
	#endif
	#if SECTOR_SEGMENTS == 2
		float s = sector(sectorPos, sectorWidth, sectorSegmentCount, sectorSegmentWidth / pRatio, uv);
	#endif

	float ringSector = r * s;
	float finalAlpha = ringSector * alpha;

	gl_FragColor = (1 - finalAlpha) * background + vec4(finalAlpha * color, 1);
}
