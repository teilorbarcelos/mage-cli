import { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}

export default function TestButton({ title, ...rest }: Props) {
  return (
    <button {...rest} className={styles.testbutton}>{title}</button>
  );
}