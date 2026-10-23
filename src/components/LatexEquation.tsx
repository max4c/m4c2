import 'katex/dist/katex.min.css';
import katex from 'katex';

interface LatexEquationProps {
  equation: string;
  block?: boolean;
}

const LatexEquation: React.FC<LatexEquationProps> = ({ equation, block = false }) => {
  const html = katex.renderToString(equation, { displayMode: block, throwOnError: false });
  const Tag = block ? 'div' : 'span';
  return <Tag dangerouslySetInnerHTML={{ __html: html }} />;
};

export default LatexEquation;
