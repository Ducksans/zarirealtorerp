import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 1회성 응급 스크립트 보관소 (재실행 금지 문서 참조)
    "scripts/_archive/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      // React 컴파일러 신규 규칙 — localStorage 초기화 등 표준 패턴까지 잡으므로 경고로 운영
      "react-hooks/set-state-in-effect": "warn"
    }
  },
  {
    // CJS 설정 파일은 require 허용
    files: ["*.config.js", "tailwind.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    // [M16 기능 동결] 관제탑 컴포넌트는 리팩터링 금지 대상 — 신규 코드에는 적용 유지
    files: ["src/components/dev/**", "src/app/dev/**"],
    rules: {
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      "@typescript-eslint/ban-ts-comment": "off"
    }
  }
]);

export default eslintConfig;
