import Link from 'next/link';
import SocialIcons from '@/components/SocialIcons';

export default function Home() {
  return (
    <div className="content-wrapper">
    <h1 className="text-2xl font-bold mb-2">Undergrad AI Researcher</h1>
      <p className="mb-4">
        Hey! I&apos;m a junior at Brigham Young University studying computer science
        with an emphasis in machine learning.
      </p>

      <p className="mb-4">
        Currently, I am doing AI research in the <a href="https://github.com/BYU-PCCL">PCC Lab</a> focusing on mechanistic
        interpretability. Previously, I cofounded
        <a href="https://www.gosameday.com"> Sameday AI</a>, participating in Y
        Combinator&apos;s W23 batch and AI Grant&apos;s batch 1.
      </p>

      <p className="mb-4">
        At BYU, I&apos;m a VP of the <a href="https://aia.byu.edu">AI Association</a>, which helps provide students from
        diverse academic backgrounds with practical AI experience.
      </p>

      <p className="mb-4">
        I&apos;m always looking out for interesting projects, people, and ideas.
      </p>
      <p className="mb-4">
        Email me at hello[at]maxforsey[dot]com
      </p>

      <h6 className="text-xl font-semibold mt-6 mb-2">Elsewhere</h6>
      <SocialIcons />

    </div>
  );
}