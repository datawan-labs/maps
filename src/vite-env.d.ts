/// <reference types="vite/client" />

declare module "*.mdx" {
  let MDXComponent: (props: object) => JSX.Element;
  export default MDXComponent;
}
