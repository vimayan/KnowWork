import dynamic from 'next/dynamic';
import '../styles/globals.css';

const ClientRouter = dynamic(
  () => import('react-router-dom').then(mod => {
    const { BrowserRouter } = mod;
    return function RouterWrapper({ children }) {
      return <BrowserRouter>{children}</BrowserRouter>;
    };
  }),
  { ssr: false, loading: () => null }
);

export default function App({ Component, pageProps }) {
  return (
    <ClientRouter>
      <Component {...pageProps} />
    </ClientRouter>
  );
}
