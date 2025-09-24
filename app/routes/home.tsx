import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hello World" },
    { name: "description", content: "A simple hello world page" },
  ];
}

export default function Home() {
  return <div>hello world</div>;
}
