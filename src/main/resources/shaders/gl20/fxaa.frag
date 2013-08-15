#version 120

const float FXAA_REDUCE_MUL = 1.0 / 8.0;
const float FXAA_REDUCE_MIN = 1.0 / 128.0;
const vec2 NW = vec2(-1, -1);
const vec2 NE = vec2(1, -1);
const vec2 SW = vec2(-1, 1);
const vec2 SE = vec2(1, 1);
const vec3 LUMA = vec3(0.299, 0.587, 0.114);
const float ZERO_THIRDS_MINUS_HALF = 0.0 / 3.0 - 0.5;
const float ONE_THIRD_MINUS_HALF = 1.0 / 3.0 - 0.5;
const float TWO_THIRDS_MINUS_HALF = 2.0 / 3.0 - 0.5;
const float THREE_THIRDS_MINUS_HALF = 3.0 / 3.0 - 0.5;

varying vec2 textureUV;

uniform sampler2D diffuse;
uniform vec2 resolution;
uniform float maxSpan;

void main() {
    vec3 rgbNW = texture2D(diffuse, textureUV + NW / resolution).xyz;
    vec3 rgbNE = texture2D(diffuse, textureUV + NE / resolution).xyz;
    vec3 rgbSW = texture2D(diffuse, textureUV + SW / resolution).xyz;
    vec3 rgbSE = texture2D(diffuse, textureUV + SE / resolution).xyz;
    vec3 rgbM = texture2D(diffuse, textureUV).xyz;

    float lumaNW = dot(rgbNW, LUMA);
    float lumaNE = dot(rgbNE, LUMA);
    float lumaSW = dot(rgbSW, LUMA);
    float lumaSE = dot(rgbSE, LUMA);
    float lumaM  = dot(rgbM, LUMA);

    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    vec2 dir;
    dir.x = -lumaNW - lumaNE + lumaSW + lumaSE;
    dir.y = lumaNW + lumaSW - lumaNE - lumaSE;

    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.25 * FXAA_REDUCE_MUL, FXAA_REDUCE_MIN);

    float rcpDirMin = 1 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

    dir = min(vec2(maxSpan, maxSpan), max(vec2(-maxSpan, -maxSpan), dir * rcpDirMin)) / resolution;

    vec3 rgbA = 0.5 * (texture2D(diffuse, textureUV.xy + dir * ONE_THIRD_MINUS_HALF).xyz + texture2D(diffuse, textureUV.xy + dir * TWO_THIRDS_MINUS_HALF).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(diffuse, textureUV.xy + dir * ZERO_THIRDS_MINUS_HALF).xyz + texture2D(diffuse, textureUV.xy + dir * THREE_THIRDS_MINUS_HALF).xyz);
    float lumaB = dot(rgbB, LUMA);

    if (lumaB < lumaMin || lumaB > lumaMax) {
        gl_FragColor = vec4(rgbA, 1);
    } else {
        gl_FragColor = vec4(rgbB, 1);
    }
}