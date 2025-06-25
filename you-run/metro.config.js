// Expo 프로젝트의 기본 설정을 가져옵니다.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// resolver.assetExts 배열에 'glb'와 'gltf'를 추가합니다.
// 이 배열에 포함된 확장자들은 Metro가 에셋으로 처리합니다.
config.resolver.assetExts.push('glb', 'gltf');

// 수정된 설정을 내보냅니다.
module.exports = config;
