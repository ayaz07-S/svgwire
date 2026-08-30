import type { ConversionOptions } from './index';

export function generateSpriteWrapper(framework: string, options: ConversionOptions): { code: string, extension: string, language: string } {
  const componentName = options.componentName || 'Icon';
  const ts = options.typescript;
  const spritePath = "const SPRITE_PATH = '/sprite.svg';";

  switch (framework) {
    case 'vue':
      return {
        extension: '.vue',
        language: 'html',
        code: `<script setup${ts ? ' lang="ts"' : ''}>
import type { IconName } from './icon-names';

${spritePath}

${ts ? `interface Props {
  name: IconName;
  size?: number | string;
}
defineProps<Props>();` : `defineProps(['name', 'size']);`}
</script>

<template>
  <svg
    aria-hidden="true"
    :width="size || 24"
    :height="size || 24"
    v-bind="$attrs"
  >
    <use :href="\`\${SPRITE_PATH}#icon-\${name}\`" />
  </svg>
</template>
`,
      };

    case 'svelte':
      return {
        extension: '.svelte',
        language: 'html',
        code: `<script${ts ? ' lang="ts"' : ''}>
  ${ts ? `import type { IconName } from './icon-names';
  import type { SVGAttributes } from 'svelte/elements';

  interface Props extends SVGAttributes<SVGSVGElement> {
    name: IconName;
    size?: number | string;
    class?: string;
  }
  let { name, size = 24, class: className, ...restProps }: Props = $props();` : 
  `let { name, size = 24, class: className, ...restProps } = $props();`}

  ${spritePath}
</script>

<svg
  aria-hidden="true"
  width={size}
  height={size}
  class={className}
  {...restProps}
>
  <use href={\`\${SPRITE_PATH}#icon-\${name}\`} />
</svg>
`,
      };

    case 'react-native':
      return {
        extension: ts ? '.tsx' : '.jsx',
        language: ts ? 'tsx' : 'jsx',
        code: `${ts ? 'import type React from "react";\n' : ''}import Svg, { Use } from 'react-native-svg';
${ts ? `import type { IconName } from './icon-names';

interface ${componentName}Props {
  name: IconName;
  size?: number | string;
  color?: string;
  [key: string]: any;
}` : ''}
${spritePath}

const ${componentName} = ({ name, size = 24, color, ...props }${ts ? `: ${componentName}Props` : ''}) => {
  return (
    <Svg width={size} height={size} {...props}>
      <Use href={\`\${SPRITE_PATH}#icon-\${name}\`} fill={color} />
    </Svg>
  );
};

export default ${componentName};
`,
      };

    case 'tailwind-react':
    case 'react':
    default:
      return {
        extension: ts ? '.tsx' : '.jsx',
        language: ts ? 'tsx' : 'jsx',
        code: `${ts ? 'import type React from "react";\n' : ''}${ts ? `import type { IconName } from './icon-names';\n` : ''}
${spritePath}

${ts ? `interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}` : ''}

const ${componentName} = ({ name, size = 24, className, ...props }${ts ? `: ${componentName}Props` : ''}) => {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <use href={\`\${SPRITE_PATH}#icon-\${name}\`} />
    </svg>
  );
};

export default ${componentName};
`,
      };
  }
}
