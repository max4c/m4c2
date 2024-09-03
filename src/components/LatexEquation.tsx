import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexEquationProps {
  equation: string;
  block?: boolean;
}

const LatexEquation: React.FC<LatexEquationProps> = ({ equation, block = false }) => {
  return block ? <BlockMath math={equation} /> : <InlineMath math={equation} />;
};

export default LatexEquation;
