import fs from "fs";

export default function createComponent(name: string): void {
  if (!name) {
    console.log("You need to say the name!");
    return;
  }

  name = name[0].toUpperCase() + name.slice(1);
  const dir = `./components/${name}`;

  if (fs.existsSync(dir)) {
    console.log("The resource you are trying to create already exists!");
    return;
  }

  if (!fs.existsSync("./src")) {
    fs.mkdirSync("./src");
  }

  if (!fs.existsSync("./components")) {
    fs.mkdirSync("./components");
  }

  fs.mkdirSync(dir);

  const nextComponent = `import { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}

export default function ${name}({ title, ...rest }: Props) {
  return (
    <button {...rest} className={styles.${name.toLowerCase()}}>{title}</button>
  );
}`;

  const stylesModule = `.${name.toLowerCase()} {
  border: 2px solid red;
  background: red;
  border-radius: 0.3rem;
  color: blue;
  transition: 0.3s;
  cursor: pointer;
}

.${name.toLowerCase()}:hover {
  opacity: 0.8;
}`;

  fs.writeFileSync(`./components/${name}/index.tsx`, nextComponent);

  fs.writeFileSync(`./components/${name}/styles.module.css`, stylesModule);

  console.log(`Abra Kadabra!... button: ${name} created!`);
}
