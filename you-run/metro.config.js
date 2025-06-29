// Expo 프로젝트의 기본 설정을 가져옵니다.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 일부 older 버전에서는 assetExts가 함수일 수 있으니, 배열로 보장
config.resolver.assetExts = config.resolver.assetExts || [];

// 'glb'와 'gltf' 파일을 asset으로 처리할 수 있도록 확장자 추가
config.resolver.assetExts.push('glb', 'gltf');

// 필요 시, 다른 3D 확장자도 여기에 추가 가능 (예: 'bin', 'fbx')
// config.resolver.assetExts.push('bin', 'fbx');

// 수정된 설정을 내보냅니다.
module.exports = config;
