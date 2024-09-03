import Link from 'next/link';

type BreadcrumbProps = {
  currentPage: string;
};

const Breadcrumbs: React.FC<BreadcrumbProps> = ({ currentPage }) => {
  return (
    <nav className="text-sm mb-4">
      <ol className="list-none p-0 inline-flex">
        <li className="flex items-center">
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            Home
          </Link>
          <span className="mx-2">/</span>
        </li>
        <li className="flex items-center">
          <Link href="/blog" className="text-blue-500 hover:text-blue-600">
            Blog
          </Link>
          <span className="mx-2">/</span>
        </li>
        <li className="text-gray-500">Current Page</li>
      </ol>
    </nav>
  );
};

export default Breadcrumbs;